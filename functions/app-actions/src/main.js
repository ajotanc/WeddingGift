import { Client, Databases, ID, Query, Storage, Teams, Users } from "node-appwrite";
import {
	computeGiftAmount,
	getCallerId,
	getTenantAccess,
	normalizeEmail,
	parseBody,
	purchasePermissions,
	tenantRowPermissions,
} from "./lib.js";

/**
 * Appwrite Function: app-actions
 * Runtime: Node 22
 *
 * Ações que mexem em dados de outra pessoa e por isso não podem ser feitas direto
 * pelo navegador (as tabelas só deixam cada um editar o que é seu):
 * - sync_access: mantém o time do casal (dono + co-administrador) atualizado.
 * - toggle_like: curtir/descurtir recado ou foto.
 * - delete_content: autor ou casal apagam recado, foto ou RSVP.
 * - confirm_purchase: convidado confirma um presente (PIX estático ou link).
 */

const LIKE_TABLES = new Set(["messages", "gallery"]);
const DELETE_TABLES = new Set(["messages", "gallery", "rsvps"]);
const PURCHASE_METHODS = new Set(["pix", "link"]);

const relationId = (value) => (value && typeof value === "object" ? value.$id : value) || "";

export function createDeps(req) {
	const client = new Client()
		.setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
		.setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
		.setKey(process.env.APPWRITE_API_KEY || req.headers?.["x-appwrite-key"] || "");

	return {
		databases: new Databases(client),
		users: new Users(client),
		teams: new Teams(client),
		storage: new Storage(client),
		databaseId: process.env.APPWRITE_DATABASE_ID,
		bucketId: process.env.APPWRITE_BUCKET_ID,
		newId: () => ID.unique(),
	};
}

export async function syncAccess(deps, tenant) {
	const { teams, users } = deps;
	const teamId = tenant.$id;

	try {
		await teams.get(teamId);
	} catch (err) {
		if (err?.code !== 404) throw err;
		await teams.create(teamId, tenant.slug || teamId);
	}

	const desired = new Set([tenant.$id]);
	const coOwnerEmail = normalizeEmail(tenant.co_owner_email);
	if (coOwnerEmail) {
		const found = await users.list([Query.equal("email", coOwnerEmail)]);
		const coOwner = found.users?.find((u) => u.emailVerification === true);
		if (coOwner) desired.add(coOwner.$id);
	}

	const { memberships = [] } = await teams.listMemberships(teamId);
	const current = new Set(memberships.map((m) => m.userId));

	for (const membership of memberships) {
		if (!desired.has(membership.userId)) {
			await teams.deleteMembership(teamId, membership.$id);
		}
	}
	for (const userId of desired) {
		if (!current.has(userId)) {
			await teams.createMembership(teamId, ["owner"], undefined, userId);
		}
	}

	// Linha do tenant passa a ser editável pelo time (e não só pelo dono).
	const perms = tenantRowPermissions(teamId);
	const existingPerms = tenant.$permissions || [];
	if (perms.some((p) => !existingPerms.includes(p)) || existingPerms.length !== perms.length) {
		await deps.databases.updateDocument(deps.databaseId, "tenants", teamId, {}, perms);
	}

	return [...desired];
}

export async function handle({ req, res, log, error }, deps) {
	if (req.method !== "POST") {
		return res.json({ error: "Método não suportado. Use POST." }, 405);
	}

	const userId = getCallerId(req);
	if (!userId) return res.json({ error: "Não autenticado." }, 401);

	const body = parseBody(req);
	if (!body) return res.json({ error: "JSON inválido." }, 400);

	const { databases, users, databaseId } = deps;
	const { action } = body;

	try {
		if (action === "sync_access") {
			const access = await getTenantAccess({
				databases,
				users,
				databaseId,
				tenantId: body.tenantId,
				userId,
			});
			if (!access.isMember) return res.json({ error: "Acesso negado." }, 403);

			const members = await syncAccess(deps, access.tenant);
			return res.json({ success: true, members }, 200);
		}

		if (action === "toggle_like") {
			if (!LIKE_TABLES.has(body.table) || !body.rowId) {
				return res.json({ error: "Parâmetros inválidos." }, 400);
			}
			const row = await databases.getDocument(databaseId, body.table, body.rowId);
			const likes = new Set(Array.isArray(row.likes) ? row.likes : []);
			if (likes.has(userId)) likes.delete(userId);
			else likes.add(userId);

			const updated = await databases.updateDocument(databaseId, body.table, body.rowId, {
				likes: [...likes],
			});
			return res.json({ success: true, likes: updated.likes ?? [...likes] }, 200);
		}

		if (action === "delete_content") {
			if (!DELETE_TABLES.has(body.table) || !body.rowId) {
				return res.json({ error: "Parâmetros inválidos." }, 400);
			}
			const row = await databases.getDocument(databaseId, body.table, body.rowId);
			const isAuthor = relationId(row.guest) === userId;
			const isMember =
				!isAuthor &&
				(
					await getTenantAccess({
						databases,
						users,
						databaseId,
						tenantId: relationId(row.tenant),
						userId,
					})
				).isMember;

			if (!isAuthor && !isMember) return res.json({ error: "Acesso negado." }, 403);

			const fileId =
				body.table === "gallery"
					? `photo-${row.$id}`
					: body.table === "messages" && row.audio_url
						? `audio-${row.$id}`
						: null;
			if (fileId && deps.bucketId) {
				try {
					await deps.storage.deleteFile(deps.bucketId, fileId);
				} catch (err) {
					log(`Arquivo ${fileId} não removido: ${err.message}`);
				}
			}

			await databases.deleteDocument(databaseId, body.table, row.$id);
			return res.json({ success: true }, 200);
		}

		if (action === "confirm_purchase") {
			const method = body.method || "pix";
			if (!body.productId || !PURCHASE_METHODS.has(method)) {
				return res.json({ error: "Parâmetros inválidos." }, 400);
			}

			const product = await databases.getDocument(databaseId, "products", body.productId);
			const tenantId = relationId(product.tenant);
			const gift = computeGiftAmount(product, body.quantity ?? 1, body.amount);
			if (gift.error) return res.json({ error: gift.error }, 400);

			const purchase = await databases.createDocument(
				databaseId,
				"purchases",
				deps.newId(),
				{
					tenant: tenantId,
					guest: userId,
					product: product.$id,
					quantity: gift.quantity,
					price_paid: String(gift.amount),
					method,
				},
				purchasePermissions(tenantId, userId),
			);

			let updatedProduct = product;
			if (gift.claims) {
				updatedProduct = await databases.updateDocument(databaseId, "products", product.$id, {
					claimed_quantity: (product.claimed_quantity || 0) + gift.quantity,
				});
			}

			return res.json({ success: true, purchase, product: updatedProduct }, 200);
		}

		return res.json({ error: "Ação não informada ou inválida ('action')." }, 400);
	} catch (err) {
		if (err?.code === 404) return res.json({ error: "Registro não encontrado." }, 404);
		error(`Erro em app-actions (${action}): ${err.message}`);
		return res.json({ error: "Erro interno." }, 500);
	}
}

export default async (ctx) => handle(ctx, createDeps(ctx.req));

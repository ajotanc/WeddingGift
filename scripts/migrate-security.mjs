#!/usr/bin/env node
/**
 * Migração de segurança dos dados existentes no Appwrite.
 *
 * O que faz, para cada casal:
 *  1. Cria o time do casal (id = id do tenant) com dono e co-administrador.
 *  2. Move os tokens do Mercado Pago para `tenant_secrets` e apaga do tenant.
 *  3. Copia o plano Premium atual para `subscriptions` (lista para você revisar).
 * Depois reescreve as permissões de todas as linhas e arquivos para o novo modelo.
 *
 * Por padrão só mostra o que faria. Para gravar: --apply
 *
 *   APPWRITE_ENDPOINT=https://api.ajotanc.com.br/v1 \
 *   APPWRITE_PROJECT_ID=... APPWRITE_API_KEY=... \
 *   APPWRITE_DATABASE_ID=... APPWRITE_BUCKET_ID=... \
 *   node scripts/migrate-security.mjs [--apply]
 */
import { pathToFileURL } from "node:url";
import { Client, Databases, Query, Storage, Teams, Users } from "node-appwrite";
import { syncAccess } from "../functions/app-actions/src/main.js";
import { purchasePermissions, tenantRowPermissions } from "../functions/app-actions/src/lib.js";
import { saveSecrets } from "../functions/mp-oauth/src/main.js";

const relationId = (value) => (value && typeof value === "object" ? value.$id : value) || "";

export const guestRowPermissions = (userId) => [
	'read("any")',
	`update("user:${userId}")`,
	`delete("user:${userId}")`,
];

/** Permissões que cada linha deve ter no novo modelo (null = não mexer). */
export function planRowPermissions(table, row, ctx = {}) {
	const tenantId = relationId(row.tenant);
	const guestId = relationId(row.guest);

	switch (table) {
		case "tenants":
			return tenantRowPermissions(row.$id);
		case "products":
		case "faqs":
		case "schedules":
		case "quizzes":
			return tenantId ? tenantRowPermissions(tenantId) : null;
		case "product_links": {
			const owner = ctx.productTenant?.get(relationId(row.product));
			return owner ? tenantRowPermissions(owner) : null;
		}
		case "gallery":
			if (guestId) return guestRowPermissions(guestId);
			return tenantId ? tenantRowPermissions(tenantId) : null;
		case "guests":
			return guestRowPermissions(row.$id);
		case "rsvps":
		case "messages":
			return guestId ? guestRowPermissions(guestId) : null;
		case "purchases":
			return tenantId ? purchasePermissions(tenantId, guestId) : null;
		default:
			return null;
	}
}

/** Permissões de um arquivo pelo prefixo do id (`kind-rowId`). */
export function planFilePermissions(fileId, ctx) {
	const dash = fileId.indexOf("-");
	if (dash < 1) return null;
	const kind = fileId.slice(0, dash);
	const rowId = fileId.slice(dash + 1);

	if (kind === "background" || kind === "logo") return tenantRowPermissions(rowId);
	if (kind === "product") {
		const owner = ctx.productTenant.get(rowId);
		return owner ? tenantRowPermissions(owner) : null;
	}
	if (kind === "photo") return ctx.galleryPerms.get(rowId) || null;
	if (kind === "audio") return ctx.messagePerms.get(rowId) || null;
	return null;
}

const samePermissions = (a = [], b = []) =>
	a.length === b.length && a.every((p) => b.includes(p));

async function* listAll(databases, databaseId, table) {
	let cursor;
	while (true) {
		const queries = [Query.limit(100)];
		if (cursor) queries.push(Query.cursorAfter(cursor));
		const page = await databases.listDocuments(databaseId, table, queries);
		for (const doc of page.documents) yield doc;
		if (page.documents.length < 100) return;
		cursor = page.documents.at(-1).$id;
	}
}

async function* listAllFiles(storage, bucketId) {
	let cursor;
	while (true) {
		const queries = [Query.limit(100)];
		if (cursor) queries.push(Query.cursorAfter(cursor));
		const page = await storage.listFiles(bucketId, queries);
		for (const file of page.files) yield file;
		if (page.files.length < 100) return;
		cursor = page.files.at(-1).$id;
	}
}

async function main() {
	const apply = process.argv.includes("--apply");
	const env = process.env;
	for (const key of [
		"APPWRITE_ENDPOINT",
		"APPWRITE_PROJECT_ID",
		"APPWRITE_API_KEY",
		"APPWRITE_DATABASE_ID",
		"APPWRITE_BUCKET_ID",
	]) {
		if (!env[key]) throw new Error(`Variável ${key} não definida.`);
	}

	const client = new Client()
		.setEndpoint(env.APPWRITE_ENDPOINT)
		.setProject(env.APPWRITE_PROJECT_ID)
		.setKey(env.APPWRITE_API_KEY);
	const databases = new Databases(client);
	const deps = {
		databases,
		users: new Users(client),
		teams: new Teams(client),
		databaseId: env.APPWRITE_DATABASE_ID,
	};
	const storage = new Storage(client);
	const db = env.APPWRITE_DATABASE_ID;

	console.log(apply ? "== APLICANDO ALTERAÇÕES ==" : "== SIMULAÇÃO (use --apply para gravar) ==");

	const premiumToReview = [];
	for await (const tenant of listAll(databases, db, "tenants")) {
		const label = `${tenant.slug || "(sem slug)"} [${tenant.$id}]`;

		if (apply) await syncAccess(deps, tenant);
		console.log(`time do casal: ${label}`);

		if (tenant.mp_access_token) {
			console.log(`  tokens do Mercado Pago -> tenant_secrets`);
			if (apply) {
				await saveSecrets(databases, db, tenant.$id, {
					mp_user_id: tenant.mp_user_id || null,
					mp_access_token: tenant.mp_access_token,
					mp_refresh_token: tenant.mp_refresh_token || null,
				});
				await databases.updateDocument(db, "tenants", tenant.$id, {
					mp_access_token: null,
					mp_refresh_token: null,
				});
			}
		}

		if (tenant.plan === "premium") {
			premiumToReview.push(`${label} até ${tenant.premium_until || "sem data"}`);
			if (apply) {
				try {
					await databases.createDocument(
						db,
						"subscriptions",
						tenant.$id,
						{ plan: "premium", premium_until: tenant.premium_until || null, last_payment_id: "migracao" },
						['read("any")'],
					);
				} catch (err) {
					if (err?.code !== 409) throw err;
				}
			}
		}
	}

	const ctx = { productTenant: new Map(), galleryPerms: new Map(), messagePerms: new Map() };
	const tables = [
		"tenants",
		"products",
		"product_links",
		"faqs",
		"schedules",
		"quizzes",
		"gallery",
		"guests",
		"rsvps",
		"messages",
		"purchases",
	];

	for (const table of tables) {
		let changed = 0;
		let skipped = 0;
		for await (const row of listAll(databases, db, table)) {
			if (table === "products") ctx.productTenant.set(row.$id, relationId(row.tenant));
			const perms = planRowPermissions(table, row, ctx);
			if (table === "gallery" && perms) ctx.galleryPerms.set(row.$id, perms);
			if (table === "messages" && perms) ctx.messagePerms.set(row.$id, perms);

			if (!perms) {
				skipped++;
				continue;
			}
			if (samePermissions(row.$permissions, perms)) continue;
			changed++;
			if (apply) await databases.updateDocument(db, table, row.$id, {}, perms);
		}
		console.log(`${table}: ${changed} linha(s) a atualizar, ${skipped} sem dono identificado`);
	}

	let filesChanged = 0;
	const unknownFiles = [];
	for await (const file of listAllFiles(storage, env.APPWRITE_BUCKET_ID)) {
		const perms = planFilePermissions(file.$id, ctx);
		if (!perms) {
			unknownFiles.push(file.$id);
			continue;
		}
		if (samePermissions(file.$permissions, perms)) continue;
		filesChanged++;
		if (apply) await storage.updateFile(env.APPWRITE_BUCKET_ID, file.$id, undefined, perms);
	}
	console.log(`arquivos: ${filesChanged} a atualizar, ${unknownFiles.length} sem dono identificado`);
	if (unknownFiles.length) console.log(`  revisar: ${unknownFiles.join(", ")}`);

	if (premiumToReview.length) {
		console.log("\nCasais Premium copiados para `subscriptions` (confira com os pagamentos reais):");
		for (const line of premiumToReview) console.log(`  - ${line}`);
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}

import { Client, Databases, ID, Users } from "node-appwrite";
import {
	PLAN_PRICES,
	computeGiftAmount,
	getCallerId,
	getTenantAccess,
	parseBody,
} from "./lib.js";

/**
 * Appwrite Function: mp-payment-create
 * Runtime: Node 22
 *
 * 1. create_gift_pix: PIX dinâmico de presente na conta Mercado Pago do casal.
 *    O valor é calculado aqui a partir do produto, nunca a partir do navegador.
 * 2. create_subscription_checkout: Checkout Pro da assinatura (só dono/co-administrador).
 */

const DEFAULT_ALLOWED_HOSTS = "eternosim.com.br,eternosim.ajotanc.com.br,localhost";
const PLAN_NAMES = {
	quarterly: "Plano Trimestral (3 meses)",
	semestral: "Plano Semestral (6 meses)",
};

const relationId = (value) => (value && typeof value === "object" ? value.$id : value) || "";

export function createDeps(req) {
	const client = new Client()
		.setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
		.setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
		.setKey(process.env.APPWRITE_API_KEY || req.headers?.["x-appwrite-key"] || "");

	return {
		databases: new Databases(client),
		users: new Users(client),
		databaseId: process.env.APPWRITE_DATABASE_ID,
		fetch: globalThis.fetch,
		env: process.env,
		newId: () => ID.unique(),
	};
}

/** Evita redirecionar o usuário para outro site depois do checkout. */
export function safeRedirect(url, allowedHosts, fallback) {
	try {
		const parsed = new URL(url);
		const hosts = String(allowedHosts || DEFAULT_ALLOWED_HOSTS)
			.split(",")
			.map((h) => h.trim().toLowerCase())
			.filter(Boolean);
		const host = parsed.hostname.toLowerCase();
		const allowed = hosts.some((h) => host === h || host.endsWith(`.${h}`));
		const secure = parsed.protocol === "https:" || host === "localhost";
		return allowed && secure ? parsed : new URL(fallback);
	} catch {
		return new URL(fallback);
	}
}

async function getSellerToken(databases, databaseId, tenantId) {
	try {
		const secrets = await databases.getDocument(databaseId, "tenant_secrets", tenantId);
		if (secrets.mp_access_token) return secrets.mp_access_token;
	} catch (err) {
		if (err?.code !== 404) throw err;
	}
	return null;
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

	if (action === "create_gift_pix") {
		if (!body.productId) {
			return res.json({ error: "Parâmetro 'productId' é obrigatório." }, 400);
		}

		try {
			const product = await databases.getDocument(databaseId, "products", body.productId);
			const tenantId = relationId(product.tenant);
			if (body.tenantId && body.tenantId !== tenantId) {
				return res.json({ error: "Produto não pertence a este casal." }, 400);
			}

			const gift = computeGiftAmount(product, body.quantity ?? 1, body.amount ?? body.price);
			if (gift.error) return res.json({ error: gift.error }, 400);

			const mpAccessToken = await getSellerToken(databases, databaseId, tenantId);
			if (!mpAccessToken) {
				return res.json(
					{ error: "O casal ainda não conectou a conta do Mercado Pago.", hasMpConnected: false },
					400,
				);
			}

			const payer = await users.get(userId);

			const mpResponse = await deps.fetch("https://api.mercadopago.com/v1/payments", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${mpAccessToken}`,
					"Content-Type": "application/json",
					Accept: "application/json",
					"X-Idempotency-Key": deps.newId(),
				},
				body: JSON.stringify({
					transaction_amount: gift.amount,
					description: `Presente de Casamento: ${product.name || "Cota de Presente"}`,
					payment_method_id: "pix",
					payer: {
						email: payer.email || "convidado@eternosim.com.br",
						first_name: payer.name || "Convidado",
					},
					external_reference: JSON.stringify({
						type: "gift",
						tenantId,
						productId: product.$id,
						quantity: gift.quantity,
						guestId: userId,
						amount: gift.amount,
					}),
				}),
			});

			const mpData = await mpResponse.json();
			if (!mpResponse.ok) {
				error(`Erro da API Mercado Pago: status=${mpResponse.status}`);
				return res.json(
					{ error: mpData.message || "Falha ao gerar cobrança PIX no Mercado Pago." },
					400,
				);
			}

			const pixData = mpData.point_of_interaction?.transaction_data;
			log(`Cobrança PIX criada. Payment ID: ${mpData.id}`);

			return res.json(
				{
					success: true,
					paymentId: mpData.id,
					amount: gift.amount,
					qr_code: pixData?.qr_code || "",
					qr_code_base64: pixData?.qr_code_base64 || "",
					ticket_url: pixData?.ticket_url || "",
				},
				200,
			);
		} catch (err) {
			if (err?.code === 404) return res.json({ error: "Produto não encontrado." }, 404);
			error(`Exceção ao criar PIX do presente: ${err.message}`);
			return res.json({ error: "Erro interno ao processar PIX." }, 500);
		}
	}

	if (action === "create_subscription_checkout") {
		const { tenantId, plan } = body;
		if (!tenantId || !PLAN_PRICES[plan]) {
			return res.json({ error: "Parâmetros 'tenantId' e 'plan' são obrigatórios." }, 400);
		}

		const access = await getTenantAccess({ databases, users, databaseId, tenantId, userId });
		if (!access.isMember) return res.json({ error: "Acesso negado." }, 403);

		const platformToken = deps.env.MP_CLIENT_SECRET;
		if (!platformToken) {
			return res.json({ error: "MP_CLIENT_SECRET da plataforma não configurado." }, 500);
		}

		const base = safeRedirect(
			body.redirectUrl,
			deps.env.APP_ALLOWED_HOSTS,
			"https://eternosim.com.br/admin/config?tab=subscription",
		);
		const backUrl = (status) => {
			const url = new URL(base);
			url.searchParams.set("status", status);
			return url.toString();
		};

		try {
			const prefResponse = await deps.fetch("https://api.mercadopago.com/checkout/preferences", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${platformToken}`,
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					items: [
						{
							title: `EternoSim - Assinatura Premium (${PLAN_NAMES[plan]})`,
							quantity: 1,
							unit_price: PLAN_PRICES[plan],
							currency_id: "BRL",
						},
					],
					external_reference: JSON.stringify({ type: "subscription", tenantId, plan }),
					back_urls: {
						success: backUrl("success"),
						failure: backUrl("failure"),
						pending: backUrl("pending"),
					},
					auto_return: "approved",
				}),
			});

			const prefData = await prefResponse.json();
			if (!prefResponse.ok) {
				error(`Erro ao criar preferência: status=${prefResponse.status}`);
				return res.json({ error: "Falha ao gerar checkout de assinatura." }, 400);
			}

			return res.json(
				{
					success: true,
					preferenceId: prefData.id,
					init_point: prefData.init_point,
					sandbox_init_point: prefData.sandbox_init_point,
				},
				200,
			);
		} catch (err) {
			error(`Exceção ao criar checkout de assinatura: ${err.message}`);
			return res.json({ error: "Erro interno ao processar assinatura." }, 500);
		}
	}

	return res.json({ error: "Ação não informada ou inválida ('action')." }, 400);
}

export default async (ctx) => handle(ctx, createDeps(ctx.req));

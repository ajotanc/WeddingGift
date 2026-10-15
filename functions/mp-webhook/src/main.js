import { Client, Databases, ID, Query } from "node-appwrite";
import {
	PLAN_PRICES,
	isCustomAmountProduct,
	nextPremiumUntil,
	parseBody,
	purchasePermissions,
	unitPrice,
	verifyMpSignature,
} from "./lib.js";

/**
 * Appwrite Function: mp-webhook
 * Runtime: Node 22
 *
 * Recebe notificações de pagamento do Mercado Pago:
 * 1. Presente (convidado -> noivos): marca o presente e registra a compra.
 * 2. Assinatura Premium (noivos -> plataforma): grava o plano em `subscriptions`.
 *
 * Proteções: assinatura x-signature (quando MP_WEBHOOK_SECRET está configurado),
 * cada pagamento é processado uma única vez (tabela `processed_payments`) e o valor
 * pago precisa cobrir o valor esperado.
 */

const AMOUNT_TOLERANCE = 0.01;
const relationId = (value) => (value && typeof value === "object" ? value.$id : value) || "";

export function createDeps(req) {
	const client = new Client()
		.setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
		.setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
		.setKey(process.env.APPWRITE_API_KEY || req.headers?.["x-appwrite-key"] || "");

	return {
		databases: new Databases(client),
		databaseId: process.env.APPWRITE_DATABASE_ID,
		fetch: globalThis.fetch,
		env: process.env,
		newId: () => ID.unique(),
		now: () => new Date(),
	};
}

async function fetchPayment(deps, paymentId, sellerMpUserId) {
	const get = (token) =>
		deps.fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
			method: "GET",
			headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
		});

	const platformToken = deps.env.MP_CLIENT_SECRET;
	if (platformToken) {
		const res = await get(platformToken);
		if (res.ok) return await res.json();
	}

	// Pagamentos de presente são criados na conta do casal; tenta com o token dele.
	if (sellerMpUserId) {
		const found = await deps.databases.listDocuments(deps.databaseId, "tenant_secrets", [
			Query.equal("mp_user_id", String(sellerMpUserId)),
			Query.limit(1),
		]);
		const token = found.documents?.[0]?.mp_access_token;
		if (token) {
			const res = await get(token);
			if (res.ok) return await res.json();
		}
	}
	return null;
}

async function processGift(deps, payment, ref, log) {
	const { databases, databaseId } = deps;
	const product = await databases.getDocument(databaseId, "products", ref.productId);
	const tenantId = relationId(product.tenant);
	if (tenantId !== ref.tenantId) return "tenant_mismatch";

	const quantity = Math.max(1, Number.parseInt(ref.quantity, 10) || 1);
	const custom = isCustomAmountProduct(product);
	const expected = custom ? Number(ref.amount) || 0 : unitPrice(product) * quantity;
	const paid = Number(payment.transaction_amount) || 0;

	if (paid + AMOUNT_TOLERANCE < expected) {
		log(`Valor pago (${paid}) menor que o esperado (${expected}) no produto ${product.$id}.`);
		return "amount_mismatch";
	}

	if (!custom) {
		await databases.updateDocument(databaseId, "products", product.$id, {
			claimed_quantity: (product.claimed_quantity || 0) + quantity,
		});
	}

	await databases.createDocument(
		databaseId,
		"purchases",
		deps.newId(),
		{
			tenant: tenantId,
			guest: ref.guestId || null,
			product: product.$id,
			quantity: custom ? 1 : quantity,
			price_paid: String(paid),
			method: "pix",
		},
		purchasePermissions(tenantId, ref.guestId),
	);
	return "gift_processed";
}

async function processSubscription(deps, payment, ref) {
	const { databases, databaseId } = deps;
	const price = PLAN_PRICES[ref.plan];
	if (!price || !ref.tenantId) return "invalid_reference";

	const paid = Number(payment.transaction_amount) || 0;
	if (paid + AMOUNT_TOLERANCE < price) return "amount_mismatch";

	let current = null;
	try {
		current = await databases.getDocument(databaseId, "subscriptions", ref.tenantId);
	} catch (err) {
		if (err?.code !== 404) throw err;
	}

	const data = {
		plan: "premium",
		premium_until: nextPremiumUntil(current?.premium_until, ref.plan, deps.now()),
		last_payment_id: String(payment.id),
	};

	if (current) {
		await databases.updateDocument(databaseId, "subscriptions", ref.tenantId, data);
	} else {
		await databases.createDocument(databaseId, "subscriptions", ref.tenantId, data, [
			'read("any")',
		]);
	}

	// Cópia só para exibição; o app considera apenas a tabela `subscriptions`.
	await databases.updateDocument(databaseId, "tenants", ref.tenantId, {
		plan: data.plan,
		premium_until: data.premium_until,
	});
	return "subscription_processed";
}

export async function handle({ req, res, log, error }, deps) {
	const body = parseBody(req) || {};
	const query = req.query || {};

	const topic = body.type || body.topic || query.type || query.topic || "";
	const paymentId = String(query["data.id"] || body.data?.id || query.id || body.id || "");

	if (!paymentId || (topic && topic !== "payment")) {
		return res.json({ received: true, status: "ignored" }, 200);
	}

	const secret = deps.env.MP_WEBHOOK_SECRET;
	if (secret) {
		const valid = verifyMpSignature({
			signature: req.headers?.["x-signature"],
			requestId: req.headers?.["x-request-id"],
			dataId: paymentId,
			secret,
		});
		if (!valid) {
			log(`Assinatura inválida para o pagamento ${paymentId}.`);
			return res.json({ received: false, error: "invalid_signature" }, 401);
		}
	} else {
		log("MP_WEBHOOK_SECRET não configurado: assinatura do webhook não verificada.");
	}

	const { databases, databaseId } = deps;

	try {
		const payment = await fetchPayment(deps, paymentId, body.user_id);
		if (!payment) {
			error(`Não foi possível consultar o pagamento ${paymentId}.`);
			return res.json({ received: true, status: "payment_fetch_failed" }, 200);
		}
		if (payment.status !== "approved") {
			return res.json({ received: true, status: payment.status }, 200);
		}

		let ref = {};
		try {
			ref =
				typeof payment.external_reference === "string"
					? JSON.parse(payment.external_reference)
					: payment.external_reference || {};
		} catch {
			ref = {};
		}

		const markerId = `mp-${paymentId}`;
		try {
			await databases.createDocument(
				databaseId,
				"processed_payments",
				markerId,
				{ type: ref.type || "unknown", status: "processing", tenant: ref.tenantId || "" },
				[],
			);
		} catch (err) {
			if (err?.code === 409) {
				return res.json({ received: true, status: "already_processed" }, 200);
			}
			throw err;
		}

		let status = "ignored";
		try {
			if (ref.type === "gift" && ref.productId) {
				status = await processGift(deps, payment, ref, log);
			} else if (ref.type === "subscription") {
				status = await processSubscription(deps, payment, ref);
			}
		} catch (err) {
			// Libera o pagamento para a próxima tentativa do Mercado Pago.
			await databases.deleteDocument(databaseId, "processed_payments", markerId).catch(() => {});
			throw err;
		}

		await databases.updateDocument(databaseId, "processed_payments", markerId, { status });
		return res.json({ received: true, paymentId, status }, 200);
	} catch (err) {
		error(`Exceção em mp-webhook: ${err.message}`);
		return res.json({ received: true, error: "internal_error" }, 500);
	}
}

export default async (ctx) => handle(ctx, createDeps(ctx.req));

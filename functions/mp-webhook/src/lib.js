// Helpers compartilhados entre as Functions. Cada Function é publicada a partir da
// própria pasta, então este arquivo é copiado em cada uma (um teste garante que as
// cópias continuam idênticas).
import { createHmac, timingSafeEqual } from "node:crypto";

export function parseBody(req) {
	try {
		if (typeof req.bodyRaw === "string" && req.bodyRaw.trim()) {
			return JSON.parse(req.bodyRaw);
		}
		if (typeof req.body === "string" && req.body.trim()) {
			return JSON.parse(req.body);
		}
		if (req.body && typeof req.body === "object") return req.body;
		return {};
	} catch {
		return null;
	}
}

export function getCallerId(req) {
	return req.headers?.["x-appwrite-user-id"] || "";
}

export function normalizeEmail(email) {
	return String(email || "")
		.trim()
		.toLowerCase();
}

/**
 * Dono do casal (id do usuário == id do tenant) ou co-administrador com o mesmo
 * e-mail cadastrado em `co_owner_email`. O e-mail precisa estar verificado, senão
 * qualquer pessoa poderia criar uma conta com o e-mail do co-administrador.
 */
export async function getTenantAccess({ databases, users, databaseId, tenantId, userId }) {
	if (!tenantId || !userId) return { tenant: null, isMember: false };

	let tenant;
	try {
		tenant = await databases.getDocument(databaseId, "tenants", tenantId);
	} catch {
		return { tenant: null, isMember: false };
	}

	if (tenant.$id === userId) return { tenant, isMember: true };

	const coOwner = normalizeEmail(tenant.co_owner_email);
	if (!coOwner) return { tenant, isMember: false };

	try {
		const user = await users.get(userId);
		const isMember =
			normalizeEmail(user.email) === coOwner && user.emailVerification === true;
		return { tenant, isMember };
	} catch {
		return { tenant, isMember: false };
	}
}

/** Preço unitário: produto físico usa o preço cheio, cota divide pela quantidade. */
export function unitPrice(product) {
	const base = Number(product.price) || 0;
	if (product.type === "quota") {
		return base / (product.desired_quantity || 1);
	}
	return base;
}

export function isCustomAmountProduct(product) {
	return product.category === "pix" && product.is_custom_amount === true;
}

export const MIN_CUSTOM_AMOUNT = 1;
export const MAX_CUSTOM_AMOUNT = 50000;

/**
 * Calcula no servidor o valor de um presente. Nunca confia no preço enviado pelo
 * navegador, exceto em produtos de valor livre, que ficam limitados a uma faixa.
 */
export function computeGiftAmount(product, quantity, requestedAmount) {
	const qty = Number(quantity);
	if (!Number.isInteger(qty) || qty < 1) {
		return { error: "Quantidade inválida." };
	}

	if (isCustomAmountProduct(product)) {
		const amount = Math.round(Number(requestedAmount) * 100) / 100;
		if (!Number.isFinite(amount) || amount < MIN_CUSTOM_AMOUNT || amount > MAX_CUSTOM_AMOUNT) {
			return { error: "Valor do presente inválido." };
		}
		return { amount, quantity: 1, claims: false };
	}

	const remaining = (product.desired_quantity || 1) - (product.claimed_quantity || 0);
	if (qty > remaining) {
		return { error: "A quantidade desejada foi excedida." };
	}

	const amount = Math.round(unitPrice(product) * qty * 100) / 100;
	if (!(amount > 0)) return { error: "Produto sem preço válido." };

	return { amount, quantity: qty, claims: true };
}

/**
 * Valida o cabeçalho x-signature do webhook do Mercado Pago.
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export function verifyMpSignature({ signature, requestId, dataId, secret }) {
	if (!signature || !secret || !dataId) return false;

	const parts = {};
	for (const piece of String(signature).split(",")) {
		const [key, value] = piece.split("=").map((s) => s?.trim());
		if (key && value) parts[key] = value;
	}
	if (!parts.ts || !parts.v1) return false;

	const id = /^[a-z0-9]+$/i.test(String(dataId)) ? String(dataId).toLowerCase() : String(dataId);
	let manifest = `id:${id};`;
	if (requestId) manifest += `request-id:${requestId};`;
	manifest += `ts:${parts.ts};`;

	const expected = createHmac("sha256", secret).update(manifest).digest("hex");
	const a = Buffer.from(expected);
	const b = Buffer.from(parts.v1);
	return a.length === b.length && timingSafeEqual(a, b);
}

/** Permissões de linhas do casal: leitura pública, edição só pelo time do casal. */
export function tenantRowPermissions(tenantId) {
	return [
		'read("any")',
		`update("team:${tenantId}")`,
		`delete("team:${tenantId}")`,
	];
}

/** Permissões de compras: só o casal e quem comprou podem ver. */
export function purchasePermissions(tenantId, guestId) {
	const perms = [`read("team:${tenantId}")`];
	if (guestId) perms.push(`read("user:${guestId}")`);
	return perms;
}

export const PLAN_PRICES = { quarterly: 99, semestral: 149 };
export const PLAN_MONTHS = { quarterly: 3, semestral: 6 };

/** Renovação soma ao período que ainda não venceu. */
export function nextPremiumUntil(currentUntil, plan, now = new Date()) {
	const months = PLAN_MONTHS[plan];
	if (!months) return null;
	const current = currentUntil ? new Date(currentUntil) : null;
	const base = current && current > now ? new Date(current) : new Date(now);
	base.setUTCMonth(base.getUTCMonth() + months);
	return base.toISOString();
}

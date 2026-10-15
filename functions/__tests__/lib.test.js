// @vitest-environment node
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	computeGiftAmount,
	getTenantAccess,
	nextPremiumUntil,
	parseBody,
	purchasePermissions,
	tenantRowPermissions,
	unitPrice,
	verifyMpSignature,
} from "../app-actions/src/lib.js";
import { createDatabases, createUsers } from "./fakes.js";

describe("cópias do lib.js", () => {
	it("são idênticas em todas as Functions", () => {
		const read = (fn) => readFileSync(new URL(`../${fn}/src/lib.js`, import.meta.url), "utf8");
		const base = read("app-actions");
		for (const fn of ["mp-oauth", "mp-payment-create", "mp-webhook"]) {
			expect(read(fn), fn).toBe(base);
		}
	});
});

describe("parseBody", () => {
	it("lê bodyRaw, body string e objeto", () => {
		expect(parseBody({ bodyRaw: '{"a":1}' })).toEqual({ a: 1 });
		expect(parseBody({ body: '{"b":2}' })).toEqual({ b: 2 });
		expect(parseBody({ body: { c: 3 } })).toEqual({ c: 3 });
		expect(parseBody({})).toEqual({});
	});

	it("retorna null para JSON inválido", () => {
		expect(parseBody({ bodyRaw: "{quebrado" })).toBeNull();
	});
});

describe("getTenantAccess", () => {
	const databases = createDatabases({
		tenants: [{ $id: "owner", co_owner_email: "Co@Email.com " }],
	});
	const users = createUsers([
		{ $id: "co", email: "co@email.com", emailVerification: true },
		{ $id: "fake", email: "co@email.com", emailVerification: false },
		{ $id: "other", email: "x@email.com", emailVerification: true },
	]);
	const access = (userId, tenantId = "owner") =>
		getTenantAccess({ databases, users, databaseId: "db", tenantId, userId });

	it("libera o dono", async () => {
		expect((await access("owner")).isMember).toBe(true);
	});

	it("libera o co-administrador com e-mail verificado", async () => {
		expect((await access("co")).isMember).toBe(true);
	});

	it("bloqueia conta com o mesmo e-mail não verificado", async () => {
		expect((await access("fake")).isMember).toBe(false);
	});

	it("bloqueia outros usuários e casal inexistente", async () => {
		expect((await access("other")).isMember).toBe(false);
		expect((await access("owner", "nao-existe")).isMember).toBe(false);
		expect((await access("")).isMember).toBe(false);
	});
});

describe("unitPrice / computeGiftAmount", () => {
	const physical = { type: "physical", price: "300", desired_quantity: 2, claimed_quantity: 1 };
	const quota = { type: "quota", price: "1000", desired_quantity: 10, claimed_quantity: 4 };
	const custom = { type: "quota", price: "0", category: "pix", is_custom_amount: true };

	it("calcula o preço unitário", () => {
		expect(unitPrice(physical)).toBe(300);
		expect(unitPrice(quota)).toBe(100);
	});

	it("ignora o valor enviado em produtos de preço fixo", () => {
		expect(computeGiftAmount(quota, 3, 0.01)).toEqual({ amount: 300, quantity: 3, claims: true });
	});

	it("bloqueia quantidade acima do que falta", () => {
		expect(computeGiftAmount(physical, 2).error).toMatch(/excedida/);
		expect(computeGiftAmount(quota, 7).error).toMatch(/excedida/);
	});

	it("bloqueia quantidade inválida", () => {
		expect(computeGiftAmount(physical, 0).error).toBeDefined();
		expect(computeGiftAmount(physical, 1.5).error).toBeDefined();
		expect(computeGiftAmount(physical, "abc").error).toBeDefined();
	});

	it("aceita valor livre dentro da faixa e não marca como presenteado", () => {
		expect(computeGiftAmount(custom, 5, 50.555)).toEqual({ amount: 50.56, quantity: 1, claims: false });
		expect(computeGiftAmount(custom, 1, 0.5).error).toBeDefined();
		expect(computeGiftAmount(custom, 1, 1_000_000).error).toBeDefined();
	});

	it("bloqueia produto sem preço", () => {
		expect(computeGiftAmount({ type: "physical", price: "0", desired_quantity: 1 }, 1).error).toBeDefined();
	});
});

describe("verifyMpSignature", () => {
	const secret = "segredo";
	const sign = (manifest) => createHmac("sha256", secret).update(manifest).digest("hex");

	it("aceita assinatura válida", () => {
		const v1 = sign("id:123;request-id:req-1;ts:1700;");
		expect(
			verifyMpSignature({ signature: `ts=1700,v1=${v1}`, requestId: "req-1", dataId: "123", secret }),
		).toBe(true);
	});

	it("usa o id em minúsculas, como o Mercado Pago", () => {
		const v1 = sign("id:abc123;ts:1700;");
		expect(verifyMpSignature({ signature: `ts=1700, v1=${v1}`, dataId: "ABC123", secret })).toBe(true);
	});

	it("rejeita assinatura adulterada, de outro pagamento ou ausente", () => {
		const v1 = sign("id:123;request-id:req-1;ts:1700;");
		const base = { requestId: "req-1", dataId: "123", secret };
		expect(verifyMpSignature({ ...base, signature: `ts=1701,v1=${v1}` })).toBe(false);
		expect(verifyMpSignature({ ...base, dataId: "124", signature: `ts=1700,v1=${v1}` })).toBe(false);
		expect(verifyMpSignature({ ...base, signature: "" })).toBe(false);
		expect(verifyMpSignature({ ...base, signature: "ts=1700" })).toBe(false);
		expect(verifyMpSignature({ ...base, signature: `ts=1700,v1=${v1}`, secret: "" })).toBe(false);
	});
});

describe("permissões", () => {
	it("conteúdo do casal só é editável pelo time", () => {
		expect(tenantRowPermissions("t1")).toEqual([
			'read("any")',
			'update("team:t1")',
			'delete("team:t1")',
		]);
	});

	it("compras só são visíveis para o casal e para quem comprou", () => {
		expect(purchasePermissions("t1", "g1")).toEqual(['read("team:t1")', 'read("user:g1")']);
		expect(purchasePermissions("t1")).toEqual(['read("team:t1")']);
	});
});

describe("nextPremiumUntil", () => {
	const now = new Date("2026-01-15T12:00:00.000Z");

	it("conta a partir de hoje quando não há plano ativo", () => {
		expect(nextPremiumUntil(null, "quarterly", now)).toBe("2026-04-15T12:00:00.000Z");
		expect(nextPremiumUntil("2025-01-01T00:00:00.000Z", "semestral", now)).toBe(
			"2026-07-15T12:00:00.000Z",
		);
	});

	it("soma ao período ainda válido na renovação", () => {
		expect(nextPremiumUntil("2026-03-01T00:00:00.000Z", "quarterly", now)).toBe(
			"2026-06-01T00:00:00.000Z",
		);
	});

	it("rejeita plano desconhecido", () => {
		expect(nextPremiumUntil(null, "vitalicio", now)).toBeNull();
	});
});

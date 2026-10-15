// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handle, safeRedirect } from "../mp-payment-create/src/main.js";
import { createContext, createDatabases, createFetch, createUsers } from "./fakes.js";

function setup({ secrets = [{ $id: "owner", mp_access_token: "SELLER" }] } = {}) {
	const databases = createDatabases({
		tenants: [{ $id: "owner", co_owner_email: "" }],
		tenant_secrets: secrets,
		products: [
			{ $id: "p1", tenant: { $id: "owner" }, type: "quota", name: "Lua de mel", price: "1000", desired_quantity: 10, claimed_quantity: 0 },
		],
	});
	const fetch = createFetch([
		["/v1/payments", () => ({ json: { id: 99, point_of_interaction: { transaction_data: { qr_code: "000201..." } } } })],
		["/checkout/preferences", () => ({ json: { id: "pref", init_point: "https://mp/checkout" } })],
	]);
	const deps = {
		databases,
		users: createUsers([
			{ $id: "guest", email: "g@email.com", name: "Convidado" },
			{ $id: "owner", email: "noivo@email.com" },
		]),
		databaseId: "db",
		fetch,
		env: { MP_CLIENT_SECRET: "PLATFORM" },
		newId: () => "idem",
	};
	const call = (userId, body) => handle(createContext({ userId, body }), deps);
	return { fetch, call };
}

describe("create_gift_pix", () => {
	it("cobra o valor calculado pelo servidor, não o enviado", async () => {
		const { fetch, call } = setup();

		const res = await call("guest", {
			action: "create_gift_pix",
			tenantId: "owner",
			productId: "p1",
			quantity: 2,
			price: 0.01,
		});

		expect(res.status).toBe(200);
		expect(res.data.amount).toBe(200);
		const payment = fetch.calls[0];
		expect(payment.init.headers.Authorization).toBe("Bearer SELLER");
		expect(payment.body.transaction_amount).toBe(200);
		expect(payment.body.payer.email).toBe("g@email.com");
		expect(JSON.parse(payment.body.external_reference)).toMatchObject({
			type: "gift",
			tenantId: "owner",
			productId: "p1",
			quantity: 2,
			guestId: "guest",
			amount: 200,
		});
	});

	it("exige login e produto do casal informado", async () => {
		const { call } = setup();
		expect((await call(undefined, { action: "create_gift_pix", productId: "p1" })).status).toBe(401);
		expect(
			(await call("guest", { action: "create_gift_pix", tenantId: "outro", productId: "p1" })).status,
		).toBe(400);
	});

	it("avisa quando o casal não conectou o Mercado Pago", async () => {
		const { call } = setup({ secrets: [] });
		const res = await call("guest", { action: "create_gift_pix", productId: "p1" });
		expect(res.status).toBe(400);
		expect(res.data.hasMpConnected).toBe(false);
	});

	it("bloqueia quantidade acima do disponível", async () => {
		const { fetch, call } = setup();
		const res = await call("guest", { action: "create_gift_pix", productId: "p1", quantity: 11 });
		expect(res.status).toBe(400);
		expect(fetch.calls).toHaveLength(0);
	});
});

describe("create_subscription_checkout", () => {
	it("só o casal cria o checkout, com preço fixo do plano", async () => {
		const { fetch, call } = setup();

		expect(
			(await call("guest", { action: "create_subscription_checkout", tenantId: "owner", plan: "quarterly" })).status,
		).toBe(403);

		const res = await call("owner", {
			action: "create_subscription_checkout",
			tenantId: "owner",
			plan: "semestral",
			redirectUrl: "https://eternosim.com.br/joao/admin/config?tab=subscription",
		});

		expect(res.status).toBe(200);
		const pref = fetch.calls[0].body;
		expect(pref.items[0].unit_price).toBe(149);
		expect(pref.back_urls.success).toBe(
			"https://eternosim.com.br/joao/admin/config?tab=subscription&status=success",
		);
	});

	it("rejeita plano desconhecido", async () => {
		const { call } = setup();
		const res = await call("owner", { action: "create_subscription_checkout", tenantId: "owner", plan: "gratis" });
		expect(res.status).toBe(400);
	});
});

describe("safeRedirect", () => {
	const fallback = "https://eternosim.com.br/admin";

	it("aceita os domínios do app", () => {
		expect(safeRedirect("https://eternosim.com.br/x", undefined, fallback).href).toBe("https://eternosim.com.br/x");
		expect(safeRedirect("https://eternosim.ajotanc.com.br/x", undefined, fallback).hostname).toBe(
			"eternosim.ajotanc.com.br",
		);
		expect(safeRedirect("http://localhost:5173/x", undefined, fallback).hostname).toBe("localhost");
	});

	it("troca domínios externos, http e URLs inválidas pelo padrão", () => {
		expect(safeRedirect("https://evil.com/eternosim.com.br", undefined, fallback).href).toBe(fallback);
		expect(safeRedirect("https://eternosim.com.br.evil.com", undefined, fallback).href).toBe(fallback);
		expect(safeRedirect("http://eternosim.com.br/x", undefined, fallback).href).toBe(fallback);
		expect(safeRedirect("javascript:alert(1)", undefined, fallback).href).toBe(fallback);
		expect(safeRedirect(undefined, undefined, fallback).href).toBe(fallback);
	});
});

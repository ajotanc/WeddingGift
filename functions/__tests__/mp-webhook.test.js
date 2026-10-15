// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { handle } from "../mp-webhook/src/main.js";
import { createContext, createDatabases, createFetch } from "./fakes.js";

const NOW = new Date("2026-01-15T12:00:00.000Z");

function giftPayment(overrides = {}) {
	return {
		id: 123,
		status: "approved",
		transaction_amount: 200,
		external_reference: JSON.stringify({
			type: "gift",
			tenantId: "owner",
			productId: "p1",
			quantity: 2,
			guestId: "guest",
		}),
		...overrides,
	};
}

function setup({ payment = giftPayment(), env = {}, secrets = [], subscriptions = [] } = {}) {
	const databases = createDatabases({
		tenants: [{ $id: "owner" }],
		products: [
			{ $id: "p1", tenant: { $id: "owner" }, type: "quota", price: "1000", desired_quantity: 10, claimed_quantity: 1 },
		],
		tenant_secrets: secrets,
		subscriptions,
	});
	const fetch = createFetch([
		["/v1/payments/", (_url, init) =>
			init.headers.Authorization === "Bearer PLATFORM" || init.headers.Authorization === "Bearer SELLER"
				? { json: payment }
				: { status: 401 }],
	]);
	let seq = 0;
	const deps = {
		databases,
		databaseId: "db",
		fetch,
		env: { MP_CLIENT_SECRET: "PLATFORM", ...env },
		newId: () => `purchase-${seq++}`,
		now: () => NOW,
	};
	const notify = (opts = {}) =>
		handle(
			createContext({
				body: { type: "payment", data: { id: "123" }, ...opts.body },
				headers: opts.headers,
				query: opts.query,
			}),
			deps,
		);
	return { databases, fetch, notify, deps };
}

describe("mp-webhook: presentes", () => {
	it("marca o presente e registra a compra com permissões restritas", async () => {
		const { databases, notify } = setup();

		const res = await notify();

		expect(res.data.status).toBe("gift_processed");
		expect(databases.data.get("products").get("p1").claimed_quantity).toBe(3);
		const [purchase] = databases.all("purchases");
		expect(purchase).toMatchObject({ tenant: "owner", guest: "guest", quantity: 2, price_paid: "200" });
		expect(purchase.$permissions).toEqual(['read("team:owner")', 'read("user:guest")']);
	});

	it("processa cada pagamento uma única vez", async () => {
		const { databases, notify } = setup();

		await notify();
		const second = await notify();

		expect(second.data.status).toBe("already_processed");
		expect(databases.data.get("products").get("p1").claimed_quantity).toBe(3);
		expect(databases.all("purchases")).toHaveLength(1);
	});

	it("não marca o presente quando o valor pago é menor", async () => {
		const { databases, notify } = setup({ payment: giftPayment({ transaction_amount: 0.01 }) });

		const res = await notify();

		expect(res.data.status).toBe("amount_mismatch");
		expect(databases.data.get("products").get("p1").claimed_quantity).toBe(1);
		expect(databases.all("purchases")).toHaveLength(0);
	});

	it("ignora referência apontando para produto de outro casal", async () => {
		const ref = JSON.stringify({ type: "gift", tenantId: "outro", productId: "p1", quantity: 1 });
		const { databases, notify } = setup({ payment: giftPayment({ external_reference: ref }) });
		expect((await notify()).data.status).toBe("tenant_mismatch");
		expect(databases.all("purchases")).toHaveLength(0);
	});

	it("consulta com o token do casal quando o da plataforma não acessa", async () => {
		const { databases, notify } = setup({
			env: { MP_CLIENT_SECRET: "SEM_ACESSO" },
			secrets: [{ $id: "owner", mp_user_id: "777", mp_access_token: "SELLER" }],
		});
		const res = await notify({ body: { user_id: 777 } });
		expect(res.data.status).toBe("gift_processed");
		expect(databases.all("purchases")).toHaveLength(1);
	});

	it("libera o pagamento para nova tentativa se o processamento falhar", async () => {
		const { databases, notify } = setup();
		const original = databases.createDocument;
		databases.createDocument = async (db, col, ...rest) => {
			if (col === "purchases") throw new Error("falhou");
			return original(db, col, ...rest);
		};

		const res = await notify();

		expect(res.status).toBe(500);
		expect(databases.data.get("processed_payments").has("mp-123")).toBe(false);
	});

	it("ignora pagamentos não aprovados e eventos de outro tipo", async () => {
		expect((await setup({ payment: giftPayment({ status: "pending" }) }).notify()).data.status).toBe("pending");
		expect((await setup().notify({ body: { type: "plan" } })).data.status).toBe("ignored");
	});
});

describe("mp-webhook: assinatura do x-signature", () => {
	const secret = "whsec";
	const sign = (ts, requestId) =>
		createHmac("sha256", secret).update(`id:123;request-id:${requestId};ts:${ts};`).digest("hex");

	it("rejeita notificação sem assinatura válida quando o segredo está configurado", async () => {
		const { databases, notify } = setup({ env: { MP_WEBHOOK_SECRET: secret } });
		const res = await notify({ headers: { "x-signature": "ts=1,v1=abc", "x-request-id": "r" } });
		expect(res.status).toBe(401);
		expect(databases.all("purchases")).toHaveLength(0);
	});

	it("aceita notificação assinada", async () => {
		const { notify } = setup({ env: { MP_WEBHOOK_SECRET: secret } });
		const res = await notify({
			query: { "data.id": "123", type: "payment" },
			headers: { "x-signature": `ts=1700,v1=${sign("1700", "r1")}`, "x-request-id": "r1" },
		});
		expect(res.data.status).toBe("gift_processed");
	});
});

describe("mp-webhook: assinatura Premium", () => {
	const subPayment = (amount = 99, plan = "quarterly") => ({
		id: 555,
		status: "approved",
		transaction_amount: amount,
		external_reference: JSON.stringify({ type: "subscription", tenantId: "owner", plan }),
	});

	it("grava o plano em subscriptions com leitura pública", async () => {
		const { databases, notify } = setup({ payment: subPayment() });

		const res = await notify({ body: { data: { id: "555" } } });

		expect(res.data.status).toBe("subscription_processed");
		expect(databases.data.get("subscriptions").get("owner")).toMatchObject({
			plan: "premium",
			premium_until: "2026-04-15T12:00:00.000Z",
			last_payment_id: "555",
			$permissions: ['read("any")'],
		});
	});

	it("renovação soma ao período ainda válido", async () => {
		const { databases, notify } = setup({
			payment: subPayment(149, "semestral"),
			subscriptions: [{ $id: "owner", plan: "premium", premium_until: "2026-03-01T00:00:00.000Z" }],
		});
		await notify({ body: { data: { id: "555" } } });
		expect(databases.data.get("subscriptions").get("owner").premium_until).toBe("2026-09-01T00:00:00.000Z");
	});

	it("não libera Premium com valor abaixo do plano", async () => {
		const { databases, notify } = setup({ payment: subPayment(1) });
		expect((await notify({ body: { data: { id: "555" } } })).data.status).toBe("amount_mismatch");
		expect(databases.data.get("subscriptions").has("owner")).toBe(false);
	});
});

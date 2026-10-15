// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { handle } from "../app-actions/src/main.js";
import { createContext, createDatabases, createTeams, createUsers } from "./fakes.js";

function setup({ teams: teamSeed } = {}) {
	const databases = createDatabases({
		tenants: [{ $id: "owner", slug: "joao-e-maria", co_owner_email: "co@email.com", $permissions: [] }],
		products: [
			{ $id: "p1", tenant: "owner", type: "physical", name: "Panela", price: "300", desired_quantity: 2, claimed_quantity: 1 },
			{ $id: "pix", tenant: { $id: "owner" }, type: "quota", category: "pix", is_custom_amount: true, price: "0", desired_quantity: 1, claimed_quantity: 0 },
		],
		messages: [
			{ $id: "m1", tenant: { $id: "owner" }, guest: { $id: "guest" }, likes: ["x"], audio_url: "http://a" },
		],
		gallery: [{ $id: "g1", tenant: "owner", guest: null, likes: [] }],
		rsvps: [{ $id: "r1", tenant: "owner", guest: "guest" }],
	});
	const deps = {
		databases,
		users: createUsers([
			{ $id: "owner", email: "noivo@email.com", emailVerification: true },
			{ $id: "co", email: "co@email.com", emailVerification: true },
			{ $id: "guest", email: "g@email.com", emailVerification: true },
			{ $id: "stranger", email: "s@email.com", emailVerification: true },
		]),
		teams: createTeams(teamSeed),
		storage: { deleteFile: vi.fn(async () => {}) },
		databaseId: "db",
		bucketId: "bucket",
		newId: () => "new-id",
	};
	const call = (userId, body) => handle(createContext({ userId, body }), deps);
	return { deps, databases, call };
}

describe("app-actions: validações gerais", () => {
	it("exige POST, usuário e JSON válido", async () => {
		const { deps } = setup();
		expect((await handle(createContext({ method: "GET", userId: "guest" }), deps)).status).toBe(405);
		expect((await handle(createContext({ body: { action: "toggle_like" } }), deps)).status).toBe(401);
		expect((await handle(createContext({ userId: "guest", body: "{x" }), deps)).status).toBe(400);
		expect((await handle(createContext({ userId: "guest", body: { action: "hack" } }), deps)).status).toBe(400);
	});
});

describe("sync_access", () => {
	it("cria o time com dono e co-administrador e passa o tenant para o time", async () => {
		const { deps, databases, call } = setup();

		const res = await call("owner", { action: "sync_access", tenantId: "owner" });

		expect(res.status).toBe(200);
		expect(deps.teams.members("owner").sort()).toEqual(["co", "owner"]);
		expect(databases.data.get("tenants").get("owner").$permissions).toEqual([
			'read("any")',
			'update("team:owner")',
			'delete("team:owner")',
		]);
	});

	it("remove do time quem não é dono nem co-administrador (time criado por terceiro)", async () => {
		const { deps, call } = setup({ teams: { owner: ["stranger"] } });

		await call("co", { action: "sync_access", tenantId: "owner" });

		expect(deps.teams.members("owner").sort()).toEqual(["co", "owner"]);
	});

	it("nega para quem não é do casal", async () => {
		const { deps, call } = setup();
		const res = await call("stranger", { action: "sync_access", tenantId: "owner" });
		expect(res.status).toBe(403);
		expect(deps.teams.teams.has("owner")).toBe(false);
	});
});

describe("toggle_like", () => {
	it("adiciona e remove só a curtida de quem chamou", async () => {
		const { call } = setup();

		const liked = await call("guest", { action: "toggle_like", table: "messages", rowId: "m1" });
		expect(liked.data.likes.sort()).toEqual(["guest", "x"]);

		const unliked = await call("guest", { action: "toggle_like", table: "messages", rowId: "m1" });
		expect(unliked.data.likes).toEqual(["x"]);
	});

	it("só aceita recados e fotos", async () => {
		const { call } = setup();
		expect((await call("guest", { action: "toggle_like", table: "products", rowId: "p1" })).status).toBe(400);
	});

	it("retorna 404 para linha inexistente", async () => {
		const { call } = setup();
		expect((await call("guest", { action: "toggle_like", table: "gallery", rowId: "nope" })).status).toBe(404);
	});
});

describe("delete_content", () => {
	it("autor apaga o próprio recado e o áudio", async () => {
		const { deps, databases, call } = setup();

		const res = await call("guest", { action: "delete_content", table: "messages", rowId: "m1" });

		expect(res.status).toBe(200);
		expect(databases.data.get("messages").has("m1")).toBe(false);
		expect(deps.storage.deleteFile).toHaveBeenCalledWith("bucket", "audio-m1");
	});

	it("casal (inclusive co-administrador) modera conteúdo de convidados", async () => {
		const { databases, call } = setup();
		expect((await call("co", { action: "delete_content", table: "rsvps", rowId: "r1" })).status).toBe(200);
		expect(databases.data.get("rsvps").has("r1")).toBe(false);
	});

	it("apaga a foto junto com o arquivo", async () => {
		const { deps, call } = setup();
		await call("owner", { action: "delete_content", table: "gallery", rowId: "g1" });
		expect(deps.storage.deleteFile).toHaveBeenCalledWith("bucket", "photo-g1");
	});

	it("nega para outros convidados", async () => {
		const { databases, call } = setup();
		const res = await call("stranger", { action: "delete_content", table: "messages", rowId: "m1" });
		expect(res.status).toBe(403);
		expect(databases.data.get("messages").has("m1")).toBe(true);
	});

	it("não apaga tabelas fora da lista", async () => {
		const { call } = setup();
		expect((await call("owner", { action: "delete_content", table: "tenants", rowId: "owner" })).status).toBe(400);
	});
});

describe("confirm_purchase", () => {
	it("calcula o valor no servidor, registra a compra e marca o presente", async () => {
		const { databases, call } = setup();

		const res = await call("guest", {
			action: "confirm_purchase",
			productId: "p1",
			quantity: 1,
			method: "link",
			amount: 0.01,
		});

		expect(res.status).toBe(200);
		const purchase = databases.data.get("purchases").get("new-id");
		expect(purchase).toMatchObject({
			tenant: "owner",
			guest: "guest",
			product: "p1",
			quantity: 1,
			price_paid: "300",
			method: "link",
		});
		expect(purchase.$permissions).toEqual(['read("team:owner")', 'read("user:guest")']);
		expect(databases.data.get("products").get("p1").claimed_quantity).toBe(2);
	});

	it("bloqueia quando passa da quantidade desejada", async () => {
		const { databases, call } = setup();
		const res = await call("guest", { action: "confirm_purchase", productId: "p1", quantity: 2 });
		expect(res.status).toBe(400);
		expect(databases.all("purchases")).toHaveLength(0);
	});

	it("presente de valor livre usa o valor informado sem marcar estoque", async () => {
		const { databases, call } = setup();
		const res = await call("guest", { action: "confirm_purchase", productId: "pix", amount: 75 });
		expect(res.status).toBe(200);
		expect(databases.data.get("purchases").get("new-id").price_paid).toBe("75");
		expect(databases.data.get("products").get("pix").claimed_quantity).toBe(0);
	});

	it("rejeita método desconhecido e produto inexistente", async () => {
		const { call } = setup();
		expect((await call("guest", { action: "confirm_purchase", productId: "p1", method: "cash" })).status).toBe(400);
		expect((await call("guest", { action: "confirm_purchase", productId: "nope" })).status).toBe(404);
	});
});

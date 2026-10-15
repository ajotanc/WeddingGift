// @vitest-environment node
import { describe, expect, it } from "vitest";
import { handle } from "../mp-oauth/src/main.js";
import { createContext, createDatabases, createFetch, createUsers } from "./fakes.js";

function setup(mpResponse = { status: 200, json: { user_id: 777, access_token: "APP_USR-x", refresh_token: "TG-y" } }) {
	const databases = createDatabases({
		tenants: [{ $id: "owner", co_owner_email: "", mp_access_token: "legado", mp_user_id: null }],
	});
	const fetch = createFetch([["oauth/token", () => mpResponse]]);
	const deps = {
		databases,
		users: createUsers([{ $id: "stranger", email: "s@email.com", emailVerification: true }]),
		databaseId: "db",
		fetch,
		env: { MP_CLIENT_ID: "cid", MP_CLIENT_SECRET: "csecret" },
	};
	const call = (userId, body) => handle(createContext({ userId, body }), deps);
	return { databases, fetch, call };
}

describe("mp-oauth", () => {
	it("exige usuário autenticado", async () => {
		const { call } = setup();
		expect((await call(undefined, { code: "c", tenantId: "owner" })).status).toBe(401);
	});

	it("não deixa conectar a conta do Mercado Pago em outro casal", async () => {
		const { databases, fetch, call } = setup();

		const res = await call("stranger", { code: "codigo-do-atacante", tenantId: "owner" });

		expect(res.status).toBe(403);
		expect(fetch.calls).toHaveLength(0);
		expect(databases.data.get("tenants").get("owner").mp_user_id).toBeNull();
	});

	it("guarda os tokens só em tenant_secrets", async () => {
		const { databases, fetch, call } = setup();

		const res = await call("owner", { code: "c", tenantId: "owner" });

		expect(res.status).toBe(200);
		expect(fetch.calls[0].init.body).toContain("client_secret=csecret");
		expect(databases.data.get("tenant_secrets").get("owner")).toMatchObject({
			mp_user_id: "777",
			mp_access_token: "APP_USR-x",
			mp_refresh_token: "TG-y",
			$permissions: [],
		});
		expect(databases.data.get("tenants").get("owner")).toMatchObject({
			mp_user_id: "777",
			mp_access_token: null,
			mp_refresh_token: null,
		});
		expect(JSON.stringify(res.data)).not.toContain("APP_USR");
	});

	it("repassa erro do Mercado Pago sem gravar nada", async () => {
		const { databases, call } = setup({ status: 400, json: { message: "invalid_grant" } });
		const res = await call("owner", { code: "c", tenantId: "owner" });
		expect(res.status).toBe(400);
		expect(res.data.error).toBe("invalid_grant");
		expect(databases.data.get("tenant_secrets")?.has("owner")).toBeFalsy();
	});

	it("desconecta apagando os tokens", async () => {
		const { databases, call } = setup();
		await call("owner", { code: "c", tenantId: "owner" });

		const res = await call("owner", { action: "disconnect", tenantId: "owner" });

		expect(res.status).toBe(200);
		expect(databases.data.get("tenant_secrets").get("owner").mp_access_token).toBeNull();
		expect(databases.data.get("tenants").get("owner").mp_user_id).toBeNull();
	});

	it("valida parâmetros", async () => {
		const { call } = setup();
		expect((await call("owner", { code: "c" })).status).toBe(400);
		expect((await call("owner", { tenantId: "owner" })).status).toBe(400);
		expect((await call("owner", { action: "x", tenantId: "owner" })).status).toBe(400);
	});
});

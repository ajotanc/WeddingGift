import { AppwriteException } from "appwrite";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	tables: {
		getRow: vi.fn(),
		listRows: vi.fn(),
		createRow: vi.fn(),
		updateRow: vi.fn(),
	},
	teams: { list: vi.fn() },
}));

vi.mock("@/lib/appwrite", async (importOriginal) => {
	const original = await importOriginal<typeof import("@/lib/appwrite")>();
	return { ...original, tables: mocks.tables, teams: mocks.teams };
});

import { TenantService } from "./tenant.service";

const tenantRow = {
	$id: "t1",
	slug: "joao-e-maria",
	plan: "premium",
	premium_until: "2099-01-01T00:00:00.000Z",
};

const teamPerms = ['read("any")', 'update("team:t1")', 'delete("team:t1")'];
const legacyPerms = ['read("any")', 'update("user:t1")', 'delete("user:t1")'];
const strangerPerms = [
	'read("any")',
	'update("user:intruso")',
	'delete("user:intruso")',
];

const notFound = () => new AppwriteException("not found", 404);

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("plano vem de subscriptions", () => {
	it("ignora plano premium gravado no próprio tenant sem assinatura", async () => {
		mocks.tables.getRow.mockImplementation(async ({ tableId }) => {
			if (tableId === "tenants") return { ...tenantRow };
			throw notFound();
		});

		const tenant = await TenantService.get("t1");

		expect(tenant?.plan).toBe("free");
		expect(tenant?.premium_until).toBeNull();
	});

	it("usa o plano pago registrado pelo webhook", async () => {
		mocks.tables.getRow.mockImplementation(async ({ tableId }) => {
			if (tableId === "tenants") return { ...tenantRow, plan: "free" };
			return {
				$id: "t1",
				plan: "premium",
				premium_until: "2026-12-31T00:00:00.000Z",
			};
		});

		const tenant = await TenantService.get("t1");

		expect(tenant?.plan).toBe("premium");
		expect(tenant?.premium_until).toBe("2026-12-31T00:00:00.000Z");
	});

	it("também vale para a atualização feita pelo casal", async () => {
		mocks.tables.updateRow.mockResolvedValue({ ...tenantRow });
		mocks.tables.getRow.mockRejectedValue(notFound());

		const updated = await TenantService.update("t1", { plan: "premium" });

		expect(updated.plan).toBe("free");
	});
});

describe("getBySlug", () => {
	it("esconde itens que não foram criados pelo casal", async () => {
		mocks.tables.getRow.mockRejectedValue(notFound());
		mocks.tables.listRows.mockResolvedValue({
			rows: [
				{
					...tenantRow,
					products: [
						{ $id: "ok", $permissions: teamPerms },
						{ $id: "antigo", $permissions: legacyPerms },
						{ $id: "injetado", $permissions: strangerPerms },
					],
					faqs: [{ $id: "f-injetada", $permissions: strangerPerms }],
					schedules: [],
					quizzes: [{ $id: "q", $permissions: teamPerms }],
				},
			],
		});

		const tenant = await TenantService.getBySlug("joao-e-maria");

		expect(tenant?.products?.map((p) => p.$id)).toEqual(["ok", "antigo"]);
		expect(tenant?.faqs).toEqual([]);
		expect(tenant?.quizzes?.map((q) => q.$id)).toEqual(["q"]);
	});

	it("retorna null quando o slug não existe", async () => {
		mocks.tables.listRows.mockResolvedValue({ rows: [] });
		expect(await TenantService.getBySlug("nada")).toBeNull();
	});
});

describe("create", () => {
	it("cria o tenant só com permissão do dono (o time vem do servidor)", async () => {
		mocks.tables.createRow.mockResolvedValue({ $id: "u1" });

		await TenantService.create({ slug: "x" } as never, "u1");

		expect(mocks.tables.createRow).toHaveBeenCalledWith(
			expect.objectContaining({
				rowId: "u1",
				permissions: legacyPerms.map((p) => p.replace("t1", "u1")),
			}),
		);
	});
});

describe("isTeamMember", () => {
	it("confere se o usuário está no time do casal", async () => {
		mocks.teams.list.mockResolvedValue({ teams: [{ $id: "t1" }] });
		expect(await TenantService.isTeamMember("t1")).toBe(true);

		mocks.teams.list.mockResolvedValue({ teams: [] });
		expect(await TenantService.isTeamMember("t1")).toBe(false);

		mocks.teams.list.mockRejectedValue(new Error("offline"));
		expect(await TenantService.isTeamMember("t1")).toBe(false);
	});
});

// @vitest-environment node
import { describe, expect, it } from "vitest";
import { planFilePermissions, planRowPermissions } from "./migrate-security.mjs";

const team = (id) => ['read("any")', `update("team:${id}")`, `delete("team:${id}")`];
const user = (id) => ['read("any")', `update("user:${id}")`, `delete("user:${id}")`];

describe("planRowPermissions", () => {
	it("conteúdo do casal vai para o time", () => {
		expect(planRowPermissions("tenants", { $id: "t1" })).toEqual(team("t1"));
		expect(planRowPermissions("products", { $id: "p", tenant: { $id: "t1" } })).toEqual(team("t1"));
		expect(planRowPermissions("faqs", { $id: "f", tenant: "t1" })).toEqual(team("t1"));
	});

	it("links do produto seguem o casal do produto", () => {
		const ctx = { productTenant: new Map([["p1", "t1"]]) };
		expect(planRowPermissions("product_links", { $id: "l", product: { $id: "p1" } }, ctx)).toEqual(team("t1"));
		expect(planRowPermissions("product_links", { $id: "l", product: "px" }, ctx)).toBeNull();
	});

	it("conteúdo de convidado fica com o autor", () => {
		expect(planRowPermissions("guests", { $id: "g1" })).toEqual(user("g1"));
		expect(planRowPermissions("messages", { $id: "m", guest: { $id: "g1" } })).toEqual(user("g1"));
		expect(planRowPermissions("gallery", { $id: "i", guest: "g1", tenant: "t1" })).toEqual(user("g1"));
		expect(planRowPermissions("gallery", { $id: "i", guest: null, tenant: "t1" })).toEqual(team("t1"));
	});

	it("compras ficam visíveis só para casal e comprador", () => {
		expect(planRowPermissions("purchases", { $id: "c", tenant: "t1", guest: { $id: "g1" } })).toEqual([
			'read("team:t1")',
			'read("user:g1")',
		]);
	});

	it("não mexe quando não identifica o dono", () => {
		expect(planRowPermissions("rsvps", { $id: "r" })).toBeNull();
		expect(planRowPermissions("consent_logs", { $id: "c" })).toBeNull();
	});
});

describe("planFilePermissions", () => {
	const ctx = {
		productTenant: new Map([["p1", "t1"]]),
		galleryPerms: new Map([["i1", user("g1")]]),
		messagePerms: new Map([["m1", user("g2")]]),
	};

	it("resolve o dono pelo prefixo do arquivo", () => {
		expect(planFilePermissions("logo-t1", ctx)).toEqual(team("t1"));
		expect(planFilePermissions("background-t1", ctx)).toEqual(team("t1"));
		expect(planFilePermissions("product-p1", ctx)).toEqual(team("t1"));
		expect(planFilePermissions("photo-i1", ctx)).toEqual(user("g1"));
		expect(planFilePermissions("audio-m1", ctx)).toEqual(user("g2"));
	});

	it("devolve null para arquivos desconhecidos", () => {
		expect(planFilePermissions("product-px", ctx)).toBeNull();
		expect(planFilePermissions("semprefixo", ctx)).toBeNull();
		expect(planFilePermissions("outro-x", ctx)).toBeNull();
	});
});

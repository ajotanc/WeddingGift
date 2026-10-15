import { describe, expect, it } from "vitest";
import { formatMoney, getProductPrice, parseMoney } from "./money";

describe("parseMoney", () => {
	it("aceita números finitos e usa fallback para NaN/Infinity", () => {
		expect(parseMoney(150.5)).toBe(150.5);
		expect(parseMoney(Number.NaN, { fallback: 7 })).toBe(7);
		expect(parseMoney(Number.POSITIVE_INFINITY)).toBe(0);
	});

	it("lê strings no formato do banco (ponto decimal)", () => {
		expect(parseMoney("400")).toBe(400);
		expect(parseMoney("400.50")).toBe(400.5);
		expect(parseMoney("-12.3")).toBe(-12.3);
	});

	it("lê strings mascaradas em BRL", () => {
		expect(parseMoney("R$ 400,00")).toBe(400);
		expect(parseMoney("40.000,00")).toBe(40000);
		expect(parseMoney("R$ 0,99")).toBe(0.99);
	});

	it("trata formato contábil como negativo", () => {
		expect(parseMoney("(R$ 10,00)")).toBe(-10);
	});

	it("retorna fallback para vazio, nulo e texto sem dígitos", () => {
		expect(parseMoney("")).toBe(0);
		expect(parseMoney(null)).toBe(0);
		expect(parseMoney(undefined, { fallback: 3 })).toBe(3);
		expect(parseMoney("abc")).toBe(0);
	});
});

describe("formatMoney", () => {
	const normalize = (s: string) => s.replace(/\s/g, " ");

	it("formata em BRL por padrão", () => {
		expect(normalize(formatMoney(1234.5))).toBe("R$ 1.234,50");
		expect(normalize(formatMoney("400.00"))).toBe("R$ 400,00");
	});

	it("usa o fallback quando o valor é inválido", () => {
		expect(normalize(formatMoney("", { fallback: 0 }))).toBe("R$ 0,00");
	});
});

describe("getProductPrice", () => {
	it("produto físico usa o preço cheio", () => {
		expect(getProductPrice({ type: "physical", price: "300" })).toBe(300);
		expect(getProductPrice({ type: "physical", price: "300" }, 2)).toBe(600);
	});

	it("cota divide o preço pela quantidade desejada", () => {
		expect(
			getProductPrice({ type: "quota", price: "1000", desired_quantity: 10 }),
		).toBe(100);
		expect(
			getProductPrice(
				{ type: "quota", price: "1000", desired_quantity: 10 },
				3,
			),
		).toBe(300);
	});

	it("cota sem quantidade não divide por zero", () => {
		expect(getProductPrice({ type: "quota", price: "500" })).toBe(500);
	});
});

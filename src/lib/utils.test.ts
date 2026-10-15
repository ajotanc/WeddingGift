import { describe, expect, it } from "vitest";
import {
	extractStoreName,
	generatePixPayload,
	limitWords,
	sanitizePixKey,
	shuffleArray,
	sortBy,
} from "./utils";

/** CRC16-CCITT (0x1021, init 0xFFFF), o mesmo usado pelo BR Code do PIX. */
function crc16(payload: string): string {
	let crc = 0xffff;
	for (let i = 0; i < payload.length; i++) {
		crc ^= payload.charCodeAt(i) << 8;
		for (let j = 0; j < 8; j++) {
			crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
			crc &= 0xffff;
		}
	}
	return crc.toString(16).toUpperCase().padStart(4, "0");
}

describe("extractStoreName", () => {
	it("reconhece lojas conhecidas", () => {
		expect(extractStoreName("https://www.amazon.com.br/dp/123")).toBe("Amazon");
		expect(extractStoreName("produto.mercadolivre.com.br/MLB-1")).toBe(
			"Mercado Livre",
		);
		expect(extractStoreName("https://www.magazineluiza.com.br/x")).toBe(
			"Magazine Luiza",
		);
	});

	it("usa o domínio em maiúsculas para lojas desconhecidas", () => {
		expect(extractStoreName("https://www.zzzteste.com.br/item")).toBe(
			"ZZZTESTE",
		);
	});

	it("retorna 'Loja' para entrada vazia ou inválida", () => {
		expect(extractStoreName("")).toBe("Loja");
		expect(extractStoreName("http://")).toBe("Loja");
	});
});

describe("sanitizePixKey", () => {
	it("normaliza chave aleatória (EVP)", () => {
		expect(sanitizePixKey("123E4567-E89B-12D3-A456-426614174000")).toBe(
			"123e4567-e89b-12d3-a456-426614174000",
		);
		expect(sanitizePixKey("123E4567E89B12D3A456426614174000")).toBe(
			"123e4567-e89b-12d3-a456-426614174000",
		);
	});

	it("normaliza e-mail para minúsculas", () => {
		expect(sanitizePixKey("  Noivos@Email.COM ")).toBe("noivos@email.com");
	});

	it("mantém CPF e CNPJ só com dígitos", () => {
		expect(sanitizePixKey("529.982.247-25")).toBe("52998224725");
		expect(sanitizePixKey("11.222.333/0001-81")).toBe("11222333000181");
	});

	it("formata telefones com +55", () => {
		expect(sanitizePixKey("(11) 98765-4321")).toBe("+5511987654321");
		expect(sanitizePixKey("+55 11 98765-4321")).toBe("+5511987654321");
		expect(sanitizePixKey("5511987654321")).toBe("+5511987654321");
		expect(sanitizePixKey("1133334444")).toBe("+551133334444");
	});

	it("retorna vazio para chave vazia", () => {
		expect(sanitizePixKey("")).toBe("");
	});
});

describe("generatePixPayload", () => {
	it("gera um BR Code válido com CRC correto", async () => {
		const { payload, base64 } = await generatePixPayload(
			"noivos@email.com",
			"José & Ação Casamento Muito Longo",
			"150.00",
			"Presente: Jogo de panelas!",
		);

		expect(payload.startsWith("000201")).toBe(true);
		expect(payload).toContain("br.gov.bcb.pix".toUpperCase());
		expect(payload).toContain("noivos@email.com");
		expect(payload).toContain("5406150.00");
		expect(payload).toContain("JOSE & ACAO CASAMENTO MUI");
		expect(payload).not.toMatch(/[À-ÿ]/);
		expect(base64.startsWith("data:image/png;base64,")).toBe(true);

		const body = payload.slice(0, -4);
		expect(payload.slice(-4)).toBe(crc16(body));
	});

	it("omite o valor quando é zero", async () => {
		const { payload } = await generatePixPayload("noivos@email.com", "N", "0");
		expect(payload).not.toMatch(/54\d{2}\d/);
	});

	it("retorna vazio sem chave ou nome", async () => {
		expect(await generatePixPayload("", "Nome", "10")).toEqual({
			payload: "",
			base64: "",
		});
		expect(await generatePixPayload("a@b.com", "", "10")).toEqual({
			payload: "",
			base64: "",
		});
	});
});

describe("sortBy", () => {
	const items = [
		{ name: "Panela", price: "300" },
		{ name: "air fryer", price: "50" },
		{ name: "Batedeira", price: null as string | null },
	];

	it("ordena números em string numericamente", () => {
		expect(sortBy(items, "price").map((i) => i.price)).toEqual([
			"50",
			"300",
			null,
		]);
		expect(sortBy(items, "price", "desc").map((i) => i.price)).toEqual([
			null,
			"300",
			"50",
		]);
	});

	it("ordena texto sem diferenciar maiúsculas e não altera o original", () => {
		const sorted = sortBy(items, (i) => i.name);
		expect(sorted.map((i) => i.name)).toEqual([
			"air fryer",
			"Batedeira",
			"Panela",
		]);
		expect(items[0].name).toBe("Panela");
	});
});

describe("shuffleArray", () => {
	it("mantém os mesmos elementos sem alterar o original", () => {
		const original = [1, 2, 3, 4, 5];
		const shuffled = shuffleArray(original);
		expect(shuffled).toHaveLength(5);
		expect([...shuffled].sort()).toEqual(original);
		expect(original).toEqual([1, 2, 3, 4, 5]);
	});
});

describe("limitWords", () => {
	it("corta textos longos", () => {
		const result = limitWords("um dois três quatro cinco", 3);
		expect(result.startsWith("um dois três")).toBe(true);
		expect(result).not.toContain("quatro");
	});

	it("mantém textos curtos", () => {
		expect(limitWords("um dois", 5)).toBe("um dois");
	});
});

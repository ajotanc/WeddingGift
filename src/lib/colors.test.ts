import { describe, expect, it } from "vitest";
import { hexToHsl, hexToRgbChannels, hslToHex } from "./colors";

describe("hexToHsl", () => {
	it("converte cores longas e curtas", () => {
		expect(hexToHsl("#1E90FF")).toEqual({ h: 210, s: 100, l: 56 });
		expect(hexToHsl("0f0")).toEqual({ h: 120, s: 100, l: 50 });
		expect(hexToHsl("#000")).toEqual({ h: 0, s: 0, l: 0 });
	});

	it("rejeita valores inválidos", () => {
		expect(() => hexToHsl("#12")).toThrow(TypeError);
		expect(() => hexToHsl("azul")).toThrow(TypeError);
	});
});

describe("hslToHex", () => {
	it("converte para hexadecimal minúsculo", () => {
		expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe("#00ff00");
		expect(hslToHex({ h: 0, s: 0, l: 0 })).toBe("#000000");
	});

	it("normaliza matiz negativa e limita saturação/luminosidade", () => {
		expect(hslToHex({ h: -240, s: 100, l: 50 })).toBe("#00ff00");
		expect(hslToHex({ h: 0, s: 0, l: 150 })).toBe("#ffffff");
	});
});

describe("hexToRgbChannels", () => {
	it("gera o formato 'R G B' usado pelo Tailwind", () => {
		expect(hexToRgbChannels("#C5A880")).toBe("197 168 128");
		expect(hexToRgbChannels("fff")).toBe("255 255 255");
	});

	it("rejeita valores inválidos", () => {
		expect(() => hexToRgbChannels("#zzzzzz")).toThrow(TypeError);
	});
});

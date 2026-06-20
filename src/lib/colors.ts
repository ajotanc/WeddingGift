/**
 * Representa uma cor no espaço HSL (Hue, Saturation, Lightness).
 */
export interface HSLColor {
	/** Matiz (hue), em graus — 0 a 360 */
	readonly h: number;
	/** Saturação, em porcentagem — 0 a 100 */
	readonly s: number;
	/** Luminosidade, em porcentagem — 0 a 100 */
	readonly l: number;
}

/** String hexadecimal de cor, sempre prefixada com `#` (ex: "#1e90ff"). */
export type HexColor = `#${string}`;

/**
 * Aceita "#fff", "#ffffff", "fff" ou "ffffff" (case-insensitive),
 * usando named capture group para deixar a extração explícita.
 */
const HEX_PATTERN = /^#?(?<hex>[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Restringe `value` ao intervalo [min, max]. */
const clamp = (value: number, min: number, max: number): number =>
	Math.min(Math.max(value, min), max);

/**
 * Converte uma cor hexadecimal (#RGB ou #RRGGBB) para o modelo HSL.
 *
 * @param hex - Cor em formato hexadecimal, com ou sem `#` (ex: "#1E90FF", "0f0").
 * @returns Objeto `{ h, s, l }`, com `h` em graus e `s`/`l` em porcentagem, arredondados.
 * @throws {TypeError} Se a string não representar uma cor hexadecimal válida.
 *
 * @example
 * hexToHsl('#1E90FF'); // { h: 210, s: 100, l: 56 }
 * hexToHsl('0f0');     // { h: 120, s: 100, l: 50 }
 * hexToHsl('#000');    // { h: 0,   s: 0,   l: 0 }
 */
export function hexToHsl(hex: string): HSLColor {
	const match = HEX_PATTERN.exec(hex.trim());

	if (!match?.groups) {
		throw new TypeError(`hexToHsl: cor hexadecimal inválida -> "${hex}"`);
	}

	// Expande formato curto (#RGB -> #RRGGBB)
	const fullHex =
		match.groups.hex.length === 3
			? match.groups.hex.replace(/(.)/g, "$1$1")
			: match.groups.hex;

	const [r, g, b] = [0, 2, 4].map(
		(offset) => Number.parseInt(fullHex.slice(offset, offset + 2), 16) / 255,
	) as [number, number, number];

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;

	const l = (max + min) / 2;

	// Cor acromática (cinza/preto/branco): sem matiz nem saturação
	if (delta === 0) {
		return { h: 0, s: 0, l: Math.round(l * 100) };
	}

	const s = delta / (1 - Math.abs(2 * l - 1));

	let h: number;
	switch (max) {
		case r:
			h = ((g - b) / delta) % 6;
			break;
		case g:
			h = (b - r) / delta + 2;
			break;
		default: // max === b
			h = (r - g) / delta + 4;
			break;
	}

	h *= 60;
	if (h < 0) h += 360;

	return {
		h: Math.round(h),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

/**
 * Converte uma cor HSL para o formato hexadecimal `#rrggbb`.
 *
 * `h` é normalizado para o intervalo [0, 360); `s` e `l` são limitados a [0, 100],
 * então valores levemente fora do intervalo não disparam erro — apenas são ajustados.
 *
 * @param hsl - Objeto `{ h, s, l }` (graus / % / %).
 * @returns Cor hexadecimal em letras minúsculas, ex: "#1e90ff".
 *
 * @example
 * hslToHex({ h: 210, s: 100, l: 56 }); // "#1e90ff"
 * hslToHex({ h: 120, s: 100, l: 50 }); // "#00ff00"
 * hslToHex({ h: 0, s: 0, l: 0 });      // "#000000"
 */
export function hslToHex({ h, s, l }: HSLColor): HexColor {
	const hue = ((h % 360) + 360) % 360; // normaliza, inclusive negativos
	const sat = clamp(s, 0, 100) / 100;
	const light = clamp(l, 0, 100) / 100;

	const c = (1 - Math.abs(2 * light - 1)) * sat;
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
	const m = light - c / 2;

	const [r, g, b] = ((): [number, number, number] => {
		if (hue < 60) return [c, x, 0];
		if (hue < 120) return [x, c, 0];
		if (hue < 180) return [0, c, x];
		if (hue < 240) return [0, x, c];
		if (hue < 300) return [x, 0, c];
		return [c, 0, x];
	})();

	const toHex = (channel: number): string =>
		Math.round((channel + m) * 255)
			.toString(16)
			.padStart(2, "0");

	return `#${toHex(r)}${toHex(g)}${toHex(b)}` as HexColor;
}

export const DEFAULT_PRIMARY_COLOR = "#ec4899";
export const DEFAULT_TEXT_COLOR = "#475569";
export const DEFAULT_BACKGROUND_COLOR = "#ffffff";

export const FREE_PRIMARY_COLORS = ["#ec4899", "#2e7d32", "#d4af37", "#1976d2"];
export const FREE_BACKGROUND_COLORS = [
	"#ffffff",
	"#f8fafc",
	"#fffaf0",
	"#f5f5f4",
];

export const DEFAULT_SLATE_COLORS = {
	"50": "#f8fafc",
	"100": "#f1f5f9",
	"200": "#e2e8f0",
	"300": "#cbd5e1",
	"400": "#94a3b8",
	"500": "#64748b",
	"600": "#475569",
	"700": "#334155",
	"800": "#1e293b",
	"900": "#0f172a",
	"950": "#020617",
} as const;

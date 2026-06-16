type MoneyInput = number | string | null | undefined;

interface ParseOptions {
	fallback?: number;
}

interface FormatOptions {
	locale?: string;
	currency?: string;
	fallback?: number;
}

export function parseMoney(
	value: MoneyInput,
	options: ParseOptions = {},
): number {
	const { fallback = 0 } = options;

	if (typeof value === "number") {
		return Number.isFinite(value) ? value : fallback;
	}

	const str = String(value || "").trim();
	if (!str) return fallback;

	// If the string is a standard float string (e.g., from DB like "400" or "400.00")
	if (/^-?\d+(\.\d+)?$/.test(str)) {
		const num = Number(str);
		return Number.isFinite(num) ? num : fallback;
	}

	// We simply extract all digits for masked currency strings (e.g., "R$ 400,00" or "40.000,00")
	const digits = str.replace(/\D/g, "");
	if (!digits) return fallback;

	// Since it's Brazilian currency with 2 decimals, we divide the pure digits by 100.
	// "40000" -> 400.00
	const parsed = Number(digits) / 100;

	const isAccounting = /^\(.*\)$/.test(str);
	return isAccounting ? -Math.abs(parsed) : parsed;
}

export function formatMoney(
	value: MoneyInput,
	options: FormatOptions = {},
): string {
	const { locale = "pt-BR", currency = "BRL", fallback = 0 } = options;

	const num =
		typeof value === "number" ? value : parseMoney(value, { fallback });

	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(num);
}

export function getProductPrice(
	product: { type?: string; base_price?: string; desired_quantity?: number },
	multiplyBy = 1,
): number {
	const base = parseMoney(product.base_price) || 0;
	if (product.type === "quota") {
		const qty = product.desired_quantity || 1;
		return (base / qty) * multiplyBy;
	}
	return base * multiplyBy;
}

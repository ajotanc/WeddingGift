import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export { parseCurrency } from "@brazilian-utils/brazilian-utils";

import { QrCodePix } from "qrcode-pix";
import { parseMoney } from "./money";

export async function generatePixPayload(
	key: string,
	name: string,
	value: string,
	message: string,
	transactionId = "***",
	city = "SALVADOR",
): Promise<{ payload: string; base64: string }> {
	if (!key || !name) return { payload: "", base64: "" };

	const qrCodePix = QrCodePix({
		version: "01",
		key,
		name,
		city,
		transactionId,
		message,
		value: parseMoney(value),
	});

	return {
		payload: qrCodePix.payload(),
		base64: await qrCodePix.base64(),
	};
}

export function sortBy<T>(
	array: T[],
	key: keyof T,
	direction: "asc" | "desc" = "asc",
): T[] {
	return [...array].sort((a, b) => {
		const valA = a[key];
		const valB = b[key];

		if (valA === valB) return 0;
		if (valA == null) return direction === "asc" ? 1 : -1;
		if (valB == null) return direction === "asc" ? -1 : 1;

		if (typeof valA === "number" && typeof valB === "number") {
			return direction === "asc" ? valA - valB : valB - valA;
		}

		const strA = String(valA).toLowerCase();
		const strB = String(valB).toLowerCase();

		return direction === "asc"
			? strA.localeCompare(strB)
			: strB.localeCompare(strA);
	});
}

export const cleanHtml = (html: string) => {
	if (!html) return "";

	return html
		.replace(/<br\s*\/?>|<\/(p|div|li|h[1-6])>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/\n\s*\n/g, "\n")
		.trim();
};

export const limitWords = (text: string, limit: number) => {
	if (!text) return "";

	const cleanText = text.replace(/&quot;/g, '"').trim();
	const words = cleanText.split(/\s+/);

	if (words.length <= limit) return cleanText;

	return `${words
		.slice(0, limit)
		.join(" ")
		.replace(/[.,!?;:]+$/, "")
		.trim()}...`;
};

export const DEFAULT_IMAGE_PLACEHOLDER =
	"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23f8fafc'/><path d='M160 130a20 20 0 1040 0 20 20 0 00-40 0zm-40 80l40-50 30 40 40-60 50 70H120z' fill='%23cbd5e1'/></svg>";

export const handleImageError = (event: Event) => {
	const target = event.target as HTMLImageElement;
	if (target && target.src !== DEFAULT_IMAGE_PLACEHOLDER) {
		target.src = DEFAULT_IMAGE_PLACEHOLDER;
	}
};

export function isMobile(): boolean {
	if (typeof navigator === "undefined") return false;

	// 1. Tenta usar a API moderna (User-Agent Client Hints)
	if ("userAgentData" in navigator) {
		// @ts-expect-error - Propriedade experimental/não padronizada em todos os tipos TS
		return !!navigator.userAgentData?.mobile;
	}

	// 2. Fallback: Verificação clássica via Expressão Regular no userAgent
	// @ts-expect-error
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
		userAgent,
	);
}

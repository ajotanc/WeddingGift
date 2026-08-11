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

	return `${words.slice(0, limit)
		.join(" ")
		.replace(/[.,!?;:]+$/, "")
		.trim()}...`;
};
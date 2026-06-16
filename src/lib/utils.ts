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
	city = "SALVADOR",
	transactionId = "***",
): Promise<{ payload: string; base64: string }> {
	if (!key || !name) return { payload: "", base64: "" };

	const qrCodePix = QrCodePix({
		version: "01",
		key,
		name,
		city,
		transactionId,
		value: parseMoney(value),
	});

	return {
		payload: qrCodePix.payload(),
		base64: await qrCodePix.base64(),
	};
}

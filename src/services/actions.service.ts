import { functions } from "@/lib/appwrite";
import { ExecutionMethod } from "appwrite";
import type { IProduct } from "./product.service";
import type { IPurchase, MethodType } from "./purchase.service";

/**
 * Cliente da Function `app-actions`: ações que alteram dados de outra pessoa e
 * por isso são validadas no servidor.
 */
async function run<T>(action: string, payload: Record<string, unknown>) {
	const execution = await functions.createExecution({
		functionId: "app-actions",
		body: JSON.stringify({ action, ...payload }),
		async: false,
		xpath: "/",
		method: ExecutionMethod.POST,
	});

	let body: Record<string, unknown> = {};
	try {
		body = JSON.parse(execution.responseBody || "{}");
	} catch {
		body = {};
	}

	if (execution.status === "failed" || execution.responseStatusCode >= 400) {
		throw new Error(
			(body.error as string) || "Não foi possível concluir a ação.",
		);
	}
	return body as T;
}

export const ActionsService = {
	/** Garante que dono e co-administrador estão no time do casal. */
	syncAccess(tenantId: string) {
		return run<{ success: boolean; members: string[] }>("sync_access", {
			tenantId,
		});
	},

	toggleLike(table: "messages" | "gallery", rowId: string) {
		return run<{ success: boolean; likes: string[] }>("toggle_like", {
			table,
			rowId,
		});
	},

	/** Apaga recado, foto ou RSVP (autor ou casal). */
	deleteContent(table: "messages" | "gallery" | "rsvps", rowId: string) {
		return run<{ success: boolean }>("delete_content", { table, rowId });
	},

	confirmPurchase(params: {
		productId: string;
		quantity: number;
		method: MethodType;
		amount?: number;
	}) {
		return run<{ success: boolean; purchase: IPurchase; product: IProduct }>(
			"confirm_purchase",
			params,
		);
	},
};

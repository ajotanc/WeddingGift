import { functions } from "@/lib/appwrite";
import type { IProductLink } from "@/services/product.service";
import { ExecutionMethod } from "appwrite";
import { ref } from "vue";

export function useProductSearch() {
	const links = ref<IProductLink[]>([]);
	const isSearching = ref(false);
	const searchError = ref<string | null>(null);

	async function searchProducts(query: string): Promise<void> {
		const trimmed = query.trim();

		if (trimmed.length === 0) {
			searchError.value = "Digite um termo de busca";
			return;
		}

		isSearching.value = true;
		searchError.value = null;

		try {
			const execution = await functions.createExecution(
				"ai-helper",
				JSON.stringify({
					action: "serper-search",
					payload: { query: trimmed },
				}),
				false,
				"/",
				ExecutionMethod.POST,
			);

			if (execution.responseStatusCode >= 400) {
				const errorBody = JSON.parse(execution.responseBody || "{}");
				throw new Error(errorBody.error || "Falha na busca de produtos");
			}

			const data = JSON.parse(execution.responseBody || "{}");

			links.value = data.links;
		} catch (err) {
			searchError.value =
				err instanceof Error ? err.message : "Erro inesperado na busca";
			links.value = [];
		} finally {
			isSearching.value = false;
		}
	}

	return {
		links,
		isSearching,
		searchError,
		searchProducts,
	};
}

import { functions } from "@/lib/appwrite";
import { ExecutionMethod } from "appwrite";
import { ref } from "vue";

interface ThankYouParams {
	guestName: string;
	coupleName: string;
}

interface GenerateThankYouResponse {
	text: string;
	generatedByAI: boolean;
}

export function useThankYouGenerator() {
	const message = ref<string>("");
	const isGenerating = ref(false);
	const generationError = ref<string | null>(null);

	async function generateThankYou(params: ThankYouParams): Promise<void> {
		isGenerating.value = true;
		generationError.value = null;

		try {
			const execution = await functions.createExecution(
				"ai-helper",
				JSON.stringify({
					action: "ai-thanks",
					payload: params,
				}),
				false,
				"/",
				ExecutionMethod.POST,
			);

			if (execution.responseStatusCode >= 400) {
				const errorBody = JSON.parse(execution.responseBody || "{}");
				throw new Error(errorBody.error || "Falha ao gerar a mensagem");
			}

			const data = JSON.parse(
				execution.responseBody,
			) as GenerateThankYouResponse;
			message.value = data.text;
		} catch (err) {
			generationError.value =
				err instanceof Error
					? err.message
					: "Erro inesperado ao gerar mensagem";
			message.value = "";
		} finally {
			isGenerating.value = false;
		}
	}

	return {
		message,
		isGenerating,
		generationError,
		generateThankYou,
	};
}

// No componente que usa este composable, lembre-se de exibir algo como:
// "✨ Mensagem sugerida por IA — revise antes de enviar" perto do texto gerado.
// Isso cobre a obrigação de transparência sobre conteúdo gerado por IA
// (relevante inclusive sob o EU AI Act, caso a plataforma atenda usuários na UE).

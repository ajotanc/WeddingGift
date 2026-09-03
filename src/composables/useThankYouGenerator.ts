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

	async function generateThankYou(params: ThankYouParams): Promise<string> {
		isGenerating.value = true;
		generationError.value = null;

		try {
			const execution = await functions.createExecution({
				functionId: "ai-helper",
				body: JSON.stringify({
					action: "ai-thanks",
					payload: {
						guestName: params.guestName?.trim() || "Convidado",
						coupleName: params.coupleName?.trim() || "Noivos",
					},
				}),
				async: false,
				xpath: "/",
				method: ExecutionMethod.POST,
			});

			if (
				execution.status === "failed" ||
				execution.responseStatusCode >= 400
			) {
				let errorMsg = "Falha ao gerar a mensagem";
				try {
					const errorBody = JSON.parse(execution.responseBody || "{}") as {
						error?: string;
						message?: string;
					};
					errorMsg =
						errorBody.error ||
						errorBody.message ||
						execution.errors ||
						errorMsg;
				} catch {
					errorMsg = execution.errors || errorMsg;
				}
				throw new Error(errorMsg);
			}

			const data = JSON.parse(
				execution.responseBody || "{}",
			) as GenerateThankYouResponse;

			const generatedText = data.text ? data.text.trim() : "";
			message.value = generatedText;
			return generatedText;
		} catch (err) {
			const errorMsg =
				err instanceof Error
					? err.message
					: "Erro inesperado ao gerar mensagem";
			generationError.value = errorMsg;
			console.error("Erro ao gerar mensagem de agradecimento:", errorMsg);
			message.value = "";
			return "";
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

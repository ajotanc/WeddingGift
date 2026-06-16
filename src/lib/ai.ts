import { GoogleGenAI } from "@google/genai";

export const generateThankYouMessage = async (
	guestName: string,
	coupleName: string,
): Promise<string> => {
	const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
	const prompt = `Escreva apenas UMA ÚNICA mensagem de agradecimento curta (máx 3 frases) e carinhosa do casal de noivos ${coupleName} para o convidado ${guestName} que acabou de confirmar presença no casamento. Use um tom feliz e amigável (pode incluir emojis). ATENÇÃO: Retorne APENAS o texto da mensagem final. Não envie opções, não envie saudações iniciais ou notas finais.`;

	const response = await ai.models.generateContent({
		model: "gemini-2.5-flash",
		contents: prompt,
	});

	return response.text || "";
};

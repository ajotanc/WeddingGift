import axios from "axios";

export default async ({ req, res, log, error }) => {
	// 1. Só aceitar POST — qualquer outro método é rejeitado
	if (req.method !== "POST") {
		return res.json({ message: "Método não suportado" }, 405);
	}

	// 2. Defesa em profundidade: confirmar que existe um usuário autenticado
	//    associado a esta execução (a permissão da Function já deveria bloquear
	//    chamadas anônimas, mas checamos de novo aqui)
	const userId = req.headers["x-appwrite-user-id"];
	if (!userId) {
		return res.json({ message: "Não autenticado" }, 401);
	}

	// 3. Validar e sanear o corpo da requisição
	let body;
	try {
		body = JSON.parse(req.bodyRaw || "{}");
	} catch {
		return res.json({ message: "Corpo da requisição inválido" }, 400);
	}

	const { action } = body;
	if (!action) {
		return res.json({ message: "Ação é obrigatória" }, 400);
	}

	const payload = body.payload || body;

	// --- Rota: search-products ---
	if (action === "serper-search") {
		const SERPER_ENDPOINT = "https://google.serper.dev/search";
		const MAX_QUERY_LENGTH = 120;
		const REQUEST_TIMEOUT_MS = 8000;
		const MAX_RESULTS = 10;

		const KNOWN_STORES = [
			{ key: "amazon", name: "Amazon" },
			{ key: "mercadolivre", name: "Mercado Livre" },
			{ key: "mercadopago", name: "Mercado Pago" },
			{ key: "magazineluiza", name: "Magazine Luiza" },
			{ key: "magalu", name: "Magazine Luiza" },
			{ key: "americanas", name: "Americanas" },
			{ key: "submarino", name: "Submarino" },
			{ key: "shoptime", name: "Shoptime" },
			{ key: "casasbahia", name: "Casas Bahia" },
			{ key: "pontofrio", name: "Ponto Frio" },
			{ key: "extra", name: "Extra" },
			{ key: "fastshop", name: "Fast Shop" },
			{ key: "carrefour", name: "Carrefour" },
			{ key: "electrolux", name: "Electrolux" },
			{ key: "brastemp", name: "Brastemp" },
			{ key: "consul", name: "Consul" },
			{ key: "samsung", name: "Samsung" },
			{ key: "lg", name: "LG" },
			{ key: "polishop", name: "Polishop" },
			{ key: "kabum", name: "KaBuM!" },
			{ key: "pichau", name: "Pichau" },
			{ key: "terabyte", name: "Terabyte" },
			{ key: "camicado", name: "Camicado" },
			{ key: "tokstok", name: "Tok&Stok" },
			{ key: "leroymerlin", name: "Leroy Merlin" },
			{ key: "shopee", name: "Shopee" },
			{ key: "aliexpress", name: "AliExpress" },
			{ key: "karsten", name: "Karsten" },
			{ key: "apple", name: "Apple" },
			{ key: "havan", name: "Havan" },
			{ key: "pernambucanas", name: "Pernambucanas" },
			{ key: "mobly", name: "Mobly" },
			{ key: "madeiramadeira", name: "MadeiraMadeira" },
			{ key: "renner", name: "Renner" },
			{ key: "cea", name: "C&A" },
			{ key: "riachuelo", name: "Riachuelo" },
			{ key: "zattini", name: "Zattini" },
			{ key: "netshoes", name: "Netshoes" },
			{ key: "centauro", name: "Centauro" },
			{ key: "decathlon", name: "Decathlon" },
			{ key: "nespresso", name: "Nespresso" },
			{ key: "tramontina", name: "Tramontina" },
			{ key: "oster", name: "Oster" },
			{ key: "philips", name: "Philips Walita" },
			{ key: "mondial", name: "Mondial" },
			{ key: "britania", name: "Britânia" },
			{ key: "arno", name: "Arno" },
			{ key: "westwing", name: "Westwing" },
			{ key: "ortobom", name: "Ortobom" },
			{ key: "multilaser", name: "Multilaser" },
			{ key: "dell", name: "Dell" },
			{ key: "dafiti", name: "Dafiti" },
			{ key: "marisa", name: "Marisa" },
			{ key: "arezzo", name: "Arezzo" },
			{ key: "melissa", name: "Melissa" },
			{ key: "boticario", name: "O Boticário" },
			{ key: "natura", name: "Natura" },
			{ key: "cacaushow", name: "Cacau Show" },
			{ key: "kopenhagen", name: "Kopenhagen" },
			{ key: "havaianas", name: "Havaianas" },
			{ key: "lupo", name: "Lupo" },
			{ key: "etna", name: "Etna" },
			{ key: "kalunga", name: "Kalunga" },
			{ key: "leitura", name: "Livraria Leitura" },
			{ key: "drogaraia", name: "Droga Raia" },
			{ key: "drogasil", name: "Drogasil" },
			{ key: "sephora", name: "Sephora" },
			{ key: "nike", name: "Nike" },
			{ key: "adidas", name: "Adidas" },
			{ key: "puma", name: "Puma" },
		];

		const query = typeof payload.query === "string" ? payload.query.trim() : "";

		if (query.length === 0 || query.length > MAX_QUERY_LENGTH) {
			return res.json(
				{
					message: `O termo de busca deve ter entre 1 e ${MAX_QUERY_LENGTH} caracteres`,
				},
				400,
			);
		}

		// Chamar a Serper API com timeout, sem nunca expor a chave ao cliente
		const apiKey = process.env.SERPER_API_KEY;
		if (!apiKey) {
			error(
				"SERPER_API_KEY não configurada nas variáveis de ambiente da Function",
			);
			return res.json(
				{ message: "Serviço de busca indisponível no momento" },
				500,
			);
		}

		try {
			const { data } = await axios.post(
				SERPER_ENDPOINT,
				{ q: query, gl: "br", hl: "pt-br" },
				{
					headers: {
						"X-API-KEY": apiKey,
						"Content-Type": "application/json",
					},
					timeout: REQUEST_TIMEOUT_MS,
				},
			);

			const items = Array.isArray(data.organic) ? data.organic : [];

			const filteredItems = items.filter((item) => {
				if (!item.link) return false;
				return !item.link.toLowerCase().endsWith(".pdf");
			});

			const links = filteredItems.slice(0, MAX_RESULTS).map((item) => {
				let extractedSource = item.store || "LOJA";

				if (item.link) {
					const lowerLink = item.link.toLowerCase();
					const knownStore = KNOWN_STORES.find((s) =>
						lowerLink.includes(s.key),
					);

					if (knownStore) {
						extractedSource = knownStore.name;
					} else {
						try {
							const urlObj = new URL(item.link);
							const hostParts = urlObj.hostname
								.replace(/^www\./, "")
								.split(".");
							if (hostParts.length > 0 && hostParts[0]) {
								extractedSource = hostParts[0].toUpperCase();
							} else {
								const match = item.link.match(/www\.([^.]+)\./);
								if (match?.[1]) {
									extractedSource = match[1].toUpperCase();
								} else {
									extractedSource = "LOJA";
								}
							}
						} catch (e) {
							extractedSource = "LOJA";
						}
					}
				}

				return {
					...item,
					url: item.link,
					store: extractedSource,
				};
			});

			return res.json({ links });
		} catch (err) {
			if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
				log("Timeout ao consultar a Serper API");
				return res.json(
					{ message: "A busca demorou demais, tente novamente" },
					504,
				);
			}

			error(`Erro inesperado: ${err.message}`);
			return res.json({ message: "Erro interno ao buscar produtos" }, 500);
		}
	}

	// --- Rota: generate-thank-you ---
	if (action === "ai-thanks") {
		const MAX_FIELD_LENGTH = 80;
		const REQUEST_TIMEOUT_MS = 12000;

		const guestName = sanitizeField(payload.guestName);
		const coupleName = sanitizeField(payload.coupleName);

		if (!guestName || !coupleName) {
			return res.json(
				{ message: "guestName e coupleName são obrigatórios" },
				400,
			);
		}

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			error(
				"GEMINI_API_KEY não configurada nas variáveis de ambiente da Function",
			);
			return res.json(
				{ message: "Serviço de geração de texto indisponível" },
				500,
			);
		}

		const prompt = `Escreva apenas UMA ÚNICA mensagem de agradecimento curta (máx 3 frases) e carinhosa do casal de noivos ${coupleName} para o convidado ${guestName} que acabou de confirmar presença no casamento. Use um tom feliz e amigável (pode incluir emojis). ATENÇÃO: Retorne APENAS o texto da mensagem final. Não envie opções, não envie saudações iniciais ou notas finais.`;

		try {
			const response = await axios.post(
				`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
				{
					contents: [
						{
							parts: [
								{
									text: prompt,
								},
							],
						},
					],
				},
				{
					headers: {
						"Content-Type": "application/json",
					},
					timeout: REQUEST_TIMEOUT_MS,
				},
			);

			const data = response.data;
			const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

			if (!text) {
				return res.json(
					{ message: "Não foi possível gerar a mensagem agora" },
					502,
				);
			}

			return res.json({ text: text.trim(), generatedByAI: true });
		} catch (err) {
			error(`Erro ao chamar a Gemini API: ${err.message}`);
			return res.json({ message: "Erro interno ao gerar a mensagem" }, 500);
		}
	}

	return res.json({ message: `Ação não suportada: ${action}` }, 400);
};

function sanitizeField(value) {
	const MAX_FIELD_LENGTH = 80;
	if (typeof value !== "string") return "";
	const trimmed = value.trim();
	if (trimmed.length === 0 || trimmed.length > MAX_FIELD_LENGTH) return "";
	return trimmed;
}

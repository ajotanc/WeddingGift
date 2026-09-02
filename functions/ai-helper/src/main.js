import axios from "axios";
import { Client, Databases } from "node-appwrite";

const PII_FIELDS = new Set([
	"password",
	"pix_key",
	"token",
	"mp_access_token",
	"mp_refresh_token",
]);

function sanitizeLogs(obj) {
	if (!obj || typeof obj !== "object") return obj;
	const sanitized = Array.isArray(obj) ? [] : {};
	for (const [key, value] of Object.entries(obj)) {
		if (PII_FIELDS.has(key)) {
			sanitized[key] = "[REDACTED_PII]";
		} else if (typeof value === "object" && value !== null) {
			sanitized[key] = sanitizeLogs(value);
		} else {
			sanitized[key] = value;
		}
	}
	return sanitized;
}

function createLogger({ log, error, userId, action }) {
	const requestId = Math.random().toString(36).substring(2, 11);

	const formatLog = (level, message, metadata = {}) => {
		const payload = {
			level,
			timestamp: new Date().toISOString(),
			requestId,
			userId: userId || "anonymous",
			action: action || "unknown",
			message,
			...sanitizeLogs(metadata),
		};
		return JSON.stringify(payload);
	};

	return {
		info: (message, metadata) => log(formatLog("INFO", message, metadata)),
		warn: (message, metadata) => log(formatLog("WARN", message, metadata)),
		error: (message, metadata) => error(formatLog("ERROR", message, metadata)),
		fatal: (message, metadata) => error(formatLog("FATAL", message, metadata)),
	};
}

export default async ({ req, res, log, error }) => {
	// 1. Só aceitar POST — qualquer outro método é rejeitado
	if (req.method !== "POST") {
		return res.json({ message: "Método não suportado" }, 405);
	}

	// 2. Defesa em profundidade: confirmar que existe um usuário autenticado
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
	const sysLogger = createLogger({ log, error, userId, action });

	// --- Rota: search-products ---
	if (action === "serper-search") {
		const SERPER_ENDPOINT = "https://google.serper.dev/search";
		const MAX_QUERY_LENGTH = 120;
		const REQUEST_TIMEOUT_MS = 8000;
		const MAX_RESULTS = 10;

		const KNOWN_STORES = [
			// Grandes Marketplaces & Varejistas
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
			{ key: "extra.com", name: "Extra" },
			{ key: "whatsapp", name: "WhatsApp da Loja" },
			{ key: "extra", name: "Extra" },
			{ key: "fastshop", name: "Fast Shop" },
			{ key: "carrefour", name: "Carrefour" },
			{ key: "shopee", name: "Shopee" },
			{ key: "aliexpress", name: "AliExpress" },
			{ key: "shein", name: "SHEIN" },
			{ key: "havan", name: "Havan" },
			{ key: "pernambucanas", name: "Pernambucanas" },
			{ key: "lebiscuit", name: "Le Biscuit" },
			{ key: "precolandia", name: "Preçolândia" },
			{ key: "colombo.com", name: "Lojas Colombo" },
			{ key: "gazin", name: "Gazin" },
			{ key: "taqi", name: "taQi" },
			{ key: "koerich", name: "Koerich" },
			{ key: "marabraz", name: "Marabraz" },
			{ key: "bemol", name: "Bemol" },
			{ key: "sipolatti", name: "Sipolatti" },
			{ key: "novomundo", name: "Novo Mundo" },
			{ key: "leader", name: "Lojas Leader" },
			{ key: "torra", name: "Torra" },
			{ key: "besni", name: "Besni" },

			// Eletrodomésticos, Eletrônicos & Informática
			{ key: "electrolux", name: "Electrolux" },
			{ key: "brastemp", name: "Brastemp" },
			{ key: "consul", name: "Consul" },
			{ key: "samsung", name: "Samsung" },
			{ key: "lg.com", name: "LG" },
			{ key: "lg", name: "LG" },
			{ key: "apple", name: "Apple" },
			{ key: "dell", name: "Dell" },
			{ key: "lenovo", name: "Lenovo" },
			{ key: "asus", name: "ASUS" },
			{ key: "acer", name: "Acer" },
			{ key: "avell", name: "Avell" },
			{ key: "motorola", name: "Motorola" },
			{ key: "xiaomi", name: "Xiaomi" },
			{ key: "mibrasil", name: "Xiaomi" },
			{ key: "polishop", name: "Polishop" },
			{ key: "kabum", name: "KaBuM!" },
			{ key: "pichau", name: "Pichau" },
			{ key: "terabyte", name: "Terabyte" },
			{ key: "multilaser", name: "Multilaser" },
			{ key: "positivo", name: "Positivo" },
			{ key: "vaio", name: "VAIO" },
			{ key: "playstation", name: "PlayStation" },
			{ key: "sony", name: "Sony" },
			{ key: "xbox", name: "Xbox" },
			{ key: "microsoft", name: "Microsoft" },
			{ key: "nintendo", name: "Nintendo" },
			{ key: "gopro", name: "GoPro" },
			{ key: "canon", name: "Canon" },
			{ key: "nikon", name: "Nikon" },
			{ key: "jbl", name: "JBL" },
			{ key: "bose", name: "Bose" },
			{ key: "sennheiser", name: "Sennheiser" },
			{ key: "edifier", name: "Edifier" },
			{ key: "logitech", name: "Logitech" },
			{ key: "razer", name: "Razer" },
			{ key: "corsair", name: "Corsair" },
			{ key: "hyperx", name: "HyperX" },
			{ key: "redragon", name: "Redragon" },
			{ key: "intelbras", name: "Intelbras" },
			{ key: "tplink", name: "TP-Link" },
			{ key: "dlink", name: "D-Link" },
			{ key: "kingston", name: "Kingston" },
			{ key: "sandisk", name: "SanDisk" },
			{ key: "seagate", name: "Seagate" },

			// Casa, Mesa, Banho, Cozinha & Decoração
			{ key: "camicado", name: "Camicado" },
			{ key: "tokstok", name: "Tok&Stok" },
			{ key: "westwing", name: "Westwing" },
			{ key: "mobly", name: "Mobly" },
			{ key: "madeiramadeira", name: "MadeiraMadeira" },
			{ key: "madesa", name: "Madesa" },
			{ key: "mmartan", name: "mmartan" },
			{ key: "artex", name: "Artex" },
			{ key: "karsten", name: "Karsten" },
			{ key: "buddemeyer", name: "Buddemeyer" },
			{ key: "trussardi", name: "Trussardi" },
			{ key: "santista", name: "Santista" },
			{ key: "ortobom", name: "Ortobom" },
			{ key: "castor", name: "Colchões Castor" },
			{ key: "emma", name: "Emma Colchões" },
			{ key: "muma", name: "Muma" },
			{ key: "oppa", name: "Oppa" },
			{ key: "abracasa", name: "Abra Casa" },
			{ key: "casatema", name: "Casa Tema" },
			{ key: "dpot", name: "Dpot" },
			{ key: "openbox2", name: "OpenBox2" },
			{ key: "etna", name: "Etna" },
			{ key: "tramontina", name: "Tramontina" },
			{ key: "lecreuset", name: "Le Creuset" },
			{ key: "zwilling", name: "Zwilling" },
			{ key: "brinox", name: "Brinox" },
			{ key: "oxfordporcelanas", name: "Oxford Porcelanas" },
			{ key: "oxford", name: "Oxford" },
			{ key: "schmidt", name: "Porcelana Schmidt" },
			{ key: "kitchenaid", name: "KitchenAid" },
			{ key: "nespresso", name: "Nespresso" },
			{ key: "oster", name: "Oster" },
			{ key: "philips", name: "Philips Walita" },
			{ key: "walita", name: "Philips Walita" },
			{ key: "mondial", name: "Mondial" },
			{ key: "britania", name: "Britânia" },
			{ key: "philco", name: "Philco" },
			{ key: "arno", name: "Arno" },
			{ key: "suggar", name: "Suggar" },
			{ key: "fischer", name: "Fischer" },
			{ key: "cadence", name: "Cadence" },
			{ key: "mallory", name: "Mallory" },
			{ key: "midea", name: "Midea" },
			{ key: "wap", name: "WAP" },
			{ key: "karcher", name: "Kärcher" },
			{ key: "spicy", name: "Spicy" },
			{ key: "utilplast", name: "Utilplast" },
			{ key: "daskaza", name: "Daskaza" },
			{ key: "casadasserras", name: "Casa das Serras" },

			// Construção & Reforma
			{ key: "leroymerlin", name: "Leroy Merlin" },
			{ key: "leroy", name: "Leroy Merlin" },
			{ key: "telhanorte", name: "Telhanorte" },
			{ key: "cec.com", name: "C&C Casa e Construção" },
			{ key: "sodimac", name: "Sodimac" },
			{ key: "balaroti", name: "Balaroti" },
			{ key: "cassol", name: "Cassol Centerlar" },
			{ key: "dicico", name: "Dicico" },

			// Moda, Calçados & Esportes
			{ key: "renner", name: "Renner" },
			{ key: "lojasrenner", name: "Renner" },
			{ key: "cea.com", name: "C&A" },
			{ key: "cea", name: "C&A" },
			{ key: "riachuelo", name: "Riachuelo" },
			{ key: "zattini", name: "Zattini" },
			{ key: "netshoes", name: "Netshoes" },
			{ key: "centauro", name: "Centauro" },
			{ key: "decathlon", name: "Decathlon" },
			{ key: "dafiti", name: "Dafiti" },
			{ key: "marisa", name: "Marisa" },
			{ key: "zara", name: "Zara" },
			{ key: "hm.com", name: "H&M" },
			{ key: "hering", name: "Hering" },
			{ key: "usereserva", name: "Reserva" },
			{ key: "reserva", name: "Reserva" },
			{ key: "farmrio", name: "FARM Rio" },
			{ key: "farm", name: "FARM Rio" },
			{ key: "animale", name: "Animale" },
			{ key: "osklen", name: "Osklen" },
			{ key: "ellus", name: "Ellus" },
			{ key: "colcci", name: "Colcci" },
			{ key: "calvinklein", name: "Calvin Klein" },
			{ key: "tommyhilfiger", name: "Tommy Hilfiger" },
			{ key: "tommy", name: "Tommy Hilfiger" },
			{ key: "lacoste", name: "Lacoste" },
			{ key: "levis", name: "Levi's" },
			{ key: "levi", name: "Levi's" },
			{ key: "trackfield", name: "Track&Field" },
			{ key: "liveoficial", name: "LIVE!" },
			{ key: "amaro", name: "Amaro" },
			{ key: "posthaus", name: "Posthaus" },
			{ key: "shoulder", name: "Shoulder" },
			{ key: "lelisblanc", name: "Le Lis Blanc" },
			{ key: "bobo.com", name: "Bo.Bô" },
			{ key: "bobo", name: "Bo.Bô" },
			{ key: "arezzo", name: "Arezzo" },
			{ key: "schutz", name: "Schutz" },
			{ key: "anacapri", name: "Anacapri" },
			{ key: "melissa", name: "Melissa" },
			{ key: "havaianas", name: "Havaianas" },
			{ key: "santalolla", name: "Santa Lolla" },
			{ key: "capodarte", name: "Capodarte" },
			{ key: "dumond", name: "Dumond" },
			{ key: "mrcat", name: "Mr. Cat" },
			{ key: "shoestock", name: "Shoestock" },
			{ key: "passarela", name: "Passarela" },
			{ key: "oscarcalcados", name: "Oscar Calçados" },
			{ key: "nike", name: "Nike" },
			{ key: "adidas", name: "Adidas" },
			{ key: "puma", name: "Puma" },
			{ key: "vans", name: "Vans" },
			{ key: "converse", name: "Converse" },
			{ key: "allstar", name: "Converse All Star" },
			{ key: "asics", name: "ASICS" },
			{ key: "mizuno", name: "Mizuno" },
			{ key: "olympikus", name: "Olympikus" },
			{ key: "underarmour", name: "Under Armour" },
			{ key: "newbalance", name: "New Balance" },
			{ key: "timberland", name: "Timberland" },
			{ key: "oakley", name: "Oakley" },
			{ key: "rayban", name: "Ray-Ban" },
			{ key: "chillibeans", name: "Chilli Beans" },
			{ key: "lupo", name: "Lupo" },
			{ key: "vivara", name: "Vivara" },
			{ key: "pandora", name: "Pandora" },
			{ key: "montecarlo", name: "Monte Carlo Joias" },
			{ key: "hstern", name: "H.Stern" },

			// Beleza, Cosméticos & Farmácia
			{ key: "boticario", name: "O Boticário" },
			{ key: "natura", name: "Natura" },
			{ key: "sephora", name: "Sephora" },
			{ key: "belezanaweb", name: "Beleza na Web" },
			{ key: "epocacosmeticos", name: "Época Cosméticos" },
			{ key: "quemdisseberenice", name: "Quem Disse, Berenice?" },
			{ key: "eudora", name: "Eudora" },
			{ key: "avon", name: "Avon" },
			{ key: "jequiti", name: "Jequiti" },
			{ key: "loccitane", name: "L'Occitane" },
			{ key: "maccosmetics", name: "MAC Cosmetics" },
			{ key: "loreal", name: "L'Oréal" },
			{ key: "granado", name: "Granado" },
			{ key: "phebo", name: "Phebo" },
			{ key: "nivea", name: "Nivea" },
			{ key: "giovannababy", name: "Giovanna Baby" },
			{ key: "drogaraia", name: "Droga Raia" },
			{ key: "drogasil", name: "Drogasil" },
			{ key: "drogariasaopaulo", name: "Droga São Paulo" },
			{ key: "pacheco", name: "Drogarias Pacheco" },
			{ key: "panvel", name: "Panvel Farmácias" },
			{ key: "venancio", name: "Drogaria Venancio" },
			{ key: "araujo", name: "Drogaria Araujo" },
			{ key: "dermaclub", name: "DermaClub" },

			// Alimentos, Bebidas & Chocolates
			{ key: "cacaushow", name: "Cacau Show" },
			{ key: "kopenhagen", name: "Kopenhagen" },
			{ key: "brasilcacau", name: "Chocolates Brasil Cacau" },
			{ key: "lindt", name: "Lindt" },
			{ key: "bauducco", name: "Casa Bauducco" },
			{ key: "wine.com", name: "Wine" },
			{ key: "wine", name: "Wine" },
			{ key: "evino", name: "Evino" },
			{ key: "vintae", name: "Vintae" },
			{ key: "divvino", name: "Divvino" },
			{ key: "imigrantesbebidas", name: "Imigrantes Bebidas" },
			{ key: "paodeacucar", name: "Pão de Açúcar" },
			{ key: "mambo", name: "Supermercados Mambo" },
			{ key: "stmarche", name: "St Marche" },
			{ key: "samsclub", name: "Sam's Club" },
			{ key: "assai", name: "Assaí Atacadista" },
			{ key: "atacadao", name: "Atacadão" },
			{ key: "ifood", name: "iFood" },
			{ key: "rappi", name: "Rappi" },
			{ key: "starbucks", name: "Starbucks" },

			// Livros, Papelaria, Brinquedos & Pet
			{ key: "kalunga", name: "Kalunga" },
			{ key: "leitura", name: "Livraria Leitura" },
			{ key: "saraiva", name: "Saraiva" },
			{ key: "livrariacultura", name: "Livraria Cultura" },
			{ key: "travessa", name: "Livraria da Travessa" },
			{ key: "martinsfontes", name: "Livraria Martins Fontes" },
			{ key: "curitiba", name: "Livrarias Curitiba" },
			{ key: "estantevirtual", name: "Estante Virtual" },
			{ key: "petz", name: "Petz" },
			{ key: "cobasi", name: "Cobasi" },
			{ key: "petlove", name: "Petlove" },
			{ key: "rihappy", name: "Ri Happy" },
			{ key: "pbkids", name: "PBKIDS" },
			{ key: "lego", name: "LEGO" },
			{ key: "copag", name: "Copag" },
			{ key: "grow", name: "Grow" },
			{ key: "estrela", name: "Brinquedos Estrela" },

			// Viagens, Hospedagem & Mobilidade
			{ key: "booking", name: "Booking.com" },
			{ key: "airbnb", name: "Airbnb" },
			{ key: "decolar", name: "Decolar" },
			{ key: "cvc", name: "CVC" },
			{ key: "123milhas", name: "123 Milhas" },
			{ key: "maxmilhas", name: "MaxMilhas" },
			{ key: "hurb", name: "Hurb" },
			{ key: "voegol", name: "GOL Linhas Aéreas" },
			{ key: "voeazul", name: "Azul Linhas Aéreas" },
			{ key: "azul", name: "Azul Linhas Aéreas" },
			{ key: "latam", name: "LATAM Airlines" },
			{ key: "passagenspromo", name: "Passagens Promo" },
			{ key: "rentcars", name: "Rentcars" },
			{ key: "localiza", name: "Localiza" },
			{ key: "movida", name: "Movida" },
			{ key: "unidas", name: "Unidas" },
			{ key: "uber", name: "Uber" },
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
		const apiKey = process.env.SERPAPI_KEY;
		if (!apiKey) {
			sysLogger.error(
				"SERPAPI_KEY não configurada nas variáveis de ambiente da Function",
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

			sysLogger.info("Busca por produtos executada com sucesso", { query });
			return res.json({ links });
		} catch (err) {
			if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
				sysLogger.warn("Timeout ao consultar a Serper API", { query });
				return res.json(
					{ message: "A busca demorou demais, tente novamente" },
					504,
				);
			}

			sysLogger.error("Erro inesperado na Serper API", {
				error: err.message,
				stack: err.stack,
			});
			return res.json({ message: "Erro interno ao buscar produtos" }, 500);
		}
	}

	// --- Rota: generate-thank-you ---
	if (action === "ai-thanks") {
		const guestName = sanitizeField(payload.guestName);
		const coupleName = sanitizeField(payload.coupleName);
		const REQUEST_TIMEOUT_MS = 12000;

		if (!guestName || !coupleName) {
			return res.json(
				{ message: "guestName e coupleName são obrigatórios" },
				400,
			);
		}

		const apiKey = process.env.GEMINI_API_KEY;
		if (!apiKey) {
			sysLogger.error(
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
				sysLogger.warn("Gemini API retornou resposta vazia");
				return res.json(
					{ message: "Não foi possível gerar a mensagem agora" },
					502,
				);
			}

			sysLogger.info("Mensagem de agradecimento gerada com IA com sucesso");
			return res.json({ text: text.trim(), generatedByAI: true });
		} catch (err) {
			sysLogger.error("Erro na Gemini API", {
				error: err.message,
				stack: err.stack,
			});
			return res.json({ message: "Erro interno ao gerar a mensagem" }, 500);
		}
	}

	// --- Rota: claim-product (Proteção BOLA/IDOR para incrementação de presentes) ---
	if (action === "claim-product") {
		const productId = payload.productId;
		const claimedQty = Number(payload.claimed_quantity);

		if (!productId || Number.isNaN(claimedQty) || claimedQty < 0) {
			sysLogger.warn("Tentativa de claim com parâmetros inválidos", {
				productId,
				claimedQty,
			});
			return res.json({ error: "Parâmetros de produto inválidos" }, 400);
		}

		const client = new Client()
			.setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
			.setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
			.setKey(
				process.env.APPWRITE_API_KEY || req.headers["x-appwrite-key"] || "",
			);
		const databases = new Databases(client);

		const DATABASE_ID = process.env.DATABASE_ID || "6a2cb37d0034ac2b40c6";
		const TABLE_PRODUCTS = "products";

		try {
			// 1. Obter o produto atual de forma segura
			const product = await databases.getDocument(
				DATABASE_ID,
				TABLE_PRODUCTS,
				productId,
			);

			if (!product) {
				sysLogger.warn("Produto não encontrado", { productId });
				return res.json({ error: "Produto não encontrado" }, 404);
			}

			// 2. Validação BOLA/IDOR: Garantir que a quantidade reivindicada só cresça, e não ultrapasse o desejado
			if (claimedQty < product.claimed_quantity) {
				sysLogger.warn("Tentativa de redução de quantidade não autorizada", {
					productId,
					current: product.claimed_quantity,
					attempted: claimedQty,
				});
				return res.json({ error: "Quantidade reservada inválida" }, 400);
			}

			if (claimedQty > product.desired_quantity) {
				sysLogger.warn("Tentativa de reserva acima do limite desejado", {
					productId,
					desired: product.desired_quantity,
					attempted: claimedQty,
				});
				return res.json({ error: "A quantidade desejada foi excedida" }, 400);
			}

			// 3. Executar o update pelo backend com permissões de administrador do Appwrite
			const updatedProduct = await databases.updateDocument(
				DATABASE_ID,
				TABLE_PRODUCTS,
				productId,
				{
					claimed_quantity: claimedQty,
				},
			);

			sysLogger.info("Presente reservado com sucesso no servidor", {
				productId,
				quantity: claimedQty,
			});
			return res.json({ product: updatedProduct });
		} catch (err) {
			sysLogger.error("Erro ao registrar reserva de presente no servidor", {
				productId,
				error: err.message,
				stack: err.stack,
			});
			return res.json(
				{ error: "Erro interno do servidor ao registrar presente" },
				500,
			);
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

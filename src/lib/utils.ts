import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

import {
	isValidCNPJ,
	isValidCPF,
	parseCurrency,
} from "@brazilian-utils/brazilian-utils";
export { isValidCNPJ, isValidCPF, parseCurrency };

import { QrCodePix } from "qrcode-pix";
import { parseMoney } from "./money";

export const KNOWN_STORES = [
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

/**
 * Identifica o nome da loja a partir de uma URL ou domínio
 */
export function extractStoreName(rawUrl: string): string {
	if (!rawUrl) return "Loja";

	try {
		const formattedUrl =
			rawUrl.startsWith("http://") || rawUrl.startsWith("https://")
				? rawUrl
				: `https://${rawUrl}`;

		const urlObj = new URL(formattedUrl);
		const lowerHost = urlObj.hostname.toLowerCase();
		const lowerFull = formattedUrl.toLowerCase();

		// Procura na lista de lojas conhecidas
		const known = KNOWN_STORES.find(
			(store) => lowerHost.includes(store.key) || lowerFull.includes(store.key),
		);
		if (known) {
			return known.name;
		}

		// Fallback: extrai o nome limpo do domínio
		const cleanHost = lowerHost.replace(/^www\./, "");
		const parts = cleanHost.split(".");
		const mainDomain = parts[0] || "Loja";

		return mainDomain.toUpperCase();
	} catch {
		return "Loja";
	}
}

/**
 * Normaliza e sanitiza chaves PIX para garantir compatibilidade com o DICT do Banco Central
 */
export function sanitizePixKey(rawKey: string): string {
	if (!rawKey) return "";
	const clean = rawKey.trim();

	// Chave aleatória / EVP (UUID com hífens)
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	if (uuidRegex.test(clean)) {
		return clean.toLowerCase();
	}

	// Chave aleatória / EVP sem hífens (32 caracteres hexadecimais)
	if (/^[0-9a-f]{32}$/i.test(clean)) {
		const lower = clean.toLowerCase();
		return `${lower.slice(0, 8)}-${lower.slice(8, 12)}-${lower.slice(12, 16)}-${lower.slice(16, 20)}-${lower.slice(20)}`;
	}

	// E-mail
	if (clean.includes("@")) {
		return clean.toLowerCase();
	}

	// Se for telefone internacional já com +
	if (clean.startsWith("+")) {
		const digits = clean.replace(/\D/g, "");
		return `+${digits}`;
	}

	const digits = clean.replace(/\D/g, "");

	// CNPJ (14 dígitos)
	if (digits.length === 14) {
		return digits;
	}

	// Telefone celular ou fixo já com DDI 55 (12 ou 13 dígitos)
	if (
		(digits.length === 12 || digits.length === 13) &&
		digits.startsWith("55")
	) {
		return `+${digits}`;
	}

	// Telefone fixo nacional (10 dígitos: DDD + 8 dígitos)
	if (digits.length === 10) {
		return `+55${digits}`;
	}

	// 11 dígitos: CPF ou Celular nacional
	if (digits.length === 11) {
		// Se tinha pontuação de CPF (. ou -) e é um CPF válido
		if (/[.-]/.test(clean) && isValidCPF(digits)) {
			return digits;
		}
		// Celular nacional: 2 dígitos de DDD (11-99) seguido de 9 e 8 dígitos
		if (/^[1-9]{2}9[0-9]{8}$/.test(digits)) {
			if (/[()\s]/.test(clean)) {
				return `+55${digits}`;
			}
			if (isValidCPF(digits)) {
				return digits;
			}
			return `+55${digits}`;
		}
		return digits;
	}

	return clean;
}

export async function generatePixPayload(
	key: string,
	name: string,
	value: string,
	message?: string,
	transactionId = "***",
	city = "SALVADOR",
): Promise<{ payload: string; base64: string }> {
	if (!key || !name) return { payload: "", base64: "" };

	try {
		const cleanKey = sanitizePixKey(key);
		if (!cleanKey) return { payload: "", base64: "" };

		// Sanitização do nome do recebedor (máx 25 chars, sem acentos, maiúsculo - padrão BACEN)
		const cleanName = name
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "")
			.trim()
			.substring(0, 25)
			.toUpperCase();

		// Sanitização da cidade (máx 15 chars, sem acentos, maiúsculo - padrão BACEN)
		const cleanCity = (city || "SALVADOR")
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "")
			.trim()
			.substring(0, 15)
			.toUpperCase();

		// Sanitização do transactionId (txid): no PIX estático, o padrão oficial BACEN é '***'.
		// Se fornecido outro txid, sanitiza para alfanumérico com no máximo 25 caracteres.
		let cleanTxid = "***";
		if (transactionId && transactionId !== "***") {
			const sanitized = transactionId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25);
			if (sanitized) {
				cleanTxid = sanitized;
			}
		}

		// Sanitização da mensagem: normalizar acentos para não quebrar a contagem de bytes TLV do EMV.
		// No padrão EMV, o campo Length da Tag 26 suporta no máximo 2 dígitos decimais (até 99 caracteres).
		// Estrutura interna da Tag 26:
		// - Subtag 00: "0014BR.GOV.BCB.PIX" (18 caracteres)
		// - Subtag 01: "01" + len(2) + cleanKey (4 + cleanKey.length caracteres)
		// - Subtag 02: "02" + len(2) + cleanMessage (4 + cleanMessage.length caracteres)
		// Espaço disponível para o texto da mensagem = 99 - 18 - 4 - cleanKey.length - 4 = 73 - cleanKey.length.
		let cleanMessage: string | undefined;
		if (message?.trim()) {
			const maxAllowedLen = Math.min(35, Math.max(0, 73 - cleanKey.length));
			if (maxAllowedLen > 0) {
				const sanitized = message
					.normalize("NFD")
					.replace(/\p{Diacritic}/gu, "")
					.replace(/[^a-zA-Z0-9 ]/g, "")
					.trim()
					.slice(0, maxAllowedLen)
					.trim();
				if (sanitized) {
					cleanMessage = sanitized;
				}
			}
		}

		const parsedValue = parseMoney(value);

		const qrCodePix = QrCodePix({
			version: "01",
			key: cleanKey,
			name: cleanName || "NOIVOS",
			city: cleanCity || "SALVADOR",
			transactionId: cleanTxid,
			message: cleanMessage,
			value: parsedValue > 0 ? parsedValue : undefined,
		});

		return {
			payload: qrCodePix.payload(),
			base64: await qrCodePix.base64(),
		};
	} catch (error) {
		const err = error instanceof Error ? error : new Error(String(error));
		console.error("Falha ao gerar payload PIX:", err.message);
		return { payload: "", base64: "" };
	}
}

export function sortBy<T>(
	array: T[],
	keyOrGetter: keyof T | ((item: T) => number | string | null | undefined),
	direction: "asc" | "desc" = "asc",
): T[] {
	return [...array].sort((a, b) => {
		const valA =
			typeof keyOrGetter === "function" ? keyOrGetter(a) : a[keyOrGetter];
		const valB =
			typeof keyOrGetter === "function" ? keyOrGetter(b) : b[keyOrGetter];

		if (valA === valB) return 0;
		if (valA == null) return direction === "asc" ? 1 : -1;
		if (valB == null) return direction === "asc" ? -1 : 1;

		const numA = typeof valA === "number" ? valA : Number(valA);
		const numB = typeof valB === "number" ? valB : Number(valB);

		if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
			return direction === "asc" ? numA - numB : numB - numA;
		}

		const strA = String(valA).toLowerCase();
		const strB = String(valB).toLowerCase();

		return direction === "asc"
			? strA.localeCompare(strB, undefined, { numeric: true })
			: strB.localeCompare(strA, undefined, { numeric: true });
	});
}

/**
 * Embaralha os elementos de um array utilizando o algoritmo Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
	const result = [...array];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = result[i];
		result[i] = result[j];
		result[j] = temp;
	}
	return result;
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

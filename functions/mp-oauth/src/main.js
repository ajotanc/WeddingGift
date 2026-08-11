import { Client, Databases } from "node-appwrite";

/**
 * Appwrite Function: ml-oauth
 * Runtime: Node 22
 * 
 * Troca o código de autorização (authorization_code) do Mercado Pago por access_token,
 * refresh_token e mp_user_id, e atualiza o documento do noivo/tenant no Appwrite Database.
 */
export default async ({ req, res, log, error }) => {
	log("Iniciando execução da função ml-oauth...");

	// 1. Apenas aceitar método POST
	if (req.method !== "POST") {
		return res.json({ error: "Método não suportado. Use POST." }, 405);
	}

	// 2. Parse do corpo da requisição
	let body = {};
	try {
		if (typeof req.bodyRaw === "string" && req.bodyRaw.trim().length > 0) {
			body = JSON.parse(req.bodyRaw);
		} else if (typeof req.body === "string" && req.body.trim().length > 0) {
			body = JSON.parse(req.body);
		} else if (typeof req.body === "object" && req.body !== null) {
			body = req.body;
		}
	} catch (err) {
		error(`Erro ao fazer parse do body: ${err.message}`);
		return res.json({ error: "Corpo da requisição inválido (JSON esperado)." }, 400);
	}

	const { code, tenantId, redirectUri } = body;

	if (!code) {
		return res.json({ error: "Parâmetro 'code' é obrigatório." }, 400);
	}
	if (!tenantId) {
		return res.json({ error: "Parâmetro 'tenantId' é obrigatório." }, 400);
	}

	// 3. Parâmetros de ambiente
	const mpClientId = process.env.MP_CLIENT_ID;
	const mpClientSecret = process.env.MP_CLIENT_SECRET;
	const effectiveRedirectUri = redirectUri || "https://eternosim.com.br/admin/config/mercadopago";

	if (!mpClientSecret) {
		error("MP_CLIENT_SECRET não configurado nas variáveis de ambiente da Function.");
		return res.json({ error: "Configuração do Mercado Pago ausente no servidor (MP_CLIENT_SECRET)." }, 500);
	}

	log(`Solicitando OAuth ao Mercado Pago para tenantId=${tenantId}...`);

	// 4. Trocar o authorization code por tokens no Mercado Pago
	try {
		const params = new URLSearchParams();
		params.append("client_id", mpClientId);
		params.append("client_secret", mpClientSecret);
		params.append("grant_type", "authorization_code");
		params.append("code", code);
		params.append("redirect_uri", effectiveRedirectUri);

		const mpResponse = await fetch("https://api.mercadopago.com/oauth/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Accept": "application/json",
			},
			body: params.toString(),
		});

		const mpData = await mpResponse.json();

		if (!mpResponse.ok) {
			error(`Erro na API do Mercado Pago: ${JSON.stringify(mpData)}`);
			return res.json({
				error: mpData.message || mpData.error_description || "Falha ao obter tokens no Mercado Pago.",
				details: mpData,
			}, 400);
		}

		log(`OAuth concluído com sucesso para MP User ID: ${mpData.user_id}`);

		// 5. Atualizar o documento do tenant no Appwrite Database
		const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
		const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
		const apiKey = process.env.APPWRITE_API_KEY;
		const databaseId = process.env.APPWRITE_DATABASE_ID;
		const collectionId = "tenants";

		const client = new Client()
			.setEndpoint(endpoint)
			.setProject(projectId);

		if (apiKey) {
			client.setKey(apiKey);
		}

		const databases = new Databases(client);

		const updatePayload = {
			mp_user_id: String(mpData.user_id),
			mp_access_token: mpData.access_token,
			mp_refresh_token: mpData.refresh_token || "",
		};

		const updatedTenant = await databases.updateDocument(
			databaseId,
			collectionId,
			tenantId,
			updatePayload
		);

		log(`Documento do tenant ${tenantId} atualizado com sucesso!`);

		return res.json({
			success: true,
			tenantId: updatedTenant.$id,
			mp_user_id: String(mpData.user_id),
		}, 200);

	} catch (err) {
		error(`Exceção capturada em ml-oauth: ${err.message}`);
		return res.json({
			error: "Erro interno do servidor ao processar OAuth.",
			message: err.message,
		}, 500);
	}
};

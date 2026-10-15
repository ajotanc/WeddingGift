import { Client, Databases, Users } from "node-appwrite";
import { getCallerId, getTenantAccess, parseBody } from "./lib.js";

/**
 * Appwrite Function: mp-oauth
 * Runtime: Node 22
 *
 * - action "exchange" (padrão): troca o authorization_code do Mercado Pago por tokens.
 * - action "disconnect": remove a conta do Mercado Pago do casal.
 *
 * Só o dono ou o co-administrador do casal podem chamar. Os tokens ficam na tabela
 * `tenant_secrets`, que não tem leitura pública; no tenant fica apenas o mp_user_id.
 */

export function createDeps(req) {
	const client = new Client()
		.setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
		.setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
		.setKey(process.env.APPWRITE_API_KEY || req.headers?.["x-appwrite-key"] || "");

	return {
		databases: new Databases(client),
		users: new Users(client),
		databaseId: process.env.APPWRITE_DATABASE_ID,
		fetch: globalThis.fetch,
		env: process.env,
	};
}

export async function saveSecrets(databases, databaseId, tenantId, data) {
	try {
		return await databases.updateDocument(databaseId, "tenant_secrets", tenantId, data);
	} catch (err) {
		if (err?.code !== 404) throw err;
		return await databases.createDocument(databaseId, "tenant_secrets", tenantId, data, []);
	}
}

export async function handle({ req, res, log, error }, deps) {
	if (req.method !== "POST") {
		return res.json({ error: "Método não suportado. Use POST." }, 405);
	}

	const userId = getCallerId(req);
	if (!userId) return res.json({ error: "Não autenticado." }, 401);

	const body = parseBody(req);
	if (!body) return res.json({ error: "Corpo da requisição inválido (JSON esperado)." }, 400);

	const { code, tenantId, redirectUri } = body;
	const action = body.action || "exchange";
	if (!tenantId) return res.json({ error: "Parâmetro 'tenantId' é obrigatório." }, 400);

	const { databases, users, databaseId } = deps;
	const access = await getTenantAccess({ databases, users, databaseId, tenantId, userId });
	if (!access.isMember) return res.json({ error: "Acesso negado." }, 403);

	try {
		if (action === "disconnect") {
			await saveSecrets(databases, databaseId, tenantId, {
				mp_user_id: null,
				mp_access_token: null,
				mp_refresh_token: null,
			});
			await databases.updateDocument(databaseId, "tenants", tenantId, {
				mp_user_id: null,
				mp_access_token: null,
				mp_refresh_token: null,
			});
			return res.json({ success: true }, 200);
		}

		if (action !== "exchange") return res.json({ error: "Ação inválida." }, 400);
		if (!code) return res.json({ error: "Parâmetro 'code' é obrigatório." }, 400);

		const mpClientId = deps.env.MP_CLIENT_ID;
		const mpClientSecret = deps.env.MP_CLIENT_SECRET;
		if (!mpClientSecret) {
			error("MP_CLIENT_SECRET não configurado nas variáveis de ambiente da Function.");
			return res.json({ error: "Configuração do Mercado Pago ausente no servidor." }, 500);
		}

		const params = new URLSearchParams({
			client_id: mpClientId || "",
			client_secret: mpClientSecret,
			grant_type: "authorization_code",
			code,
			redirect_uri: redirectUri || "https://eternosim.com.br/admin/config/mercadopago",
		});

		const mpResponse = await deps.fetch("https://api.mercadopago.com/oauth/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "application/json",
			},
			body: params.toString(),
		});
		const mpData = await mpResponse.json();

		if (!mpResponse.ok) {
			error(`Erro na API do Mercado Pago: status=${mpResponse.status}`);
			return res.json(
				{
					error:
						mpData.message || mpData.error_description || "Falha ao obter tokens no Mercado Pago.",
				},
				400,
			);
		}

		const mpUserId = String(mpData.user_id);
		await saveSecrets(databases, databaseId, tenantId, {
			mp_user_id: mpUserId,
			mp_access_token: mpData.access_token,
			mp_refresh_token: mpData.refresh_token || "",
		});
		await databases.updateDocument(databaseId, "tenants", tenantId, {
			mp_user_id: mpUserId,
			mp_access_token: null,
			mp_refresh_token: null,
		});

		log(`Mercado Pago conectado para o tenant ${tenantId}.`);
		return res.json({ success: true, tenantId, mp_user_id: mpUserId }, 200);
	} catch (err) {
		error(`Exceção em mp-oauth: ${err.message}`);
		return res.json({ error: "Erro interno do servidor ao processar OAuth." }, 500);
	}
}

export default async (ctx) => handle(ctx, createDeps(ctx.req));

import { Client, Databases, Query } from "node-appwrite";
import https from "https";

// Helper function to make HTTP GET requests using native Node.js https module
function getRequest(url, headers = {}) {
	return new Promise((resolve, reject) => {
		https
			.get(url, { headers }, (res) => {
				let data = "";
				res.on("data", (chunk) => {
					data += chunk;
				});
				res.on("end", () => {
					try {
						if (res.statusCode >= 200 && res.statusCode < 300) {
							resolve(JSON.parse(data));
						} else {
							reject(
								new Error(
									`Request failed with status ${res.statusCode}: ${data}`,
								),
							);
						}
					} catch (err) {
						reject(err);
					}
				});
			})
			.on("error", (err) => {
				reject(err);
			});
	});
}

// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
	// 1. Parse payload
	let payload = {};
	if (typeof req.body === "string") {
		try {
			payload = JSON.parse(req.body);
		} catch (err) {
			error("Payload JSON inválido");
			return res.json({ error: "Payload inválido" }, 400);
		}
	} else if (typeof req.body === "object" && req.body !== null) {
		payload = req.body;
	}

	log("Webhook recebido: " + JSON.stringify(payload));

	// Filtra apenas notificações de pagamento
	if (payload.type !== "payment" && payload.topic !== "payment") {
		return res.json({ message: "Ignorado" }, 200);
	}

	const paymentId = payload.data?.id || payload.id;
	const sellerId = String(payload.user_id); // ID do vendedor do Mercado Pago

	if (!paymentId) {
		return res.json({ error: "ID do pagamento não enviado" }, 400);
	}

	// 2. Inicializa a SDK do Appwrite
	const client = new Client()
		.setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
		.setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
		.setKey(
			process.env.APPWRITE_API_KEY || req.headers["x-appwrite-key"] || "",
		);
	const databases = new Databases(client);

	// Variáveis de ambiente configuradas por você
	const DATABASE_ID = process.env.DATABASE_ID;
	const TENANTS_COLLECTION_ID = process.env.TENANTS_COLLECTION_ID;
	const PURCHASES_COLLECTION_ID = process.env.PURCHASES_COLLECTION_ID;

	// Suas credenciais do Mercado Pago (Dono do App)
	const MY_MP_ACCESS_TOKEN = process.env.MY_MP_ACCESS_TOKEN;
	const MY_MP_SELLER_ID = process.env.MY_MP_SELLER_ID; // Seu User ID do Mercado Pago

	try {
		let accessToken = "";
		let isSubscription = false;

		// A. Verifica se o pagamento foi direcionado para você (Assinatura)
		if (sellerId === MY_MP_SELLER_ID) {
			accessToken = MY_MP_ACCESS_TOKEN;
			isSubscription = true;
		} else {
			// B. Senão, busca o Tenant (Casal) correspondente ao sellerId do Mercado Pago
			const tenantsList = await databases.listDocuments(
				DATABASE_ID,
				TENANTS_COLLECTION_ID,
				[Query.equal("mp_seller_id", sellerId)],
			);

			if (tenantsList.total === 0) {
				error(`Casal não encontrado para o ID de vendedor MP: ${sellerId}`);
				return res.json({ error: "Tenant não encontrado" }, 404);
			}

			const tenant = tenantsList.documents[0];
			accessToken = tenant.mp_access_token; // Token de acesso da conta do casal
		}

		// 3. Consulta os detalhes oficiais do pagamento diretamente na API do Mercado Pago
		log(`Buscando detalhes do pagamento ${paymentId}...`);
		let paymentData;
		try {
			paymentData = await getRequest(
				`https://api.mercadopago.com/v1/payments/${paymentId}`,
				{ Authorization: `Bearer ${accessToken}` },
			);
		} catch (apiErr) {
			log(
				`Aviso: Não foi possível obter os detalhes do pagamento ${paymentId} na API do MP (pode ser um teste do webhook). Retornando 200 OK.`,
			);
			return res.json(
				{ message: "Webhook recebido com sucesso (modo teste/pendente)" },
				200,
			);
		}

		log(`Status do pagamento retornado pelo MP: ${paymentData.status}`);

		// 4. Se o pagamento estiver aprovado, atualiza o banco de dados
		if (paymentData.status === "approved") {
			if (isSubscription) {
				// --- FLUXO DE ASSINATURA ---
				const tenantId = paymentData.metadata?.tenant_id;
				const planType = paymentData.metadata?.plan_type; // 'quarterly' ou 'semestral'

				if (!tenantId) {
					error("Pagamento de assinatura não contém metadata tenant_id");
					return res.json({ error: "Metadata tenant_id ausente" }, 400);
				}

				const months = planType === "quarterly" ? 3 : 6;
				const expiryDate = new Date();
				expiryDate.setMonth(expiryDate.getMonth() + months);

				await databases.updateDocument(
					DATABASE_ID,
					TENANTS_COLLECTION_ID,
					tenantId,
					{
						plan: "premium",
						premium_until: expiryDate.toISOString(),
					},
				);

				log(
					`Assinatura do Tenant ${tenantId} ativada até ${expiryDate.toISOString()}`,
				);
			} else {
				// --- FLUXO DE PRESENTE ---
				const purchaseId = paymentData.metadata?.purchase_id;

				if (!purchaseId) {
					error("Pagamento de presente não contém metadata purchase_id");
					return res.json({ error: "Metadata purchase_id ausente" }, 400);
				}

				await databases.updateDocument(
					DATABASE_ID,
					PURCHASES_COLLECTION_ID,
					purchaseId,
					{
						status: "paid",
					},
				);

				log(`Compra de presente ${purchaseId} marcada como PAGA.`);
			}
		}

		return res.json({ message: "Webhook processado com sucesso" }, 200);
	} catch (err) {
		error("Erro ao processar o webhook: " + err.message);
		return res.json({ error: err.message }, 500);
	}
};

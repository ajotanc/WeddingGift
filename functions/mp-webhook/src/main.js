import { Client, Databases, ID } from "node-appwrite";

/**
 * Appwrite Function: mp-webhook
 * Runtime: Node 22
 * 
 * Recebe notificações (Webhooks / IPN) do Mercado Pago referentes a pagamentos recebidos:
 * 1. Presentes de Casamento (Convidado -> Noivos): Atualiza a cota/presente como pago e salva a compra.
 * 2. Assinatura Premium SaaS (Noivo -> Plataforma): Atualiza o plano do tenant e a validade premium.
 */
export default async ({ req, res, log, error }) => {
	log("Iniciando recepção de webhook do Mercado Pago (mp-webhook)...");

	let body = {};
	try {
		if (typeof req.bodyRaw === "string" && req.bodyRaw.trim().length > 0) {
			body = JSON.parse(req.bodyRaw);
		} else if (typeof req.body === "string" && req.body.trim().length > 0) {
			body = JSON.parse(req.body);
		} else if (typeof req.body === "object" && req.body !== null) {
			body = req.body;
		}
	} catch (e) {
		log("Body não é um JSON padrão, verificando query params...");
	}

	const topic = body.type || body.topic || req.query?.type || req.query?.topic || "";
	const paymentId = body.data?.id || body.id || req.query?.["data.id"] || req.query?.id || "";

	log(`Webhook recebido - Topic: ${topic}, Payment ID: ${paymentId}`);

	if (!paymentId || (topic !== "payment" && topic !== "merchant_order" && topic !== "")) {
		log("Notificação ignorada (não é evento de pagamento).");
		return res.json({ received: true, status: "ignored" }, 200);
	}

	const platformToken = process.env.MP_CLIENT_SECRET;

	if (!platformToken) {
		error("Nenhum MP_CLIENT_SECRET configurado nas variáveis da Function.");
		return res.json({ received: true, error: "Token não configurado" }, 200);
	}

	try {
		log(`Consultando detalhes do pagamento ID=${paymentId} na API do Mercado Pago...`);
		let mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${platformToken}`,
				"Accept": "application/json",
			},
		});

		let paymentData = {};
		if (mpRes.ok) {
			paymentData = await mpRes.json();
		} else {
			error(`Aviso: Falha ao consultar com token da plataforma: status=${mpRes.status}`);
			return res.json({ received: true, status: "payment_fetch_failed" }, 200);
		}

		log(`Status do pagamento ${paymentId}: ${paymentData.status}`);

		if (paymentData.status === "approved") {
			const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
			const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
			const apiKey = process.env.APPWRITE_API_KEY;
			const databaseId = process.env.APPWRITE_DATABASE_ID;
			const collectionId = "purchases";

			if (!apiKey) {
				error("APPWRITE_API_KEY não encontrada nas variáveis de ambiente da Function.");
				return res.json({ received: true, error: "Falta APPWRITE_API_KEY" }, 200);
			}

			const client = new Client()
				.setEndpoint(endpoint)
				.setProject(projectId)
				.setKey(apiKey);

			const databases = new Databases(client);

			let extRef = {};
			try {
				if (typeof paymentData.external_reference === "string") {
					extRef = JSON.parse(paymentData.external_reference);
				} else if (typeof paymentData.external_reference === "object") {
					extRef = paymentData.external_reference;
				}
			} catch (parseErr) {
				log(`external_reference não é JSON estruturado: ${paymentData.external_reference}`);
			}

			// CASO 1: PRESENTE DE CASAMENTO (CONVIDADO -> NOIVOS)
			if (extRef.type === "gift") {
				const { tenantId, productId, quantity, guestId } = extRef;
				log(`Processando presente aprovado para tenantId=${tenantId}, productId=${productId}...`);

				if (productId) {
					try {
						const currentProduct = await databases.getDocument(databaseId, "products", productId);
						const newClaimed = (currentProduct.claimed_quantity || 0) + (Number(quantity) || 1);

						await databases.updateDocument(databaseId, "products", productId, {
							claimed_quantity: newClaimed,
						});
						log(`Quantidade de presentes reinvindicados atualizada para: ${newClaimed}`);
					} catch (prodErr) {
						error(`Erro ao atualizar quantidade do produto: ${prodErr.message}`);
					}
				}

				try {
					const purchaseDoc = await databases.createDocument(
						databaseId,
						collectionId,
						ID.unique(),
						{
							tenant: tenantId,
							guest: guestId || null,
							product: productId || null,
							quantity: Number(quantity) || 1,
							price_paid: String(paymentData.transaction_amount || 0),
							method: "pix",
						}
					);
					log(`Registro de compra criado no Appwrite: ${purchaseDoc.$id}`);
				} catch (purchErr) {
					log(`Aviso ao registrar compra no banco (pode já existir): ${purchErr.message}`);
				}
			}

			// CASO 2: ASSINATURA PREMIUM DO SAAS (NOIVO -> PLATAFORMA)
			if (extRef.type === "subscription") {
				const { tenantId, plan } = extRef;
				log(`Processando pagamento de assinatura aprovado para tenantId=${tenantId}, plan=${plan}...`);

				const monthsToAdd = plan === "semestral" ? 6 : 3;
				const expirationDate = new Date();
				expirationDate.setMonth(expirationDate.getMonth() + monthsToAdd);

				try {
					await databases.updateDocument(databaseId, "tenants", tenantId, {
						plan: "premium",
						premium_until: expirationDate.toISOString(),
					});
					log(`Assinatura ativada com sucesso para o tenant ${tenantId} até ${expirationDate.toISOString()}`);
				} catch (tenantErr) {
					error(`Erro ao atualizar plano do tenant: ${tenantErr.message}`);
				}
			}
		}

		return res.json({ received: true, paymentId, status: paymentData.status }, 200);

	} catch (err) {
		error(`Exceção em mp-webhook: ${err.message}`);
		return res.json({ received: true, error: err.message }, 200);
	}
};

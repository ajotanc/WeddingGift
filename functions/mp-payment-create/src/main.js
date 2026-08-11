import { Client, Databases } from "node-appwrite";

/**
 * Appwrite Function: mp-payment-create
 * Runtime: Node 22
 * 
 * Função responsável por criar cobranças no Mercado Pago:
 * 1. PIX dinâmico para presentes do casamento (usando o mp_access_token do noivo).
 * 2. Checkout Pro para assinaturas da plataforma SaaS (usando o MP_CLIENT_SECRET da plataforma).
 */
export default async ({ req, res, log, error }) => {
	log("Iniciando execução da função mp-payment-create...");

	if (req.method !== "POST") {
		return res.json({ error: "Método não suportado. Use POST." }, 405);
	}

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
		error(`Erro no parse do body: ${err.message}`);
		return res.json({ error: "JSON inválido." }, 400);
	}

	const { action, tenantId, productId, productName, quantity, price, guestId, guestName, guestEmail, plan, redirectUrl } = body;

	const endpoint = process.env.APPWRITE_FUNCTION_API_ENDPOINT;
	const projectId = process.env.APPWRITE_FUNCTION_PROJECT_ID;
	const apiKey = process.env.APPWRITE_API_KEY;
	const databaseId = process.env.APPWRITE_DATABASE_ID;

	const client = new Client().setEndpoint(endpoint).setProject(projectId);
	if (apiKey) client.setKey(apiKey);
	const databases = new Databases(client);

	// AÇÃO 1: CRIAR PIX DINÂMICO PARA PRESENTE (CONVIDADO -> NOIVOS)
	if (action === "create_gift_pix") {
		if (!tenantId || !price) {
			return res.json({ error: "Parâmetros 'tenantId' e 'price' são obrigatórios." }, 400);
		}

		try {
			log(`Buscando dados do tenant ${tenantId} para obter token do Mercado Pago...`);
			const tenantDoc = await databases.getDocument(databaseId, "tenants", tenantId);

			const mpAccessToken = tenantDoc.mp_access_token;
			if (!mpAccessToken) {
				return res.json({
					error: "O casal ainda não conectou a conta do Mercado Pago.",
					hasMpConnected: false,
				}, 400);
			}

			log(`Criando cobrança PIX no Mercado Pago do noivo...`);

			const percentageFee = 0.5;
			const marketplace_fee = Number(((Number(price) * percentageFee) / 100).toFixed(2));

			const mpPayload = {
				transaction_amount: Number(price),
				description: `Presente de Casamento: ${productName || "Cota de Presente"}`,
				payment_method_id: "pix",
				// marketplace_fee,
				payer: {
					email: guestEmail || "convidado@eternosim.com.br",
					first_name: guestName || "Convidado",
				},
				external_reference: JSON.stringify({
					type: "gift",
					tenantId,
					productId: productId || "",
					quantity: quantity || 1,
					guestId: guestId || "",
				}),
			};

			const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${mpAccessToken}`,
					"Content-Type": "application/json",
					"Accept": "application/json",
					"X-Idempotency-Key": `${tenantId}-${productId || "gift"}-${Date.now()}`,
				},
				body: JSON.stringify(mpPayload),
			});

			const mpData = await mpResponse.json();

			if (!mpResponse.ok) {
				error(`Erro da API Mercado Pago: ${JSON.stringify(mpData)}`);
				return res.json({
					error: mpData.message || "Falha ao gerar cobrança PIX no Mercado Pago.",
					details: mpData,
				}, 400);
			}

			const pixData = mpData.point_of_interaction?.transaction_data;
			log(`Cobrança PIX criada com sucesso. Payment ID: ${mpData.id}`);

			return res.json({
				success: true,
				paymentId: mpData.id,
				qr_code: pixData?.qr_code || "",
				qr_code_base64: pixData?.qr_code_base64 || "",
				ticket_url: pixData?.ticket_url || "",
			}, 200);

		} catch (err) {
			error(`Exceção ao criar PIX do presente: ${err.message}`);
			return res.json({ error: "Erro interno ao processar PIX.", message: err.message }, 500);
		}
	}

	// AÇÃO 2: CRIAR CHECKOUT PRO DE ASSINATURA DA PLATAFORMA (NOIVO -> PLATAFORMA)
	if (action === "create_subscription_checkout") {
		if (!tenantId || !plan) {
			return res.json({ error: "Parâmetros 'tenantId' e 'plan' são obrigatórios." }, 400);
		}

		const platformToken = process.env.MP_CLIENT_SECRET;
		if (!platformToken) {
			return res.json({ error: "MP_CLIENT_SECRET da plataforma não configurado no servidor." }, 500);
		}

		const planPrices = {
			quarterly: 99.00,
			semestral: 149.00,
		};
		const planNames = {
			quarterly: "Plano Trimestral (3 meses)",
			semestral: "Plano Semestral (6 meses)",
		};

		const amount = planPrices[plan] || 99.00;
		const title = `EternoSim - Assinatura Premium (${planNames[plan] || plan})`;

		try {
			log(`Criando preferência de Checkout Pro para tenantId=${tenantId}, plan=${plan}...`);

			const baseUrl = redirectUrl || "https://eternosim.com.br/admin/config?tab=subscription";

			const prefPayload = {
				items: [
					{
						title,
						quantity: 1,
						unit_price: amount,
						currency_id: "BRL",
					},
				],
				external_reference: JSON.stringify({
					type: "subscription",
					tenantId,
					plan,
				}),
				back_urls: {
					success: `${baseUrl}&status=success`,
					failure: `${baseUrl}&status=failure`,
					pending: `${baseUrl}&status=pending`,
				},
				auto_return: "approved",
			};

			const prefResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
				method: "POST",
				headers: {
					"Authorization": `Bearer ${platformToken}`,
					"Content-Type": "application/json",
					"Accept": "application/json",
				},
				body: JSON.stringify(prefPayload),
			});

			const prefData = await prefResponse.json();

			if (!prefResponse.ok) {
				error(`Erro da API Mercado Pago ao criar preferência: ${JSON.stringify(prefData)}`);
				return res.json({ error: "Falha ao gerar checkout de assinatura.", details: prefData }, 400);
			}

			log(`Preferência criada com sucesso! ID: ${prefData.id}`);

			return res.json({
				success: true,
				preferenceId: prefData.id,
				init_point: prefData.init_point,
				sandbox_init_point: prefData.sandbox_init_point,
			}, 200);

		} catch (err) {
			error(`Exceção ao criar checkout de assinatura: ${err.message}`);
			return res.json({ error: "Erro interno ao processar assinatura.", message: err.message }, 500);
		}
	}

	return res.json({ error: "Ação não informada ou inválida ('action')." }, 400);
};

import { functions } from "@/lib/appwrite";
import { ExecutionMethod } from "appwrite";

const MP_CLIENT_ID = import.meta.env.VITE_MP_CLIENT_ID;
const MP_OAUTH_STATE_KEY = "mp_oauth_state";

export interface ICreateGiftPixParams {
	tenantId: string;
	productId: string;
	quantity: number;
	/** Só é considerado em presentes de valor livre; nos demais o servidor calcula. */
	amount?: number;
}

export interface ICreateSubscriptionParams {
	tenantId: string;
	plan: "quarterly" | "semestral";
}

export const PaymentService = {
	/**
	 * O `state` é um valor aleatório guardado nesta aba. Assim um link com um
	 * `code` de outra conta do Mercado Pago (CSRF) não é aceito no retorno.
	 */
	getAuthUrl: (tenantId: string) => {
		const nonce = crypto.randomUUID();
		sessionStorage.setItem(MP_OAUTH_STATE_KEY, `${tenantId}:${nonce}`);

		const url = new URL("https://auth.mercadopago.com/authorization");
		url.searchParams.set("client_id", MP_CLIENT_ID);
		url.searchParams.set("response_type", "code");
		url.searchParams.set("platform_id", "mp");
		url.searchParams.set("state", nonce);
		url.searchParams.set(
			"redirect_uri",
			`${window.location.origin}/admin/config/mercadopago`,
		);
		return url.toString();
	},

	/** Confere e descarta o `state` salvo por getAuthUrl. */
	consumeOAuthState: (state: string, tenantId: string): boolean => {
		const saved = sessionStorage.getItem(MP_OAUTH_STATE_KEY);
		sessionStorage.removeItem(MP_OAUTH_STATE_KEY);
		return !!state && saved === `${tenantId}:${state}`;
	},

	exchangeCodeForToken: async (code: string, tenantId: string) => {
		const redirectUri = `${window.location.origin}/admin/config/mercadopago`;

		const execution = await functions.createExecution({
			functionId: "mp-oauth",
			body: JSON.stringify({
				code,
				tenantId,
				redirectUri,
			}),
			async: false,
			xpath: "/",
			method: ExecutionMethod.POST,
		});

		if (execution.responseStatusCode >= 400) {
			const errorBody = JSON.parse(execution.responseBody || "{}");
			throw new Error(
				errorBody.error || "Falha ao conectar conta do Mercado Pago",
			);
		}

		return JSON.parse(execution.responseBody || "{}");
	},

	// Criar pagamento PIX dinâmico do presente no Mercado Pago do casal
	createGiftPixPayment: async (params: ICreateGiftPixParams) => {
		const execution = await functions.createExecution({
			functionId: "mp-payment-create",
			body: JSON.stringify({
				action: "create_gift_pix",
				...params,
			}),
			async: false,
			xpath: "/",
			method: ExecutionMethod.POST,
		});

		const responseBody = JSON.parse(execution.responseBody || "{}");
		if (execution.responseStatusCode >= 400) {
			throw new Error(responseBody.error || "Falha ao gerar cobrança PIX.");
		}

		return responseBody as {
			success: boolean;
			paymentId: number;
			qr_code: string;
			qr_code_base64: string;
			ticket_url: string;
		};
	},

	// Criar Checkout Pro para Assinaturas da Plataforma
	createSubscriptionCheckout: async (params: ICreateSubscriptionParams) => {
		const redirectUrl = `${window.location.origin}/admin/config?tab=subscription`;

		const execution = await functions.createExecution({
			functionId: "mp-payment-create",
			body: JSON.stringify({
				action: "create_subscription_checkout",
				tenantId: params.tenantId,
				plan: params.plan,
				redirectUrl,
			}),
			async: false,
			xpath: "/",
			method: ExecutionMethod.POST,
		});

		const responseBody = JSON.parse(execution.responseBody || "{}");
		if (execution.responseStatusCode >= 400) {
			throw new Error(
				responseBody.error || "Falha ao gerar checkout de assinatura.",
			);
		}

		return responseBody as {
			success: boolean;
			preferenceId: string;
			init_point: string;
			sandbox_init_point: string;
		};
	},

	// Remove a conta do Mercado Pago do casal (tokens ficam só no servidor)
	disconnect: async (tenantId: string) => {
		const execution = await functions.createExecution({
			functionId: "mp-oauth",
			body: JSON.stringify({ action: "disconnect", tenantId }),
			async: false,
			xpath: "/",
			method: ExecutionMethod.POST,
		});

		if (execution.responseStatusCode >= 400) {
			const errorBody = JSON.parse(execution.responseBody || "{}");
			throw new Error(errorBody.error || "Falha ao desconectar o Mercado Pago");
		}
	},
};

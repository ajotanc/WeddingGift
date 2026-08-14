import { functions } from "@/lib/appwrite";
import { ExecutionMethod } from "appwrite";
import { TenantService } from "./tenant.service";

const MP_CLIENT_ID = import.meta.env.VITE_MP_CLIENT_ID;

export interface ICreateGiftPixParams {
	tenantId: string;
	productId?: string;
	productName?: string;
	quantity?: number;
	price: number;
	guestName?: string;
	guestEmail?: string;
	guestId?: string;
}

export interface ICreateSubscriptionParams {
	tenantId: string;
	plan: "quarterly" | "semestral";
}

export const PaymentService = {
	getAuthUrl: (tenantId: string) => {
		const redirectUri = `${window.location.origin}/admin/config/mercadopago`;
		return `https://auth.mercadopago.com/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&state=${tenantId}&redirect_uri=${redirectUri}`;
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

	// Limpa as credenciais do banco
	disconnect: async (tenantId: string) => {
		return await TenantService.update(tenantId, {
			mp_user_id: null,
			mp_access_token: null,
			mp_refresh_token: null,
		});
	},
};

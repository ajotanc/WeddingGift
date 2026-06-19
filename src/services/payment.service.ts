// src/services/payment.service.ts
import { TenantService } from "./tenant.service";

const MP_CLIENT_ID = import.meta.env.VITE_MP_CLIENT_ID;

export const PaymentService = {
	// Gera a URL de autorização para o usuário clicar
	getAuthUrl: (tenantId: string) => {
		console.log(MP_CLIENT_ID);
		const redirectUri = `https://texts-september-garmin-individual.trycloudflare.com/admin/config/mercadopago`;

		return `https://auth.mercadopago.com/authorization?client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&state=${tenantId}&redirect_uri=${redirectUri}`;
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

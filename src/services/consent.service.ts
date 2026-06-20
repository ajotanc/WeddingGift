import { DATABASE_ID, tables } from "@/lib/appwrite";
import { TABLE_CONSENT_LOGS } from "@/lib/collections";
import { AppwriteException, ID, Permission, Role } from "appwrite";

export interface IConsentLog {
	user_id: string;
	email: string;
	accepted_terms: boolean;
	accepted_terms_at: string;
	ip_address?: string;
	user_agent?: string;
}

export const ConsentService = {
	async log(data: IConsentLog): Promise<void> {
		try {
			const id = ID.unique();

			const user_agent =
				typeof window !== "undefined" ? window.navigator.userAgent : undefined;

			const response = await fetch("https://api.ipify.org?format=json");
			const { ip: ip_address } = await response.json();

			const permissions = [
				Permission.read(Role.user(data.user_id)),
				Permission.write(Role.user(data.user_id)),
			];

			await tables.createRow({
				databaseId: DATABASE_ID,
				tableId: TABLE_CONSENT_LOGS,
				rowId: id,
				data: {
					user_id: data.user_id,
					email: data.email,
					accepted_terms: data.accepted_terms,
					accepted_terms_at: data.accepted_terms_at,
					ip_address: ip_address || "0.0.0.0",
					user_agent,
				},
				permissions,
			});
		} catch (error) {
			if (error instanceof AppwriteException) {
				console.warn(
					"Aviso: Não foi possível gravar o log de consentimento no Appwrite (coleção consent_logs pode não estar criada no console). Detalhe:",
					error.message,
				);
			} else {
				console.error("Erro inesperado ao gravar consentimento:", error);
			}
		}
	},
};

import {
	Account,
	Client,
	Functions,
	Permission,
	Realtime,
	Role,
	Storage,
	TablesDB,
	Teams,
} from "appwrite";

export const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

const client = new Client();

const appwriteEndpoint = import.meta.env.VITE_APPWRITE_ENDPOINT?.startsWith(
	"http",
)
	? import.meta.env.VITE_APPWRITE_ENDPOINT
	: `${window.location.origin}/v1`;

client.setEndpoint(appwriteEndpoint).setProject(PROJECT_ID);

export const account = new Account(client);
export const tables = new TablesDB(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const realtime = new Realtime(client);
export const teams = new Teams(client);

export { Permission, Role };
export default client;

/**
 * Conteúdo do casal (tenant, produtos, FAQ, cronograma, quiz, fotos do casal):
 * qualquer um lê, só o time do casal (dono + co-administrador) altera.
 * O time tem o mesmo id do tenant.
 */
export const getTenantPermissions = (tenantId: string) => [
	Permission.read(Role.any()),
	Permission.update(Role.team(tenantId)),
	Permission.delete(Role.team(tenantId)),
];

export const getProductPermissions = getTenantPermissions;

/** Usadas só na criação do tenant, antes de o servidor criar o time do casal. */
export const getOwnerBootstrapPermissions = (ownerId: string) => [
	Permission.read(Role.any()),
	Permission.update(Role.user(ownerId)),
	Permission.delete(Role.user(ownerId)),
];
export const getFaqSchedulePermissions = getTenantPermissions;

/**
 * Conteúdo do convidado (perfil, RSVP, recado, foto): qualquer um lê, só o autor
 * altera. Curtidas e moderação pelo casal passam pela Function app-actions.
 */
export const getGuestContentPermissions = (userId: string) => [
	Permission.read(Role.any()),
	Permission.update(Role.user(userId)),
	Permission.delete(Role.user(userId)),
];

/** Id do convidado em um relacionamento (objeto carregado ou só o id). */
export const guestIdOf = (
	guest: { $id?: string } | string | null | undefined,
): string => (typeof guest === "string" ? guest : guest?.$id || "");

/** Indica se a linha foi criada pelo casal (time) ou, em dados antigos, pelo dono. */
export const isOwnedByTenant = (
	row: { $permissions?: string[] },
	tenantId: string,
) => {
	const perms = row.$permissions || [];
	return (
		perms.includes(Permission.update(Role.team(tenantId))) ||
		perms.includes(Permission.update(Role.user(tenantId)))
	);
};

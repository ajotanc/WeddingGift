import {
	Account,
	Client,
	Functions,
	Permission,
	Realtime,
	Role,
	Storage,
	TablesDB,
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

export { Permission, Role };
export default client;

export const PUBLIC_PERMISSIONS = [
	Permission.read(Role.any()),
	Permission.write(Role.users()),
	Permission.update(Role.users()),
	Permission.delete(Role.users()),
];

export const getTenantPermissions = (ownerId: string) => [
	Permission.read(Role.any()),
	Permission.write(Role.user(ownerId)),
	Permission.update(Role.user(ownerId)),
	Permission.delete(Role.user(ownerId)),
];

export const getProductPermissions = (ownerId: string) => [
	Permission.read(Role.any()),
	Permission.write(Role.user(ownerId)),
	Permission.update(Role.user(ownerId)),
	Permission.delete(Role.user(ownerId)),
];

export const getFaqSchedulePermissions = (ownerId: string) => [
	Permission.read(Role.any()),
	Permission.write(Role.user(ownerId)),
	Permission.update(Role.user(ownerId)),
	Permission.delete(Role.user(ownerId)),
];

export const getRsvpPermissions = () => [
	Permission.read(Role.any()),
	Permission.write(Role.users()),
	Permission.update(Role.users()),
	Permission.delete(Role.users()),
];

export const getMessagePermissions = () => [
	Permission.read(Role.any()),
	Permission.write(Role.users()),
	Permission.update(Role.users()),
	Permission.delete(Role.users()),
];

export const getGuestPermissions = () => [
	Permission.read(Role.any()),
	Permission.write(Role.users()),
	Permission.update(Role.users()),
	Permission.delete(Role.users()),
];

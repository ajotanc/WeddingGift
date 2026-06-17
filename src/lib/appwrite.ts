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

client
	.setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
	.setProject(PROJECT_ID);

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

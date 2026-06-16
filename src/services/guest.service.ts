import { DATABASE_ID, PUBLIC_PERMISSIONS, tables } from "@/lib/appwrite";
import { TABLE_GUESTS } from "@/lib/collections";
import { AppwriteException, ID, type Models } from "appwrite";

export interface IGuest extends Models.Row {
	name: string;
	email: string;
	phone?: string;
	photo_url?: string;
}

export const GuestService = {
	async get(id: string): Promise<IGuest> {
		try {
			const res = await tables.getRow<IGuest>({
				databaseId: DATABASE_ID,
				tableId: TABLE_GUESTS,
				rowId: id,
			});

			if (!res) return {} as IGuest;
			return res;
		} catch (error) {
			if (error instanceof AppwriteException && error.code === 404) return {} as IGuest;
			throw error;
		}
	},

	async create(
		data: Omit<IGuest, keyof Models.Row>,
		customId?: string,
	): Promise<IGuest> {
		return await tables.createRow<IGuest>({
			databaseId: DATABASE_ID,
			tableId: TABLE_GUESTS,
			rowId: customId || ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async update(
		id: string,
		data: Partial<Omit<IGuest, keyof Models.Row>>,
	): Promise<IGuest> {
		return await tables.updateRow<IGuest>({
			databaseId: DATABASE_ID,
			tableId: TABLE_GUESTS,
			rowId: id,
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async upsert(
		id: string,
		data: Partial<Omit<IGuest, keyof Models.Row>>,
	): Promise<IGuest> {
		return await tables.upsertRow<IGuest>({
			databaseId: DATABASE_ID,
			tableId: TABLE_GUESTS,
			rowId: id,
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_GUESTS,
			rowId: id,
		});
	},
};

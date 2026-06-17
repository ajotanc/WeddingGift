import { DATABASE_ID, PUBLIC_PERMISSIONS, tables } from "@/lib/appwrite";
import { TABLE_MESSAGES } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";
import type { IGuest } from "./guest.service";

export interface IMessage extends Models.Row {
	tenant: string;
	content: string;
	guest: IGuest;
}

export const MessageService = {
	async get(id: string): Promise<IMessage | null> {
		try {
			const res = await tables.getRow<IMessage>({
				databaseId: DATABASE_ID,
				tableId: TABLE_MESSAGES,
				rowId: id,
			});
			return res;
		} catch (error) {
			if (error instanceof AppwriteException && error.code === 404) return null;
			throw error;
		}
	},

	async list(tenantId: string): Promise<IMessage[]> {
		const res = await tables.listRows<IMessage>({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			queries: [Query.equal("tenant", tenantId), Query.orderDesc("$createdAt")],
		});
		return res.rows;
	},

	async create(
		data: Omit<IMessage, keyof Models.Row>,
		customId?: string,
	): Promise<IMessage> {
		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId: customId || ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async update(rowId: string, data: Partial<IMessage>): Promise<IMessage> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId,
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async upsert(rowId: string, data: Partial<IMessage>): Promise<IMessage> {
		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId: rowId || ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId: id,
		});
	},
};

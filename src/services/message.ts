import type { Models } from "appwrite";

export interface IMessage extends Models.Row {
	tenant: string;
	guest?: string;
	content: string;
}

export type IMessageDraft = Omit<IMessage, keyof Models.Row>;

import { APPWRITE_DATABASE_ID, tablesDB } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

const COLLECTION_ID = "messages";

export class MessageService {
	static async listByTenant(tenantId: string): Promise<IMessage[]> {
		const response = await tablesDB.listRows<IMessage>({
			databaseId: APPWRITE_DATABASE_ID,
			tableId: COLLECTION_ID,
			queries: [
				Query.equal("tenant", tenantId),
				Query.limit(100),
				Query.orderDesc("createdAt"),
			],
		});

		return response.rows;
	}

	static async create(payload: IMessageDraft): Promise<IMessage> {
		return await tablesDB.createRow<IMessage>({
			databaseId: APPWRITE_DATABASE_ID,
			tableId: COLLECTION_ID,
			rowId: ID.unique(),
			data: payload,
		});
	}

	static async delete(id: string): Promise<void> {
		await tablesDB.deleteRow({
			databaseId: APPWRITE_DATABASE_ID,
			tableId: COLLECTION_ID,
			rowId: id,
		});
	}
}

import { DATABASE_ID, getMessagePermissions, tables } from "@/lib/appwrite";
import { TABLE_MESSAGES } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";
import type { IGuest } from "./guest.service";
import { StorageService } from "./storage.service";

export interface IMessage extends Models.Row {
	tenant: string;
	content: string;
	guest: IGuest;
	audio_url?: string;
	likes?: string[];
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
		audioFile?: File | null,
	): Promise<IMessage> {
		const rowId = ID.unique();

		if (audioFile) {
			data.audio_url = await StorageService.uploadFile(
				rowId,
				audioFile,
				"audio",
			);
		}

		console.log(data.guest.$id);

		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId,
			data,
			permissions: getMessagePermissions(),
		});
	},

	async update(rowId: string, data: Partial<IMessage>): Promise<IMessage> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId,
			data,
			permissions: getMessagePermissions(),
		});
	},

	async upsert(rowId: string, data: Partial<IMessage>): Promise<IMessage> {
		const id = rowId || ID.unique();

		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId: id,
			data,
			permissions: getMessagePermissions(),
		});
	},

	async delete(id: string, hasAudio?: boolean): Promise<void> {
		hasAudio && (await StorageService.deleteFile(id, "audio"));

		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId: id,
		});
	},

	async likes(rowId: string, likes: string[]): Promise<IMessage> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId,
			data: { likes },
			permissions: getMessagePermissions(),
		});
	},
};

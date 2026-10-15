import {
	DATABASE_ID,
	getGuestContentPermissions,
	guestIdOf,
	tables,
} from "@/lib/appwrite";
import { TABLE_MESSAGES } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";
import { ActionsService } from "./actions.service";
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
		const permissions = getGuestContentPermissions(guestIdOf(data.guest));

		if (audioFile) {
			data.audio_url = await StorageService.uploadFile(
				rowId,
				audioFile,
				"audio",
				permissions,
			);
		}

		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId,
			data,
			permissions,
		});
	},

	async update(rowId: string, data: Partial<IMessage>): Promise<IMessage> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId,
			data,
		});
	},

	async upsert(rowId: string, data: Partial<IMessage>): Promise<IMessage> {
		const id = rowId || ID.unique();

		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId: id,
			data,
			permissions: getGuestContentPermissions(guestIdOf(data.guest)),
		});
	},

	/** Autor ou casal; o áudio é removido junto pela Function. */
	async delete(id: string): Promise<void> {
		await ActionsService.deleteContent("messages", id);
	},

	/** Alterna a curtida do usuário atual e devolve a lista atualizada. */
	async toggleLike(rowId: string): Promise<string[]> {
		const res = await ActionsService.toggleLike("messages", rowId);
		return res.likes;
	},
};

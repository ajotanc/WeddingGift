import { DATABASE_ID, getMessagePermissions, tables } from "@/lib/appwrite";
import { TABLE_MESSAGES } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";
import type { IGuest } from "./guest.service";

export interface IMessage extends Models.Row {
	tenant: string;
	content: string;
	guest: IGuest;
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
		customId?: string,
	): Promise<IMessage> {
		const ownerId = data.tenant;
		const guestId =
			data.guest?.$id || (typeof data.guest === "string" ? data.guest : null);

		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId: customId || ID.unique(),
			data,
			permissions: getMessagePermissions(ownerId, guestId),
		});
	},

	async update(rowId: string, data: Partial<IMessage>): Promise<IMessage> {
		const existing = await MessageService.get(rowId);
		const ownerId = existing?.tenant || data.tenant || "";
		const guestId =
			existing?.guest?.$id ||
			(typeof existing?.guest === "string" ? existing.guest : null) ||
			data.guest?.$id ||
			null;

		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId,
			data,
			permissions: getMessagePermissions(ownerId, guestId),
		});
	},

	async upsert(rowId: string, data: Partial<IMessage>): Promise<IMessage> {
		const id = rowId || ID.unique();
		let ownerId = data.tenant || "";
		let guestId =
			data.guest?.$id ||
			(typeof data.guest === "string" ? data.guest : null) ||
			null;

		if (rowId && (!ownerId || !guestId)) {
			const existing = await MessageService.get(rowId);
			if (!ownerId) ownerId = existing?.tenant || "";
			if (!guestId)
				guestId =
					existing?.guest?.$id ||
					(typeof existing?.guest === "string" ? existing.guest : null) ||
					null;
		}

		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId: id,
			data,
			permissions: getMessagePermissions(ownerId, guestId),
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId: id,
		});
	},

	async likes(rowId: string, likes: string[]): Promise<IMessage> {
		const existing = await MessageService.get(rowId);
		const ownerId = existing?.tenant || "";
		const guestId =
			existing?.guest?.$id ||
			(typeof existing?.guest === "string" ? existing.guest : null) ||
			null;

		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_MESSAGES,
			rowId,
			data: { likes },
			permissions: getMessagePermissions(ownerId, guestId),
		});
	},
};

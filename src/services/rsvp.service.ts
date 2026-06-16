import { DATABASE_ID, PUBLIC_PERMISSIONS, tables } from "@/lib/appwrite";
import { TABLE_RSVPS } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";

import type { IGuest } from "./guest.service";

export type StatusType = "confirmed" | "declined";

export interface IRsvp extends Models.Row {
	tenant: string;
	status: StatusType;
	total_adults: number;
	total_children: number;
	guest: IGuest;
	message?: string;
}

export const RsvpService = {
	async get(id: string): Promise<IRsvp | null> {
		try {
			const res = await tables.getRow<IRsvp>({
				databaseId: DATABASE_ID,
				tableId: TABLE_RSVPS,
				rowId: id,
			});
			return res;
		} catch (error) {
			if (error instanceof AppwriteException && error.code === 404) return null;
			throw error;
		}
	},

	async list(tenantId: string): Promise<IRsvp[]> {
		const res = await tables.listRows<IRsvp>({
			databaseId: DATABASE_ID,
			tableId: TABLE_RSVPS,
			queries: [Query.equal("tenant", tenantId)],
		});
		return res.rows;
	},

	async create(
		data: Omit<IRsvp, keyof Models.Row>,
		customId?: string,
	): Promise<IRsvp> {
		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_RSVPS,
			rowId: customId || ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async update(rowId: string, data: Partial<IRsvp>): Promise<IRsvp> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_RSVPS,
			rowId,
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async upsert(
		rowId: string | undefined,
		data: Partial<IRsvp>,
	): Promise<IRsvp> {
		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_RSVPS,
			rowId: rowId || ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_RSVPS,
			rowId: id,
		});
	},
};

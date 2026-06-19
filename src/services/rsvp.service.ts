import { DATABASE_ID, getRsvpPermissions, tables } from "@/lib/appwrite";
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
		const ownerId = data.tenant;
		const guestId =
			data.guest?.$id || (typeof data.guest === "string" ? data.guest : null);

		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_RSVPS,
			rowId: customId || ID.unique(),
			data,
			permissions: getRsvpPermissions(ownerId, guestId),
		});
	},

	async update(rowId: string, data: Partial<IRsvp>): Promise<IRsvp> {
		const existing = await RsvpService.get(rowId);
		const ownerId = existing?.tenant || data.tenant || "";
		const guestId =
			existing?.guest?.$id ||
			(typeof existing?.guest === "string" ? existing.guest : null) ||
			data.guest?.$id ||
			null;

		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_RSVPS,
			rowId,
			data,
			permissions: getRsvpPermissions(ownerId, guestId),
		});
	},

	async upsert(
		rowId: string | undefined,
		data: Partial<IRsvp>,
	): Promise<IRsvp> {
		const id = rowId || ID.unique();
		let ownerId = data.tenant || "";
		let guestId =
			data.guest?.$id ||
			(typeof data.guest === "string" ? data.guest : null) ||
			null;

		if (rowId && (!ownerId || !guestId)) {
			const existing = await RsvpService.get(rowId);
			if (!ownerId) ownerId = existing?.tenant || "";
			if (!guestId)
				guestId =
					existing?.guest?.$id ||
					(typeof existing?.guest === "string" ? existing.guest : null) ||
					null;
		}

		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_RSVPS,
			rowId: id,
			data,
			permissions: getRsvpPermissions(ownerId, guestId),
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

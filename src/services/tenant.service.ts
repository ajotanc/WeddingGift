import { DATABASE_ID, PUBLIC_PERMISSIONS, tables } from "@/lib/appwrite";
import { TABLE_TENANTS } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";
import type { IMessage } from "./message.service";
import type { IProduct } from "./product.service";
import type { IPurchase } from "./purchase.service";
import type { IRsvp } from "./rsvp.service";

export interface ITenant extends Models.Row {
	slug: string;
	couple_name: string;
	groom_name: string;
	bride_name: string;
	pix_key: string;
	event_date: string | null;
	event_time?: string | null;
	event_location: string | null;
	couple_history?: string;
	status: "active" | "pending";
	primary_color: string;
	background_color: string;
	background_image?: string | null;
	guest_limit?: number | null;
	show_countdown?: boolean;
	products?: IProduct[];
	messages?: IMessage[];
	rsvps?: IRsvp[];
	purchases: IPurchase[];
}

export const TenantService = {
	async getBySlug(slug: string): Promise<ITenant | null> {
		const res = await tables.listRows<ITenant>({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			queries: [
				Query.equal("slug", slug),
				Query.select([
					"*",
					"products.*",
					"products.links.*",
					"messages.*",
					"messages.guest.*",
					"rsvps.*",
					"rsvps.guest.*",
				]),
			],
		});
		
		if (res.rows.length === 0) return null;
		return res.rows[0];
	},

	async get(id: string): Promise<ITenant> {
		const res = await tables.getRow<ITenant>({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId: id,
		});

		if (!res) return {} as ITenant;
		return res;
	},

	async create(
		data: Omit<ITenant, keyof Models.Row>,
		customId?: string,
	): Promise<ITenant> {
		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId: customId || ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async update(rowId: string, data: Partial<ITenant>): Promise<ITenant> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId,
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async upsert(
		rowId: string | undefined,
		data: Partial<ITenant>,
	): Promise<ITenant> {
		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId: rowId || ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId: id,
		});
	},
};

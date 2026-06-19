import { DATABASE_ID, getTenantPermissions, tables } from "@/lib/appwrite";
import { TABLE_TENANTS } from "@/lib/collections";
import { ID, type Models, Query } from "appwrite";
import type { IFaq } from "./faq.service";
import type { IGalleryImage } from "./gallery.service";
import type { IMessage } from "./message.service";
import type { IProduct } from "./product.service";
import type { IPurchase } from "./purchase.service";
import type { IRsvp } from "./rsvp.service";
import type { IScheduleItem } from "./schedule.service";

export interface ITenant extends Models.Row {
	slug: string;
	couple_name: string;
	groom_name: string;
	bride_name: string;
	pix_key: string;
	event_date: string | null;
	event_time?: string | null;
	event_location: string | null;
	event_latitude?: number | null;
	event_longitude?: number | null;
	couple_history?: string;
	quote?: string;
	plan?: "free" | "premium" | null;
	premium_until?: string | null;
	primary_color: string;
	background_color: string;
	text_color?: string | null;
	background_image?: string | null;
	logo_url?: string | null;
	title_font?: string | null;
	body_font?: string | null;
	show_countdown?: boolean;
	show_gallery?: boolean;
	show_faq?: boolean;
	show_schedule?: boolean;
	music_url?: string | null;
	ambient_effect?: "none" | "rose-petals" | "sparkles" | null;
	products?: IProduct[];
	messages?: IMessage[];
	rsvps?: IRsvp[];
	purchases: IPurchase[];
	gallery: IGalleryImage[];
	faqs: IFaq[];
	schedules?: IScheduleItem[];
	mp_user_id: string | null;
	mp_access_token: string | null;
	mp_refresh_token: string | null;
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
					"gallery.*",
					"gallery.guest.*",
					"faqs.*",
					"schedules.*",
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
		const ownerId = customId || ID.unique();
		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId: ownerId,
			data,
			permissions: getTenantPermissions(ownerId),
		});
	},

	async update(rowId: string, data: Partial<ITenant>): Promise<ITenant> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId,
			data,
			permissions: getTenantPermissions(rowId),
		});
	},

	async upsert(
		rowId: string | undefined,
		data: Partial<ITenant>,
	): Promise<ITenant> {
		const id = rowId || ID.unique();
		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId: id,
			data,
			permissions: getTenantPermissions(id),
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

import {
	DATABASE_ID,
	getOwnerBootstrapPermissions,
	getTenantPermissions,
	isOwnedByTenant,
	tables,
	teams,
} from "@/lib/appwrite";
import { TABLE_SUBSCRIPTIONS, TABLE_TENANTS } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";
import type { IFaq } from "./faq.service";
import type { IGalleryImage } from "./gallery.service";
import type { IMessage } from "./message.service";
import type { IProduct } from "./product.service";
import type { IPurchase } from "./purchase.service";
import type { IQuizQuestion } from "./quiz.service";
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
	shipping_address?: string | null;
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
	show_dress_code?: boolean;
	show_quiz?: boolean;
	dress_code_text?: string | null;
	music_url?: string | null;
	ambient_effect?:
		| "none"
		| "rose-petals"
		| "sparkles"
		| "snow"
		| "hearts"
		| "butterflies"
		| "gold-dust"
		| "confetti"
		| "shooting-stars"
		| "fireflies"
		| "balloons"
		| null;
	products?: IProduct[];
	messages?: IMessage[];
	rsvps?: IRsvp[];
	purchases: IPurchase[];
	gallery: IGalleryImage[];
	faqs: IFaq[];
	schedules?: IScheduleItem[];
	quizzes?: IQuizQuestion[];
	mp_user_id: string | null;
	mp_access_token: string | null;
	mp_refresh_token: string | null;
	co_owner_email?: string | null;
	is_premium: boolean;
}

interface ISubscription extends Models.Row {
	plan: string | null;
	premium_until: string | null;
}

/**
 * O plano vem da tabela `subscriptions`, que só o webhook de pagamento escreve.
 * Os campos `plan`/`premium_until` do tenant podem ser editados pelo próprio casal,
 * então não valem como prova de pagamento.
 */
async function withSubscription<T extends ITenant | null>(
	tenant: T,
): Promise<T> {
	if (!tenant) return tenant;
	let sub: ISubscription | null = null;
	try {
		sub = await tables.getRow<ISubscription>({
			databaseId: DATABASE_ID,
			tableId: TABLE_SUBSCRIPTIONS,
			rowId: tenant.$id,
		});
	} catch (error) {
		if (!(error instanceof AppwriteException && error.code === 404)) {
			console.error("Falha ao carregar assinatura:", error);
		}
	}
	return {
		...tenant,
		plan: sub?.plan === "premium" ? "premium" : "free",
		premium_until: sub?.premium_until ?? null,
	};
}

/** Remove itens que não foram criados pelo casal (ex.: produto injetado por terceiro). */
function onlyTenantOwned<T extends { $permissions?: string[] }>(
	rows: T[] | undefined,
	tenantId: string,
): T[] | undefined {
	return rows?.filter((row) => isOwnedByTenant(row, tenantId));
}

export const TenantService = {
	/** Se o usuário atual já pertence ao time do casal (time tem o id do tenant). */
	async isTeamMember(tenantId: string): Promise<boolean> {
		try {
			const res = await teams.list({ queries: [Query.equal("$id", tenantId)] });
			return res.teams.some((t) => t.$id === tenantId);
		} catch {
			return false;
		}
	},

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
					"quizzes.*",
				]),
			],
		});

		if (res.rows.length === 0) return null;
		const tenant = res.rows[0];
		return await withSubscription({
			...tenant,
			products: onlyTenantOwned(tenant.products, tenant.$id),
			faqs: onlyTenantOwned(tenant.faqs, tenant.$id) ?? [],
			schedules: onlyTenantOwned(tenant.schedules, tenant.$id),
			quizzes: onlyTenantOwned(tenant.quizzes, tenant.$id),
		});
	},

	async getByCoOwner(email: string): Promise<ITenant | null> {
		if (!email) return null;
		const res = await tables.listRows<ITenant>({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			queries: [Query.equal("co_owner_email", email.toLowerCase().trim())],
		});

		if (res.rows.length === 0) return null;
		return await withSubscription(res.rows[0]);
	},

	async get(id: string): Promise<ITenant | null> {
		const res = await tables.getRow<ITenant>({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId: id,
		});

		if (!res) return null;
		return await withSubscription(res);
	},

	async create(
		data: Omit<ITenant, keyof Models.Row>,
		customId?: string,
	): Promise<ITenant> {
		const ownerId = customId || ID.unique();
		// O time do casal é criado pelo servidor (sync_access), que depois troca
		// estas permissões iniciais pelas do time.
		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId: ownerId,
			data,
			permissions: getOwnerBootstrapPermissions(ownerId),
		});
	},

	async update(rowId: string, data: Partial<ITenant>): Promise<ITenant> {
		const updated = await tables.updateRow<ITenant>({
			databaseId: DATABASE_ID,
			tableId: TABLE_TENANTS,
			rowId,
			data,
			permissions: getTenantPermissions(rowId),
		});
		return await withSubscription(updated);
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

import { DATABASE_ID, getFaqSchedulePermissions, tables } from "@/lib/appwrite";
import { TABLE_FAQS } from "@/lib/collections";
import { ID, type Models, Query } from "appwrite";

export interface IFaq extends Models.Row {
	tenant: string;
	question: string;
	answer: string;
	order?: number;
}

export const FaqService = {
	async list(tenantId: string): Promise<IFaq[]> {
		const res = await tables.listRows<IFaq>({
			databaseId: DATABASE_ID,
			tableId: TABLE_FAQS,
			queries: [
				Query.equal("tenant", tenantId),
				Query.orderAsc("order"),
				Query.orderDesc("$createdAt"),
				Query.limit(100),
			],
		});
		return res.rows;
	},

	async create(data: Omit<IFaq, keyof Models.Row>): Promise<IFaq> {
		const ownerId = data.tenant;
		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_FAQS,
			rowId: ID.unique(),
			data,
			permissions: getFaqSchedulePermissions(ownerId),
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_FAQS,
			rowId: id,
		});
	},

	async update(id: string, data: Partial<IFaq>): Promise<IFaq> {
		const existing = await tables.getRow<IFaq>({
			databaseId: DATABASE_ID,
			tableId: TABLE_FAQS,
			rowId: id,
		});
		const ownerId = existing?.tenant || data.tenant || "";

		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_FAQS,
			rowId: id,
			data,
			permissions: getFaqSchedulePermissions(ownerId),
		});
	},
};

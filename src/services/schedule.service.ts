import { DATABASE_ID, PUBLIC_PERMISSIONS, tables } from "@/lib/appwrite";
import { TABLE_SCHEDULE } from "@/lib/collections";
import { ID, type Models, Query } from "appwrite";

export interface IScheduleItem extends Models.Row {
	tenant: string;
	title: string;
	description: string;
	hour: string;
	icon: string;
}

export const ScheduleService = {
	async list(tenantId: string): Promise<IScheduleItem[]> {
		const res = await tables.listRows<IScheduleItem>({
			databaseId: DATABASE_ID,
			tableId: TABLE_SCHEDULE,
			queries: [
				Query.equal("tenant", tenantId),
				Query.orderAsc("hour"),
				Query.limit(100),
			],
		});
		return res.rows;
	},

	async create(
		data: Omit<IScheduleItem, keyof Models.Row>,
	): Promise<IScheduleItem> {
		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_SCHEDULE,
			rowId: ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_SCHEDULE,
			rowId: id,
		});
	},

	async update(
		id: string,
		data: Partial<IScheduleItem>,
	): Promise<IScheduleItem> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_SCHEDULE,
			rowId: id,
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},
};

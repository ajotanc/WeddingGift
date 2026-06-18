import { DATABASE_ID, PUBLIC_PERMISSIONS, tables } from "@/lib/appwrite";
import { TABLE_PURCHASES } from "@/lib/collections";
import {
	AppwriteException,
	ID,
	type Models,
	Permission,
	Query,
	Role,
} from "appwrite";
import type { IGuest } from "./guest.service";
import type { IProduct } from "./product.service";

export type MethodType = "pix" | "link";

export interface IPurchase extends Models.Row {
	tenant: string;
	guest: IGuest;
	product: IProduct;
	quantity: number;
	price_paid: string;
	method: MethodType;
}

export const PurchaseService = {
	async get(id: string): Promise<IPurchase | null> {
		try {
			const res = await tables.getRow<IPurchase>({
				databaseId: DATABASE_ID,
				tableId: TABLE_PURCHASES,
				rowId: id,
			});
			return res;
		} catch (error) {
			if (error instanceof AppwriteException && error.code === 404) return null;
			throw error;
		}
	},

	async create(
		data: Omit<IPurchase, keyof Models.Row>,
		customId?: string,
	): Promise<IPurchase> {
		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PURCHASES,
			rowId: customId || ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async update(rowId: string, data: Partial<IPurchase>): Promise<IPurchase> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PURCHASES,
			rowId,
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async upsert(
		rowId: string | undefined,
		data: Partial<IPurchase>,
	): Promise<IPurchase> {
		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PURCHASES,
			rowId: rowId || ID.unique(),
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PURCHASES,
			rowId: id,
		});
	},

	async listByTenant(tenantId: string): Promise<IPurchase[]> {
		const res = await tables.listRows<IPurchase>({
			databaseId: DATABASE_ID,
			tableId: TABLE_PURCHASES,
			queries: [
				Query.equal("tenant", tenantId),
				Query.orderDesc("$createdAt"),
				Query.limit(100),
				Query.select(["*", "guest.*", "product.*"]),
			],
		});

		return res.rows;
	},

	async listByProduct(productId: string): Promise<IPurchase[]> {
		const res = await tables.listRows<IPurchase>({
			databaseId: DATABASE_ID,
			tableId: TABLE_PURCHASES,
			queries: [
				Query.equal("product", productId),
				Query.orderDesc("$createdAt"),
			],
		});

		return res.rows;
	},

	async listByGuest(guestId: string): Promise<IPurchase[]> {
		const res = await tables.listRows<IPurchase>({
			databaseId: DATABASE_ID,
			tableId: TABLE_PURCHASES,
			queries: [
				Query.equal("guest", guestId),
				Query.orderDesc("$createdAt"),
				Query.select(["*", "product.*"]),
			],
		});

		return res.rows;
	},
};

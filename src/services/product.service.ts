import {
	DATABASE_ID,
	functions,
	getProductPermissions,
	tables,
} from "@/lib/appwrite";
import { TABLE_PRODUCTS } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";
import { StorageService } from "./storage.service";

export type ProductType = "physical" | "quota";

export interface IProductLink extends Models.Row {
	title: string;
	store: string;
	price: string | null;
	url: string;
	thumbnail: string;
}

export interface IProduct extends Models.Row {
	tenant: string;
	type: ProductType;
	name: string;
	price: string;
	desired_quantity: number;
	claimed_quantity: number;
	image_url?: string;
	category?: string;
	target_amount?: number;
	collected_amount?: number;
	is_goal?: boolean;
	is_custom_amount?: boolean;
	links?: IProductLink[];
}

export const ProductService = {
	async get(id: string): Promise<IProduct | null> {
		try {
			const res = await tables.getRow<IProduct>({
				databaseId: DATABASE_ID,
				tableId: TABLE_PRODUCTS,
				rowId: id,
			});
			return res;
		} catch (error) {
			if (error instanceof AppwriteException && error.code === 404) return null;
			throw error;
		}
	},

	async list(tenantId: string): Promise<IProduct[]> {
		const res = await tables.listRows<IProduct>({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			queries: [
				Query.equal("tenant", tenantId),
				Query.select(["*", "links.*"]),
			],
		});

		return res.rows;
	},

	async create(
		data: Omit<IProduct, keyof Models.Row>,
		file?: File | null,
	): Promise<IProduct> {
		const rowId = ID.unique();

		if (file instanceof File) {
			data.image_url = await StorageService.uploadFile(rowId, file, "product");
		}

		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			rowId,
			data,
			permissions: getProductPermissions(data.tenant),
		});
	},

	async update(
		rowId: string,
		data: Partial<Omit<IProduct, keyof Models.Row>>,
		file?: File | null,
	): Promise<IProduct> {
		if (file instanceof File) {
			await StorageService.deleteFile(rowId, "product");
			data.image_url = await StorageService.uploadFile(rowId, file, "product");
		}

		let ownerId = data.tenant || "";
		if (!ownerId) {
			const existing = await ProductService.get(rowId);
			ownerId = existing?.tenant || "";
		}

		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			rowId,
			data,
			permissions: getProductPermissions(ownerId),
		});
	},

	async upsert(
		rowId: string | null | undefined,
		data:
			| Omit<IProduct, keyof Models.Row>
			| (Partial<Omit<IProduct, keyof Models.Row>> & { tenant?: string }),
		file?: File | null,
	): Promise<IProduct> {
		if (rowId) {
			return await ProductService.update(rowId, data, file);
		}

		return await ProductService.create(
			data as Omit<IProduct, keyof Models.Row>,
			file,
		);
	},

	async delete(id: string, hasFile: boolean): Promise<void> {
		if (hasFile) {
			await StorageService.deleteFile(id, "product");
		}

		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			rowId: id,
		});
	},

	async updatePublic(
		rowId: string,
		data: Partial<IProduct>,
	): Promise<IProduct> {
		const res = await functions.createExecution({
			functionId: "ai-helper",
			body: JSON.stringify({
				action: "claim-product",
				payload: {
					productId: rowId,
					claimed_quantity: data.claimed_quantity,
				},
			}),
		});

		if (res.status === "failed") {
			throw new Error("Erro ao atualizar o presente no servidor.");
		}

		const parsed = JSON.parse(res.responseBody || "{}");
		if (parsed.error) {
			throw new Error(parsed.error);
		}

		return parsed.product as IProduct;
	},
	async updateQuantity(
		rowId: string,
		data: Partial<IProduct>,
	): Promise<IProduct> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			rowId,
			data,
		});
	},
};

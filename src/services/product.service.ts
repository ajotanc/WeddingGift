import { DATABASE_ID, PUBLIC_PERMISSIONS, tables } from "@/lib/appwrite";
import { TABLE_PRODUCTS, TABLE_PRODUCT_LINKS } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";
import { StorageService } from "./storage.service";

export type ProductType = "physical" | "quota";

export interface IProductLink extends Models.Row {
	product: string;
	store: string;
	url: string;
}

export interface IProduct extends Models.Row {
	tenant: string;
	type: ProductType;
	name: string;
	base_price?: string;
	desired_quantity: number;
	claimed_quantity: number;
	pix_payment?: number;
	image_url?: string;
	category?: string;
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
		data: Omit<IProduct, keyof Models.Row | "links"> & {
			links?: IProductLink[];
		},
		customId?: string,
		file?: File | null,
	): Promise<IProduct> {
		let image_url = data.image_url;
		const rowId = customId || ID.unique();

		if (file) {
			image_url = await StorageService.uploadFile(rowId, file, "product");
		}

		const payload: Partial<Omit<IProduct, keyof Models.Row>> = {
			...data,
			image_url,
			claimed_quantity: data.claimed_quantity || 0,
		};

		const links = payload.links || [];
		delete payload.links;

		const row = await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			rowId,
			data: payload as Omit<IProduct, keyof Models.Row>,
			permissions: PUBLIC_PERMISSIONS,
		});

		if (links.length > 0) {
			for (const link of links) {
				await tables.createRow({
					databaseId: DATABASE_ID,
					tableId: TABLE_PRODUCT_LINKS,
					rowId: ID.unique(),
					data: {
						store: link.store,
						url: link.url,
						product: row.$id,
					},
					permissions: PUBLIC_PERMISSIONS,
				});
			}
		}

		return row;
	},

	async update(
		id: string,
		data: Partial<Omit<IProduct, "links"> & { links?: IProductLink[] }>,
		file?: File | null,
	): Promise<IProduct> {
		let imageUrl = data.image_url;
		if (file) {
			imageUrl = await StorageService.uploadFile(id, file, `product`);
		}

		const payload: Partial<Omit<IProduct, keyof Models.Row>> = {
			...data,
		};
		if (imageUrl) payload.image_url = imageUrl;

		const links = payload.links;
		delete payload.links;

		const row = await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			rowId: id,
			data: payload as Partial<Omit<IProduct, keyof Models.Row>>,
			permissions: PUBLIC_PERMISSIONS,
		});

		if (links) {
			const existingLinks = await tables.listRows<IProductLink>({
				databaseId: DATABASE_ID,
				tableId: TABLE_PRODUCT_LINKS,
				queries: [Query.equal("product", id)],
			});

			for (const el of existingLinks.rows) {
				await tables.deleteRow({
					databaseId: DATABASE_ID,
					tableId: TABLE_PRODUCT_LINKS,
					rowId: el.$id,
				});
			}

			if (links.length > 0) {
				for (const link of links) {
					await tables.createRow({
						databaseId: DATABASE_ID,
						tableId: TABLE_PRODUCT_LINKS,
						rowId: ID.unique(),
						data: {
							store: link.store,
							url: link.url,
							product: row.$id,
						},
						permissions: PUBLIC_PERMISSIONS,
					});
				}
			}
		}

		return row;
	},

	async upsert(
		rowId: string | null,
		data: Partial<Omit<IProduct, "links"> & { links?: IProductLink[] }>,
		file?: File | null,
	): Promise<IProduct> {
		const isUpdate = !!rowId;
		const id = rowId || ID.unique();

		if (file instanceof File) {
			if (isUpdate && data.image_url) {
				await StorageService.deleteFile(id, "product");
			}

			data.image_url = await StorageService.uploadFile(id, file, "product");
		}

		return await tables.upsertRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			rowId: id,
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async delete(id: string): Promise<void> {
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			rowId: id,
		});
	},

	async updatePublic(rowId: string, data: Partial<IProduct>): Promise<void> {
		await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_PRODUCTS,
			rowId,
			data,
			permissions: PUBLIC_PERMISSIONS,
		});
	},
};

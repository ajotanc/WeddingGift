import { DATABASE_ID, PUBLIC_PERMISSIONS, tables } from "@/lib/appwrite";
import { TABLE_GALLERY } from "@/lib/collections";
import { AppwriteException, ID, type Models, Query } from "appwrite";
import type { IGuest } from "./guest.service";
import { StorageService } from "./storage.service";

export interface IGalleryImage extends Models.Row {
	tenant: string;
	image_url: string;
	likes?: string[]; // Array of guest IDs who liked the image
	is_public: boolean;
	guest?: IGuest | null;
	caption?: string;
}

export const GalleryService = {
	async list(tenantId: string): Promise<IGalleryImage[]> {
		const res = await tables.listRows<IGalleryImage>({
			databaseId: DATABASE_ID,
			tableId: TABLE_GALLERY,
			queries: [
				Query.equal("tenant", tenantId),
				Query.orderDesc("$createdAt"),
				Query.limit(20),
			],
		});

		return res.rows;
	},

	async create(
		data: Omit<IGalleryImage, keyof Models.Row>,
		file?: File | null,
	): Promise<IGalleryImage> {
		const id = ID.unique();

		if (file instanceof File) {
			data.image_url = await StorageService.uploadFile(id, file, "photo");
		}

		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_GALLERY,
			rowId: id,
			data: {
				...data,
				is_public: data.is_public ?? false,
			},
			permissions: PUBLIC_PERMISSIONS,
		});
	},

	async delete(id: string): Promise<void> {
		await StorageService.deleteFile(id, "photo");
		await tables.deleteRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_GALLERY,
			rowId: id,
		});
	},

	async updateLikes(rowId: string, likes: string[]): Promise<IGalleryImage> {
		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_GALLERY,
			rowId,
			data: { likes },
			permissions: PUBLIC_PERMISSIONS,
		});
	},
};

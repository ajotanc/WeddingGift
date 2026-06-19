import { DATABASE_ID, getMessagePermissions, tables } from "@/lib/appwrite";
import { TABLE_GALLERY } from "@/lib/collections";
import { ID, type Models, Query } from "appwrite";
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

		const ownerId = data.tenant;
		const guestId =
			data.guest?.$id || (typeof data.guest === "string" ? data.guest : null);

		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_GALLERY,
			rowId: id,
			data: {
				...data,
				is_public: data.is_public ?? false,
			},
			permissions: getMessagePermissions(ownerId, guestId),
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
		const existing = await tables.getRow<IGalleryImage>({
			databaseId: DATABASE_ID,
			tableId: TABLE_GALLERY,
			rowId,
		});
		const ownerId = existing?.tenant || "";
		const guestId =
			existing?.guest?.$id ||
			(typeof existing?.guest === "string" ? existing.guest : null) ||
			null;

		return await tables.updateRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_GALLERY,
			rowId,
			data: { likes },
			permissions: getMessagePermissions(ownerId, guestId),
		});
	},
};

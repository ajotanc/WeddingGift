import {
	DATABASE_ID,
	getGuestContentPermissions,
	getTenantPermissions,
	guestIdOf,
	tables,
} from "@/lib/appwrite";
import { TABLE_GALLERY } from "@/lib/collections";
import { ID, type Models, Query } from "appwrite";
import { ActionsService } from "./actions.service";
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
		// Foto enviada por convidado é dele; sem convidado, é foto do casal.
		const guestId = guestIdOf(data.guest);
		const permissions = guestId
			? getGuestContentPermissions(guestId)
			: getTenantPermissions(data.tenant);

		if (file instanceof File) {
			data.image_url = await StorageService.uploadFile(
				id,
				file,
				"photo",
				permissions,
			);
		}

		return await tables.createRow({
			databaseId: DATABASE_ID,
			tableId: TABLE_GALLERY,
			rowId: id,
			data: {
				...data,
				is_public: data.is_public ?? false,
			},
			permissions,
		});
	},

	/** Autor ou casal; o arquivo é removido junto pela Function. */
	async delete(id: string): Promise<void> {
		await ActionsService.deleteContent("gallery", id);
	},

	/** Alterna a curtida do usuário atual e devolve a lista atualizada. */
	async toggleLike(rowId: string): Promise<string[]> {
		const res = await ActionsService.toggleLike("gallery", rowId);
		return res.likes;
	},
};

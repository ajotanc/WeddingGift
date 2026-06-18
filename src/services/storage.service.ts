import { BUCKET_ID, storage } from "@/lib/appwrite";
import imageCompression from "browser-image-compression";

export const StorageService = {
	async processImage(file: File): Promise<File> {
		const options = {
			maxSizeMB: 0.2,
			maxWidthOrHeight: 1200,
			useWebWorker: true,
			fileType: "image/webp",
			initialQuality: 0.8,
		};

		try {
			const compressedBlob = await imageCompression(file, options);

			const fileName = `${file.name.replace(/\.[^/.]+$/, "")}.webp`;
			const finalFile = new File([compressedBlob], fileName, {
				type: "image/webp",
				lastModified: Date.now(),
			});

			console.log(`Original: ${(file.size / 1024).toFixed(2)} KB`);
			console.log(`WebP Otimizado: ${(finalFile.size / 1024).toFixed(2)} KB`);

			return finalFile;
		} catch (error) {
			console.error("Erro na conversão para WebP:", error);
			return file;
		}
	},

	async uploadFile(
		rowId: string,
		file: File,
		filename?: string,
	): Promise<string> {
		const fileId = `${filename || "file"}-${rowId}`;

		const fileToUpload = await (async () => {
			if (file.type.includes("image/")) {
				return await this.processImage(file);
			}
			return file;
		})();

		try {
			await storage.createFile({
				bucketId: BUCKET_ID,
				fileId,
				file: fileToUpload,
			});

			return storage.getFileView({ bucketId: BUCKET_ID, fileId });
		} catch (error) {
			console.error("Erro no upload do arquivo:", error);
			throw new Error("Falha ao processar o arquivo para o servidor.");
		}
	},

	async deleteFile(rowId: string, filename?: string): Promise<void> {
		const fileId = `${filename || "file"}-${rowId}`;

		try {
			await storage.deleteFile({ bucketId: BUCKET_ID, fileId });
		} catch (error) {
			console.error("Erro no delete do arquivo:", error);
		}
	},

	async autoUpload(
		rowId: string,
		file: File,
		filename?: string,
	): Promise<string> {
		// Deleta o arquivo anterior para evitar conflito de ID no Appwrite
		await this.deleteFile(rowId, filename);

		// Faz o upload do novo arquivo
		return await this.uploadFile(rowId, file, filename);
	},
};

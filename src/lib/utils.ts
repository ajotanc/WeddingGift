import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export { parseCurrency } from '@brazilian-utils/brazilian-utils'
import { QrCodePix } from 'qrcode-pix'

export function generatePixPayload(key: string, name: string, value: number, city: string = 'SAO PAULO', transactionId: string = '***'): string {
  if (!key || !name) return ''

  const qrCodePix = QrCodePix({
    version: '01',
    key,
    name: name.substring(0, 25),
    city,
    transactionId,
    value: parseCurrency(value.toString()),
  })

  return qrCodePix.payload()
}

import imageCompression from 'browser-image-compression'
import { storage, BUCKET_ID } from '@/lib/appwrite'
import { parseCurrency } from '@brazilian-utils/brazilian-utils'

export const processImage = async (file: File) => {
  const options = {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8
  }

  try {
    const compressedBlob = await imageCompression(file, options)

    const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"
    const finalFile = new File([compressedBlob], fileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    })

    console.log(`Original: ${(file.size / 1024).toFixed(2)} KB`)
    console.log(`WebP Otimizado: ${(finalFile.size / 1024).toFixed(2)} KB`)

    return finalFile
  } catch (error) {
    console.error("Erro na conversão para WebP:", error)
    return file
  }
}

export const uploadFile = async (rowId: string, file: File, filename?: string): Promise<string> => {
  const fileId = `${filename || 'file'}-${rowId}`

  const fileToUpload = await (async () => {
    if (file.type.includes('image/')) {
      return await processImage(file)
    }
    return file
  })()

  try {
    try {
      await storage.deleteFile(BUCKET_ID, fileId)
    } catch (e) {
      // file might not exist yet
    }

    await storage.createFile({
      bucketId: BUCKET_ID,
      fileId,
      file: fileToUpload
    })

    return storage.getFileView({ bucketId: BUCKET_ID, fileId })
  } catch (error) {
    console.error("Erro no upload do arquivo:", error)
    throw new Error("Falha ao processar o arquivo para o servidor.")
  }
}

import { tables, storage, DATABASE_ID, BUCKET_ID, Permission, Role } from '@/lib/appwrite'
import { Query, ID, type Models } from 'appwrite'
import { TABLE_PRODUCTS, TABLE_PRODUCT_LINKS } from '@/lib/collections'
import { uploadFile } from '@/lib/utils'

export interface IProductLink extends Models.Row {
  product: string
  store: string
  url: string
}

export interface IProductHydrated extends Models.Row {
  tenant: string
  type: 'physical' | 'quota'
  name: string
  base_price?: string
  fixed_quota_value?: string
  total_value?: string
  desired_quantity: number
  claimed_quantity: number
  image_url?: string
  category?: string
  links?: IProductLink[]
}

export const listProducts = async (tenantId: string): Promise<IProductHydrated[]> => {
  const res = await tables.listRows<IProductHydrated>({
    databaseId: DATABASE_ID,
    tableId: TABLE_PRODUCTS,
    queries: [
      Query.equal('tenant', tenantId),
      Query.select(['*', 'links.*'])
    ]
  })

  return res.rows
}

export const createProduct = async (userId: string, tenantId: string, data: Partial<IProductHydrated>, file?: File | null): Promise<IProductHydrated> => {
  let image_url = data.image_url

  if (file) {
    image_url = await uploadFile(ID.unique(), file, 'product')
  }

  const payload: Omit<Partial<IProductHydrated>, keyof Models.Row> = {
    ...data,
    tenant: tenantId,
    image_url,
    claimed_quantity: 0
  }

  const links = payload.links || []
  delete payload.links

  const row = await tables.upsertRow<IProductHydrated>({
    databaseId: DATABASE_ID,
    tableId: TABLE_PRODUCTS,
    rowId: ID.unique(),
    data: payload,
    permissions: [
      Permission.read(Role.any()),
      Permission.write(Role.user(userId))
    ]
  })

  if (links.length > 0) {
    for (const link of links) {
      await tables.upsertRow<IProductLink>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PRODUCT_LINKS,
        rowId: ID.unique(),
        data: {
          store: link.store,
          url: link.url,
          product: row.$id
        },
        permissions: [
          Permission.read(Role.any()),
          Permission.write(Role.user(userId))
        ]
      })
    }
  }

  return row
}

export const updateProduct = async (userId: string, productId: string, data: Partial<IProductHydrated>, file?: File | null): Promise<IProductHydrated> => {
  let imageUrl = data.image_url
  if (file) {
    imageUrl = await uploadFile(productId, file, `product`)
  }

  const payload: Omit<Partial<IProductHydrated>, keyof Models.Row> = {
    ...data,
    image_url: imageUrl
  }

  const links = payload.links || []
  delete payload.links

  const row = await tables.upsertRow<IProductHydrated>({
    databaseId: DATABASE_ID,
    tableId: TABLE_PRODUCTS,
    rowId: productId,
    data: payload
  })

  // Update links: delete existing and insert new ones
  const existingLinks = await tables.listRows<IProductLink>({
    databaseId: DATABASE_ID,
    tableId: TABLE_PRODUCT_LINKS,
    queries: [Query.equal('product', productId)]
  })

  for (const el of existingLinks.rows) {
    await tables.deleteRow({
      databaseId: DATABASE_ID,
      tableId: TABLE_PRODUCT_LINKS,
      rowId: el.$id
    })
  }

  if (links.length > 0) {
    for (const link of links) {
      await tables.upsertRow<IProductLink>({
        databaseId: DATABASE_ID,
        tableId: TABLE_PRODUCT_LINKS,
        rowId: ID.unique(),
        data: {
          store: link.store,
          url: link.url,
          product: row.$id
        },
        permissions: [
          Permission.read(Role.any()),
          Permission.write(Role.user(userId))
        ]
      })
    }
  }

  return row
}

export const deleteProduct = async (id: string): Promise<void> => {
  await tables.deleteRow({
    databaseId: DATABASE_ID,
    tableId: TABLE_PRODUCTS,
    rowId: id
  })
}

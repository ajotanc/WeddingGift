import { tables, DATABASE_ID, Permission, Role } from '@/lib/appwrite'
import { Query, type Models } from 'appwrite'
import { TABLE_TENANTS } from '@/lib/collections'

export interface ITenant extends Models.Row {
  slug: string
  couple_name: string
  groom_name: string
  bride_name: string
  pix_key: string
  event_date: string
  event_time?: string
  event_location: string
  couple_history?: string
  status: 'active' | 'pending'
  primary_color: string
  background_color: string
  background_image?: string | null
  guest_limit?: number | null
  show_countdown?: boolean
}

export const getTenantBySlug = async (slug: string): Promise<ITenant | null> => {
  const res = await tables.listRows<ITenant>({
    databaseId: DATABASE_ID,
    tableId: TABLE_TENANTS,
    queries: [Query.equal('slug', slug)]
  })
  if (res.rows.length === 0) return null
  return res.rows[0]
}

export const getTenantById = async (id: string): Promise<ITenant | null> => {
  const res = await tables.listRows<ITenant>({
    databaseId: DATABASE_ID,
    tableId: TABLE_TENANTS,
    queries: [Query.equal('$id', id)]
  })
  if (res.rows.length === 0) return null
  return res.rows[0]
}

export const createTenant = async (userId: string, data: ITenant): Promise<ITenant> => {
  return await tables.upsertRow<ITenant>({
    databaseId: DATABASE_ID,
    tableId: TABLE_TENANTS,
    rowId: userId,
    data,
    permissions: [
      Permission.read(Role.any()),
      Permission.write(Role.user(userId))
    ]
  })
}

export const updateTenant = async (userId: string, data: Partial<ITenant>): Promise<ITenant> => {
  return await tables.upsertRow<ITenant>({
    databaseId: DATABASE_ID,
    tableId: TABLE_TENANTS,
    rowId: userId,
    data
  })
}

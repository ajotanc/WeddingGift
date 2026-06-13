import { tables, DATABASE_ID, Permission, Role } from '@/lib/appwrite'
import { Query, ID, type Models } from 'appwrite'
import { TABLE_RSVPS } from '@/lib/collections'

export interface IRsvp extends Models.Row {
  tenant: string
  guest_name: string
  email: string
  phone: string
  status: 'confirmed' | 'declined'
  total_adults: number
  total_children: number
}

export const listRsvps = async (tenantId: string): Promise<IRsvp[]> => {
  const res = await tables.listRows<IRsvp>({
    databaseId: DATABASE_ID,
    tableId: TABLE_RSVPS,
    queries: [Query.equal('tenant', tenantId)]
  })
  return res.rows
}

export const createRsvp = async (tenantId: string, data: Partial<IRsvp>): Promise<IRsvp> => {
  return await tables.upsertRow<IRsvp>({
    databaseId: DATABASE_ID,
    tableId: TABLE_RSVPS,
    rowId: ID.unique(),
    data: {
      ...data,
      tenant: tenantId
    } as any,
    permissions: [
      Permission.read(Role.any()),
      Permission.write(Role.any())
    ]
  })
}

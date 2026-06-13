import { tables, DATABASE_ID, Permission, Role } from '@/lib/appwrite'
import { Query, ID, type Models } from 'appwrite'
import { TABLE_MESSAGES } from '@/lib/collections'

export interface IMessage extends Models.Row {
  tenant: string
  guest_name: string
  content: string
  created_at?: number
  guest_id?: string
  photo_url?: string
}

export const listMessages = async (tenantId: string): Promise<IMessage[]> => {
  const res = await tables.listRows<IMessage>({
    databaseId: DATABASE_ID,
    tableId: TABLE_MESSAGES,
    queries: [Query.equal('tenant', tenantId)]
  })
  return res.rows
}

export const createMessage = async (tenantId: string, userId: string, data: Partial<IMessage>): Promise<IMessage> => {
  return await tables.upsertRow<IMessage>({
    databaseId: DATABASE_ID,
    tableId: TABLE_MESSAGES,
    rowId: ID.unique(),
    data: {
      ...data,
      tenant: tenantId,
      created_at: Date.now()
    } as any,
    permissions: [
      Permission.read(Role.any()),
      Permission.write(Role.user(userId))
    ]
  })
}

export const deleteMessage = async (id: string): Promise<void> => {
  await tables.deleteRow({
    databaseId: DATABASE_ID,
    tableId: TABLE_MESSAGES,
    rowId: id
  })
}

import client, { databases, DATABASE_ID, TABLE_PRODUCTS } from './src/lib/appwrite'
import { Query } from 'appwrite'

async function run() {
  const tenantId = '6636750f0003cb6de43b' // We need a valid tenant ID to test, let's just list without tenant filter
  const res = await databases.listDocuments(DATABASE_ID, TABLE_PRODUCTS, [
    Query.limit(1),
    Query.select(['*', 'links.*'])
  ])
  console.log(JSON.stringify(res.documents, null, 2))
}

run().catch(console.error)

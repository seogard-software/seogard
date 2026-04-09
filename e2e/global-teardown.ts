import mongoose from 'mongoose'

export default async function globalTeardown() {
  const uri = process.env.E2E_DATABASE_URL
  if (!uri) throw new Error('E2E_DATABASE_URL is required')
  await mongoose.connect(uri)

  const db = mongoose.connection.db
  if (db) {
    await db.dropDatabase()
    console.log('[e2e] Test database dropped')
  }

  await mongoose.disconnect()
}

import mongoose from 'mongoose'
import { seedDatabase } from './helpers/seed'

export default async function globalSetup() {
  const uri = process.env.E2E_DATABASE_URL
  if (!uri) throw new Error('E2E_DATABASE_URL is required')
  await mongoose.connect(uri)
  console.log('[e2e] Connected to test database')

  await seedDatabase()
  console.log('[e2e] Database seeded')

  await mongoose.disconnect()
}

import mongoose from 'mongoose'

let isConnected = false

export async function connectDB() {
  if (isConnected) return

  const uri = process.env.DATABASE_URL
  if (!uri) throw new Error('DATABASE_URL is required')

  await mongoose.connect(uri)
  isConnected = true
}

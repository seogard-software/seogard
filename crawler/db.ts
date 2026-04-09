import mongoose from 'mongoose'

const uri = process.env.DATABASE_URL
if (!uri) throw new Error('DATABASE_URL is required')

export async function connectDB() {
  await mongoose.connect(uri)
}

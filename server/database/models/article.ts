import { Schema, model } from 'mongoose'

const articleSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  slug: { type: String, required: true },
  date: { type: String, required: true },
  updatedAt: { type: String, default: null },
  category: { type: String, required: true },
  tags: { type: [String], default: [] },
  author: { type: String, default: 'Equipe Seogard' },
  readingTime: { type: Number, default: 5 },
  canonical: { type: String, required: true },
  image: { type: String, default: null },
  imageAlt: { type: String, default: null },
  body: { type: String, required: true },
  htmlContent: { type: String, required: true },
}, { timestamps: true })

articleSchema.index({ slug: 1 }, { unique: true })
articleSchema.index({ date: -1 })
articleSchema.index({ category: 1, date: -1 })

export const Article = model('Article', articleSchema)

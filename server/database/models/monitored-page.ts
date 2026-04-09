import { Schema, model, Types } from 'mongoose'

const metaSchema = new Schema({
  title: String,
  description: String,
  canonical: String,
  robots: String,
  ogTitle: String,
  ogDescription: String,
  ogImage: String,
}, { _id: false, strict: false })

/** Extract pathname from a full URL (e.g. "https://example.com/blog/post" → "/blog/post") */
export function extractPathname(url: string): string {
  try {
    return new URL(url).pathname
  }
  catch {
    return '/'
  }
}

const monitoredPageSchema = new Schema({
  siteId: { type: Types.ObjectId, ref: 'Site', required: true, index: true },
  url: { type: String, required: true },
  pathname: { type: String, default: '/' },
  lastStatusCode: Number,
  lastMeta: metaSchema,
  lastRenderedAt: Date,
  lastCheckedAt: Date,
}, { timestamps: true })

monitoredPageSchema.index({ siteId: 1, url: 1 }, { unique: true })
monitoredPageSchema.index({ siteId: 1, pathname: 1 })

// Auto-compute pathname from url on save
monitoredPageSchema.pre('save', function () {
  if (this.isModified('url') || !this.pathname || this.pathname === '/') {
    this.pathname = extractPathname(this.url)
  }
})

export const MonitoredPage = model('MonitoredPage', monitoredPageSchema)

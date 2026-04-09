export interface ArticleMeta {
  _id: string
  title: string
  description: string
  slug: string
  date: string
  updatedAt?: string
  category: string
  tags: string[]
  author: string
  readingTime: number
  canonical: string
  image?: string
  imageAlt?: string
}

export interface Article extends ArticleMeta {
  body: string
  htmlContent: string
}

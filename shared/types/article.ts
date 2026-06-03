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

/** Catégorie de blog curée (≥ seuil) exposée par /api/public/articles/categories. */
export interface BlogCategory {
  category: string
  slug: string
  count: number
}

/** Réponse paginée de /api/public/articles. */
export interface ArticleListResponse {
  articles: ArticleMeta[]
  total: number
  page: number
  totalPages: number
}

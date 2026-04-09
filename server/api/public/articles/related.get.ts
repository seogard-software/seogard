import { getQuery } from 'h3'
import { Article } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const { category, exclude, limit = '3' } = getQuery(event) as {
    category?: string
    exclude?: string
    limit?: string
  }

  if (!category) {
    throw createError({ statusCode: 400, message: 'Le paramètre category est requis.' })
  }

  const filter: Record<string, unknown> = { category }
  if (exclude) filter.slug = { $ne: exclude }

  const articles = await Article.find(filter)
    .select('-body -htmlContent')
    .sort({ date: -1 })
    .limit(Math.min(10, Number(limit)))
    .lean()

  return articles
})

import { getQuery } from 'h3'
import { Article } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const { page = '1', limit = '12', category, search } = getQuery(event) as {
    page?: string
    limit?: string
    category?: string
    search?: string
  }

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.min(100, Math.max(1, Number(limit)))
  const skip = (pageNum - 1) * limitNum

  const filter: Record<string, unknown> = {}
  if (category) filter.category = category
  if (search && search.trim().length >= 2) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [
      { title: { $regex: regex } },
      { description: { $regex: regex } },
      { tags: { $regex: regex } },
    ]
  }

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .select('-body -htmlContent')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Article.countDocuments(filter),
  ])

  return {
    articles,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
  }
})

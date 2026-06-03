import { Article } from '~~/server/database/models'
import { categorySlug } from '~~/shared/utils/blog'

// Seuil anti-thin / anti-crawl-trap : une catégorie sous ce nombre d'articles
// n'a pas de hub dédié (ses articles restent atteignables via la pagination /blog).
export const CATEGORY_MIN_ARTICLES = 3

export default defineEventHandler(async () => {
  const rows = await Article.aggregate<{ _id: string, count: number }>([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $match: { count: { $gte: CATEGORY_MIN_ARTICLES } } },
    { $sort: { count: -1 } },
  ])

  // Slugify + dédoublonnage (deux catégories proches pourraient collisionner :
  // on garde la première, déjà triée par count décroissant).
  const seen = new Set<string>()
  const categories: { category: string, slug: string, count: number }[] = []
  for (const row of rows) {
    if (!row._id) continue
    const slug = categorySlug(row._id)
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    categories.push({ category: row._id, slug, count: row.count })
  }

  return { categories }
})

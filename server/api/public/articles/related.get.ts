import { getQuery } from 'h3'
import { Article } from '~~/server/database/models'

const SELECT = '-body -htmlContent'
const MAX_RELATED = 6

// Articles « connexes » rendus en SSR sous chaque article. On privilégie la même
// catégorie, puis on complète par les plus récents (autres catégories) pour TOUJOURS
// fournir jusqu'à `limit` liens — un article ne doit jamais rester sans maillage.
export default defineEventHandler(async (event) => {
  const { category, exclude, limit = '6' } = getQuery(event) as {
    category?: string
    exclude?: string
    limit?: string
  }

  if (!category) {
    throw createError({ statusCode: 400, message: 'Le paramètre category est requis.' })
  }

  const max = Math.min(MAX_RELATED, Math.max(1, Number(limit) || MAX_RELATED))
  const excludeSlugs = exclude ? [exclude] : []

  // 1) Même catégorie, les plus récents.
  const sameCategory = await Article.find({
    category,
    ...(excludeSlugs.length ? { slug: { $nin: excludeSlugs } } : {}),
  })
    .select(SELECT)
    .sort({ date: -1 })
    .limit(max)
    .lean()

  if (sameCategory.length >= max) return sameCategory

  // 2) Fallback : compléter par les articles les plus récents des autres catégories,
  // en excluant l'article courant ET ceux déjà retenus.
  const pickedSlugs = sameCategory.map(a => a.slug as string)
  const fill = await Article.find({
    category: { $ne: category },
    slug: { $nin: [...excludeSlugs, ...pickedSlugs] },
  })
    .select(SELECT)
    .sort({ date: -1 })
    .limit(max - sameCategory.length)
    .lean()

  return [...sameCategory, ...fill]
})

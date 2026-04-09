import { Article } from '~~/server/database/models'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'Slug requis.' })
  }

  const article = await Article.findOne({ slug }).lean()

  if (!article) {
    throw createError({ statusCode: 404, message: 'Article introuvable.' })
  }

  return article
})

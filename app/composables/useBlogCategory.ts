import type { ArticleListResponse, ArticleMeta, BlogCategory } from '~~/shared/types/article'
import { BLOG_PAGE_SIZE } from '~~/shared/utils/blog'

/**
 * Résout un slug de catégorie en catégorie réelle (404 si inconnue), charge la page
 * d'articles correspondante (404 si hors-borne) et expose ce qu'il faut pour rendre
 * un hub catégorie en SSR. Partagé par /blog/categorie/[slug] et sa pagination.
 */
export async function useBlogCategory(slug: string, page: number) {
  const { data: categoriesData } = await useFetch<{ categories: BlogCategory[] }>('/api/public/articles/categories')
  const match = (categoriesData.value?.categories ?? []).find(c => c.slug === slug)
  if (!match) {
    throw createError({ statusCode: 404, message: 'Catégorie introuvable' })
  }

  const { data: listing } = await useFetch<ArticleListResponse>('/api/public/articles', {
    params: { category: match.category, page: String(page), limit: String(BLOG_PAGE_SIZE) },
    key: `blog-cat-${slug}-${page}`,
  })

  const total = listing.value?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE))
  if (page > totalPages) {
    throw createError({ statusCode: 404, message: 'Page introuvable' })
  }

  return {
    category: match.category,
    slug: match.slug,
    totalPages,
    articles: computed<ArticleMeta[]>(() => listing.value?.articles ?? []),
  }
}

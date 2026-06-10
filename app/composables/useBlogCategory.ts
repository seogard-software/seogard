import type { ArticleListResponse, ArticleMeta, BlogCategory } from '~~/shared/types/article'
import { BLOG_PAGE_SIZE } from '~~/shared/utils/blog'

/**
 * Résout un slug de catégorie en catégorie réelle (404 si inconnue), charge la page
 * d'articles correspondante (404 si hors-borne) et expose ce qu'il faut pour rendre
 * un hub catégorie en SSR. Partagé par /blog/categorie/[slug] et sa pagination.
 *
 * UN SEUL await (useAsyncData englobant) : deux useFetch séquentiels perdent le
 * contexte Nuxt après le premier await → « instance unavailable » → 500 en SSR.
 */
export async function useBlogCategory(slug: string, page: number) {
  const { data, error } = await useAsyncData(`blog-cat-${slug}-${page}`, async () => {
    const cats = await $fetch<{ categories: BlogCategory[] }>('/api/public/articles/categories')
    const match = (cats.categories ?? []).find(c => c.slug === slug)
    if (!match) {
      throw createError({ statusCode: 404, message: 'Catégorie introuvable' })
    }

    const listing = await $fetch<ArticleListResponse>('/api/public/articles', {
      params: { category: match.category, page: String(page), limit: String(BLOG_PAGE_SIZE) },
    })

    return { category: match.category, slug: match.slug, listing }
  })

  if (error.value) {
    // Re-propage le 404 (slug inconnu) lancé dans le handler ; tout le reste = 500.
    const cause = error.value as { statusCode?: number, message?: string }
    throw createError({ statusCode: cause.statusCode ?? 500, message: cause.message ?? 'Erreur de chargement' })
  }
  if (!data.value) {
    throw createError({ statusCode: 404, message: 'Catégorie introuvable' })
  }

  const total = data.value.listing?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE))
  if (page > totalPages) {
    throw createError({ statusCode: 404, message: 'Page introuvable' })
  }

  return {
    category: data.value.category,
    slug: data.value.slug,
    totalPages,
    articles: computed<ArticleMeta[]>(() => data.value?.listing.articles ?? []),
  }
}

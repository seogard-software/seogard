<template>
  <div class="blog-listing">
    <section class="blog-listing__hero">
      <div class="blog-listing__hero-inner">
        <BlogBreadcrumb :items="breadcrumb" class="blog-listing__breadcrumb" />
        <h1 class="blog-listing__title">Blog SEO Technique</h1>
        <p class="blog-listing__subtitle">Page {{ pageNum }} sur {{ totalPages }}</p>
      </div>
    </section>

    <section class="blog-listing__content">
      <BlogArticleGrid :articles="articles" />
      <BlogPagination
        :current-page="pageNum"
        :total-pages="totalPages"
        base-path="/blog"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ArticleListResponse, ArticleMeta } from '~~/shared/types/article'
import { BLOG_PAGE_SIZE } from '~~/shared/utils/blog'

definePageMeta({
  layout: 'landing',
  auth: false,
})

const route = useRoute()
const pageParam = route.params.page as string
const pageNum = Number(pageParam)

// Page 1 → 301 vers /blog (anti-doublon). Branches exclusives : la page 1 ne doit
// jamais retomber dans le 404 ci-dessous (navigateTo n'interrompt pas le setup).
if (pageParam === '1') {
  await navigateTo('/blog', { redirectCode: 301, replace: true })
}
// Param non numérique ou < 2 → 404 franc (pas d'URL infinie).
else if (!/^\d+$/.test(pageParam) || pageNum < 2) {
  throw createError({ statusCode: 404, message: 'Page introuvable' })
}

const { data: listing } = await useFetch<ArticleListResponse>('/api/public/articles', {
  params: { page: pageParam, limit: String(BLOG_PAGE_SIZE) },
})

const articles = computed<ArticleMeta[]>(() => listing.value?.articles ?? [])
const total = computed(() => listing.value?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / BLOG_PAGE_SIZE)))

// Hors-borne → 404 (la donnée est résolue côté serveur après l'await).
if (pageNum > totalPages.value) {
  throw createError({ statusCode: 404, message: 'Page introuvable' })
}

const breadcrumb = [
  { name: 'Accueil', to: '/' },
  { name: 'Blog', to: '/blog' },
  { name: `Page ${pageNum}` },
]

const canonical = `https://seogard.io/blog/page/${pageNum}`

useHead({
  link: [{ rel: 'canonical', href: canonical }],
})

useSeoMeta({
  title: `Blog SEO Technique — Page ${pageNum} | Seogard`,
  description: `Articles du blog SEO technique Seogard — page ${pageNum}. Monitoring, régressions SSR/CSR, GEO et bonnes pratiques.`,
  ogTitle: `Blog SEO Technique — Page ${pageNum} | Seogard`,
  ogUrl: canonical,
  ogType: 'website',
  ogImage: 'https://seogard.io/og-image.png',
  robots: 'index, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.blog-listing {
  &__hero {
    padding: calc($spacing-8 + 64px) $spacing-6 $spacing-8;
    text-align: center;
  }

  &__hero-inner {
    max-width: 720px;
    margin: 0 auto;
  }

  &__breadcrumb {
    justify-content: center;
    margin-bottom: $spacing-6;
  }

  &__title {
    font-size: $font-size-4xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin-bottom: $spacing-4;
  }

  &__subtitle {
    font-size: $font-size-lg;
    color: $color-gray-500;
  }

  &__content {
    max-width: 1200px;
    margin: 0 auto;
    padding: $spacing-12 $spacing-6;
  }

  @media (max-width: $breakpoint-sm) {
    &__title {
      font-size: $font-size-3xl;
    }
  }
}
</style>

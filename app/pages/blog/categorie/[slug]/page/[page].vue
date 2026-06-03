<template>
  <div class="blog-listing">
    <section class="blog-listing__hero">
      <div class="blog-listing__hero-inner">
        <BlogBreadcrumb :items="breadcrumb" class="blog-listing__breadcrumb" />
        <h1 class="blog-listing__title">{{ category }}</h1>
        <p class="blog-listing__subtitle">Page {{ pageNum }} sur {{ totalPages }}</p>
      </div>
    </section>

    <section class="blog-listing__content">
      <BlogArticleGrid :articles="articles" />
      <BlogPagination
        :current-page="pageNum"
        :total-pages="totalPages"
        :base-path="`/blog/categorie/${slug}`"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { buildBreadcrumbJsonLd } from '~~/shared/utils/blog'

definePageMeta({
  layout: 'landing',
  auth: false,
})

const route = useRoute()
const slugParam = route.params.slug as string
const pageParam = route.params.page as string

const pageNum = Number(pageParam)

// Page 1 → 301 vers le hub (anti-doublon). Branches exclusives : la page 1 ne doit
// jamais retomber dans le 404 ci-dessous (navigateTo n'interrompt pas le setup).
if (pageParam === '1') {
  await navigateTo(`/blog/categorie/${slugParam}`, { redirectCode: 301, replace: true })
}
else if (!/^\d+$/.test(pageParam) || pageNum < 2) {
  throw createError({ statusCode: 404, message: 'Page introuvable' })
}

const { category, slug, totalPages, articles } = await useBlogCategory(slugParam, pageNum)

const canonical = `https://seogard.io/blog/categorie/${slug}/page/${pageNum}`

const breadcrumb = [
  { name: 'Accueil', to: '/' },
  { name: 'Blog', to: '/blog' },
  { name: category, to: `/blog/categorie/${slug}` },
  { name: `Page ${pageNum}` },
]

useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(buildBreadcrumbJsonLd([
        { name: 'Accueil', url: 'https://seogard.io/' },
        { name: 'Blog', url: 'https://seogard.io/blog' },
        { name: category, url: `https://seogard.io/blog/categorie/${slug}` },
        { name: `Page ${pageNum}`, url: canonical },
      ])),
    },
  ],
})

useSeoMeta({
  title: `${category} — Page ${pageNum} | Seogard`,
  description: `Articles ${category} du blog SEO technique Seogard — page ${pageNum}.`,
  ogTitle: `${category} — Page ${pageNum} | Seogard`,
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

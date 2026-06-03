<template>
  <div class="blog-listing">
    <section class="blog-listing__hero">
      <div class="blog-listing__hero-inner">
        <BlogBreadcrumb :items="breadcrumb" class="blog-listing__breadcrumb" />
        <h1 class="blog-listing__title">{{ category }}</h1>
        <p class="blog-listing__subtitle">{{ intro }}</p>
      </div>
    </section>

    <section class="blog-listing__content">
      <BlogArticleGrid :articles="articles" />
      <BlogPagination
        :current-page="1"
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

const { category, slug, totalPages, articles } = await useBlogCategory(slugParam, 1)

const intro = `Tous nos articles sur ${category} : guides pratiques, analyses et retours d'expérience pour le monitoring SEO technique et la visibilité IA (GEO).`
const canonical = `https://seogard.io/blog/categorie/${slug}`

const breadcrumb = [
  { name: 'Accueil', to: '/' },
  { name: 'Blog', to: '/blog' },
  { name: category },
]

useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(buildBreadcrumbJsonLd([
        { name: 'Accueil', url: 'https://seogard.io/' },
        { name: 'Blog', url: 'https://seogard.io/blog' },
        { name: category, url: canonical },
      ])),
    },
  ],
})

useSeoMeta({
  title: `${category} — Blog SEO Technique | Seogard`,
  description: intro,
  ogTitle: `${category} — Blog SEO Technique | Seogard`,
  ogDescription: intro,
  ogType: 'website',
  ogUrl: canonical,
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
    line-height: $line-height-normal;
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

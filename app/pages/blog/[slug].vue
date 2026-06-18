<template>
  <div class="blog-article">
    <template v-if="article">
      <section class="blog-article__hero">
        <div class="blog-article__hero-inner">
          <BlogBreadcrumb :items="breadcrumb" class="blog-article__breadcrumb" />
          <h1 class="blog-article__title">{{ article.title }}</h1>
          <div class="blog-article__meta">
            <span class="blog-article__category">{{ article.category }}</span>
            <span class="blog-article__date">{{ formattedDate }}</span>
            <span class="blog-article__reading-time">{{ article.readingTime }} min de lecture</span>
          </div>
        </div>
      </section>

      <div class="blog-article__layout">
        <article class="blog-article__content">
          <div class="prose" v-html="article.htmlContent" />
        </article>

        <aside class="blog-article__sidebar">
          <div class="blog-article__cta">
            <span class="blog-article__cta-badge">Analyse gratuite</span>
            <h3 class="blog-article__cta-title">Que voit vraiment Google de votre site ?</h3>
            <p class="blog-article__cta-text">
              Audit &amp; monitoring SEO/GEO en continu. Scannez votre site, recevez votre rapport en quelques minutes — sans carte bancaire.
            </p>
            <ScanBar size="compact" />
          </div>
        </aside>
      </div>

      <section v-if="relatedArticles?.length" class="blog-article__related">
        <h2 class="blog-article__related-title">Articles connexes</h2>
        <div class="blog-article__related-grid">
          <BlogCard
            v-for="related in relatedArticles"
            :key="related.slug"
            :article="related"
          />
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { ArticleMeta } from '~~/shared/types/article'
import { buildBreadcrumbJsonLd } from '~~/shared/utils/blog'

interface ArticleFull {
  _id: string
  title: string
  description: string
  slug: string
  date: string
  updatedAt: string
  category: string
  tags: string[]
  author: string
  readingTime: number
  canonical: string
  body: string
  htmlContent: string
}

definePageMeta({
  layout: 'landing',
  auth: false,
})

const route = useRoute()
const slug = route.params.slug as string

const { data: article } = await useFetch<ArticleFull>(`/api/public/articles/${slug}`)

if (!article.value) {
  throw createError({ statusCode: 404, message: 'Article introuvable' })
}

const formattedDate = computed(() => {
  if (!article.value) return ''
  const d = new Date(article.value.date)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
})

// Related en SSR (bloquant, pas de lazy) → liens présents dans le HTML brut pour Google + IA.
const { data: relatedArticles } = await useFetch<ArticleMeta[]>('/api/public/articles/related', {
  params: { category: article.value.category, exclude: slug, limit: '6' },
})

// Hub catégorie : lien crawlable uniquement si la catégorie a un hub (≥ seuil). Sinon texte.
const { data: categoriesData } = await useFetch('/api/public/articles/categories')
const categoryHub = computed(() => {
  const match = (categoriesData.value?.categories ?? []).find(c => c.category === article.value?.category)
  return match ? `/blog/categorie/${match.slug}` : undefined
})

const breadcrumb = computed(() => {
  const items: { name: string, to?: string }[] = [
    { name: 'Accueil', to: '/' },
    { name: 'Blog', to: '/blog' },
  ]
  // Catégorie affichée UNIQUEMENT si elle a un hub cliquable (pas de texte mort).
  if (categoryHub.value && article.value) {
    items.push({ name: article.value.category, to: categoryHub.value })
  }
  if (article.value) items.push({ name: article.value.title })
  return items
})

// BreadcrumbList JSON-LD (URLs absolues). On n'inclut le hub que s'il existe (pas de lien mort).
const breadcrumbJsonLd = computed(() => {
  const items = [
    { name: 'Accueil', url: 'https://seogard.io/' },
    { name: 'Blog', url: 'https://seogard.io/blog' },
  ]
  if (categoryHub.value && article.value) {
    items.push({ name: article.value.category, url: `https://seogard.io${categoryHub.value}` })
  }
  if (article.value) {
    items.push({ name: article.value.title, url: article.value.canonical })
  }
  return buildBreadcrumbJsonLd(items)
})

useSeoMeta({
  title: article.value.title,
  description: article.value.description,
  ogTitle: article.value.title,
  ogDescription: article.value.description,
  ogType: 'article',
  ogUrl: article.value.canonical,
  articlePublishedTime: new Date(article.value.date).toISOString(),
  articleModifiedTime: new Date(article.value.updatedAt || article.value.date).toISOString(),
  articleTag: article.value.tags,
  ogImage: 'https://seogard.io/og-image.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://seogard.io/og-image.png',
  twitterTitle: article.value.title,
  twitterDescription: article.value.description,
  robots: 'index, follow',
})

useHead({
  link: [
    { rel: 'canonical', href: article.value.canonical },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': article.value.title,
        'description': article.value.description,
        'datePublished': new Date(article.value.date).toISOString(),
        'dateModified': new Date(article.value.updatedAt || article.value.date).toISOString(),
        'author': {
          '@type': 'Organization',
          'name': article.value.author,
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Seogard',
          'url': 'https://seogard.io',
        },
        'mainEntityOfPage': {
          '@type': 'WebPage',
          '@id': article.value.canonical,
        },
        'speakable': {
          '@type': 'SpeakableSpecification',
          'cssSelector': ['.blog-article__title', '.blog-article__content .prose'],
        },
      }),
    },
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(breadcrumbJsonLd.value),
    },
  ],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.blog-article {
  &__hero {
    padding: calc($spacing-16 + 64px) $spacing-6 $spacing-12;
  }

  &__hero-inner {
    max-width: 720px;
    margin: 0 auto;
  }

  &__breadcrumb {
    margin-bottom: $spacing-6;
  }

  &__title {
    font-size: $font-size-4xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    line-height: $line-height-tight;
    margin-bottom: $spacing-6;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $spacing-4;
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  &__category {
    background: $color-gray-100;
    color: $color-gray-700;
    padding: $spacing-1 $spacing-3;
    border-radius: $radius-full;
    font-weight: $font-weight-medium;
    font-size: $font-size-xs;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  // ── 2-column layout ──
  &__layout {
    max-width: 1100px;
    margin: 0 auto;
    padding: $spacing-12 $spacing-6;
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: $spacing-8;
    align-items: start;
  }

  &__content {
    min-width: 0;
  }

  // ── Sticky sidebar ──
  &__sidebar {
    position: sticky;
    top: 100px;
  }

  &__cta {
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-top: 3px solid $color-accent;
    border-radius: $radius-xl;
    padding: $spacing-6;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }

  &__cta-badge {
    display: inline-block;
    padding: $spacing-1 $spacing-3;
    background: rgba($color-accent, 0.1);
    color: $color-accent;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-radius: $radius-full;
    margin-bottom: $spacing-4;
  }

  &__cta-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    line-height: $line-height-snug;
    margin-bottom: $spacing-3;
  }

  &__cta-text {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
    margin-bottom: $spacing-5;
  }

  // ── Related articles ──
  &__related {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 $spacing-6 $spacing-16;
  }

  &__related-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin-bottom: $spacing-6;
  }

  &__related-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-6;
  }

  // ── Responsive ──
  @media (max-width: $breakpoint-lg) {
    &__layout {
      grid-template-columns: 1fr 280px;
    }

    &__related-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: $breakpoint-md) {
    &__layout {
      grid-template-columns: 1fr;
    }

    &__sidebar {
      position: static;
    }
  }

  @media (max-width: $breakpoint-sm) {
    &__title {
      font-size: $font-size-3xl;
    }

    &__meta {
      flex-wrap: wrap;
      gap: $spacing-2;
    }

    &__related-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

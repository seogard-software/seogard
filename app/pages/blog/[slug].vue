<template>
  <div class="blog-article">
    <template v-if="article">
      <section class="blog-article__hero">
        <div class="blog-article__hero-inner">
          <nav class="blog-article__breadcrumb" aria-label="Fil d'ariane">
            <NuxtLink to="/blog" class="blog-article__breadcrumb-link">Blog</NuxtLink>
            <span class="blog-article__breadcrumb-sep">/</span>
            <span class="blog-article__breadcrumb-current">{{ article.category }}</span>
          </nav>
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
            <div class="blog-article__cta-bg" />
            <div class="blog-article__cta-inner">
              <span class="blog-article__cta-badge">Essai gratuit 14 jours</span>
              <h3 class="blog-article__cta-title">Détectez vos régressions SEO avant Google</h3>
              <p class="blog-article__cta-text">
                Monitoring continu de vos meta tags, SSR et pages. Alerte instantanée dès qu'une régression est détectée.
              </p>

              <div class="blog-article__cta-actions">
                <NuxtLink to="/#estimator" class="blog-article__cta-button blog-article__cta-button--estimate">
                  Estimer mon prix Cloud
                </NuxtLink>
                <NuxtLink to="/register" class="blog-article__cta-button blog-article__cta-button--primary">
                  Essai gratuit 14 jours
                </NuxtLink>
                <a href="https://github.com/seogard-software/seogard" target="_blank" rel="noopener" class="blog-article__cta-button blog-article__cta-button--ghost">
                  Self-hosted sur GitHub
                </a>
              </div>
            </div>
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
definePageMeta({
  layout: 'landing',
  auth: false,
})

const route = useRoute()
const slug = route.params.slug as string

const { data: article } = await useFetch(`/api/public/articles/${slug}`)

if (!article.value) {
  throw createError({ statusCode: 404, message: 'Article introuvable' })
}

const formattedDate = computed(() => {
  if (!article.value) return ''
  const d = new Date(article.value.date)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
})

const { data: relatedArticles } = useFetch('/api/public/articles/related', {
  params: { category: article.value.category, exclude: slug, limit: '3' },
  lazy: true,
})

useSeoMeta({
  title: `${article.value.title} | Seogard`,
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
    display: flex;
    align-items: center;
    gap: $spacing-2;
    margin-bottom: $spacing-6;
    font-size: $font-size-sm;
  }

  &__breadcrumb-link {
    color: $color-gray-500;
    text-decoration: none;

    &:hover {
      color: $color-gray-900;
      text-decoration: none;
    }
  }

  &__breadcrumb-sep {
    color: $color-gray-300;
  }

  &__breadcrumb-current {
    color: $color-gray-500;
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
    position: relative;
    border-radius: $radius-xl;
    overflow: hidden;
  }

  &__cta-bg {
    position: absolute;
    inset: 0;
    background: $color-gray-900;
    z-index: 0;
  }

  &__cta-inner {
    position: relative;
    z-index: 1;
    padding: $spacing-6;
  }

  &__cta-badge {
    display: inline-block;
    padding: $spacing-1 $spacing-3;
    background: $color-gray-700;
    color: $color-white;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;
    margin-bottom: $spacing-4;
  }

  &__cta-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-white;
    line-height: $line-height-snug;
    margin-bottom: $spacing-3;
  }

  &__cta-text {
    font-size: $font-size-xs;
    color: $color-gray-400;
    line-height: $line-height-normal;
    margin-bottom: $spacing-5;
  }

  &__cta-actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__cta-button {
    display: block;
    text-align: center;
    padding: $spacing-2 $spacing-4;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border-radius: $radius-lg;
    text-decoration: none;
    transition: all $transition-fast;

    &--estimate {
      background: $color-white;
      color: $color-gray-900;

      &:hover {
        background: $color-gray-100;
        box-shadow: $shadow-md;
        text-decoration: none;
      }
    }

    &--primary {
      background: $color-gray-700;
      color: $color-white;

      &:hover {
        background: $color-gray-600;
        box-shadow: $shadow-md;
        text-decoration: none;
      }
    }

    &--ghost {
      color: $color-gray-400;
      border: 1px solid $color-gray-600;

      &:hover {
        color: $color-white;
        border-color: $color-gray-500;
        text-decoration: none;
      }
    }
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

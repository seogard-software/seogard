<template>
  <div class="blog-listing">
    <section class="blog-listing__hero">
      <div class="blog-listing__hero-inner">
        <h1 class="blog-listing__title">Blog SEO Technique</h1>
        <p class="blog-listing__subtitle">
          Guides pratiques, analyses et retours d'expérience pour éviter les régressions SEO
          et garder votre site performant.
        </p>

        <div class="blog-listing__search">
          <svg class="blog-listing__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            v-model="searchQuery"
            type="search"
            class="blog-listing__search-input"
            placeholder="Rechercher un article..."
            aria-label="Rechercher un article"
          >
        </div>
      </div>
    </section>

    <section class="blog-listing__content">
      <div v-if="isSearching" class="blog-listing__grid">
        <div v-for="i in 6" :key="i" class="blog-listing__skeleton">
          <div class="blog-listing__skeleton-meta" />
          <div class="blog-listing__skeleton-title" />
          <div class="blog-listing__skeleton-desc" />
          <div class="blog-listing__skeleton-desc blog-listing__skeleton-desc--short" />
          <div class="blog-listing__skeleton-footer" />
        </div>
      </div>

      <template v-else-if="displayedArticles.length">
        <div class="blog-listing__grid">
          <BlogCard
            v-for="article in displayedArticles"
            :key="article.slug"
            :article="article"
          />
        </div>

        <div v-if="hasMore && !searchQuery" class="blog-listing__load-more">
          <button
            class="blog-listing__load-more-btn"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Chargement...' : 'Charger plus d\'articles' }}
          </button>
          <p class="blog-listing__count">
            {{ displayedArticles.length }} sur {{ totalArticles }} articles
          </p>
        </div>
      </template>

      <div v-else class="blog-listing__empty">
        <p v-if="searchQuery">Aucun article trouvé pour « {{ searchQuery }} »</p>
        <p v-else>Aucun article pour le moment. Revenez bientôt !</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ArticleMeta } from '~~/shared/types/article'

definePageMeta({
  layout: 'landing',
  auth: false,
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://seogard.io/blog' },
  ],
})

useSeoMeta({
  title: 'Blog SEO Technique | Seogard',
  description: 'Guides pratiques sur le monitoring SEO technique : SSR, meta tags, régressions, bonnes pratiques de déploiement.',
  ogTitle: 'Blog SEO Technique | Seogard',
  ogDescription: 'Guides pratiques sur le monitoring SEO technique : SSR, meta tags, régressions, bonnes pratiques de déploiement.',
  ogType: 'website',
  ogUrl: 'https://seogard.io/blog',
  ogImage: 'https://seogard.io/og-image.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://seogard.io/og-image.png',
  twitterTitle: 'Blog SEO Technique | Seogard',
  twitterDescription: 'Guides pratiques sur le monitoring SEO technique : SSR, meta tags, régressions.',
  robots: 'index, follow',
})

const BATCH_SIZE = 12

// SSR: initial load of 12 articles
const { data: initialData } = await useFetch('/api/public/articles', {
  params: { limit: String(BATCH_SIZE) },
})

const allArticles = ref<ArticleMeta[]>(initialData.value?.articles ?? [])
const totalArticles = ref(initialData.value?.total ?? 0)
const currentPage = ref(1)
const loadingMore = ref(false)

const hasMore = computed(() => allArticles.value.length < totalArticles.value)

async function loadMore() {
  loadingMore.value = true
  currentPage.value++
  const { data } = await useFetch('/api/public/articles', {
    params: { page: String(currentPage.value), limit: String(BATCH_SIZE) },
    server: false,
  })
  if (data.value?.articles) {
    allArticles.value.push(...data.value.articles)
    totalArticles.value = data.value.total
  }
  loadingMore.value = false
}

// Search
const searchQuery = ref('')
const searchResults = ref<ArticleMeta[] | null>(null)
const isSearching = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

if (import.meta.client) {
  watchEffect(() => {
    const query = searchQuery.value
    if (searchTimeout) clearTimeout(searchTimeout)

    if (!query || query.trim().length < 2) {
      searchResults.value = null
      isSearching.value = false
      return
    }

    isSearching.value = true
    searchTimeout = setTimeout(async () => {
      const { data } = await useFetch('/api/public/articles', {
        params: { search: query.trim(), limit: '100' },
        server: false,
      })
      searchResults.value = data.value?.articles ?? []
      isSearching.value = false
    }, 300)
  })
}

const displayedArticles = computed(() => {
  if (searchQuery.value && searchQuery.value.trim().length >= 2) {
    return searchResults.value ?? []
  }
  return allArticles.value
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.blog-listing {
  &__hero {
    padding: calc($spacing-16 + 64px) $spacing-6 $spacing-16;
    text-align: center;
  }

  &__hero-inner {
    max-width: 720px;
    margin: 0 auto;
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

  &__search {
    position: relative;
    margin-top: $spacing-8;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
  }

  &__search-icon {
    position: absolute;
    right: $spacing-4;
    top: 50%;
    transform: translateY(-50%);
    color: $color-gray-400;
    pointer-events: none;
  }

  &__search-input {
    width: 100%;
    padding: $spacing-3 $spacing-4;
    padding-right: $spacing-10;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    color: $color-gray-800;
    font-size: $font-size-base;
    font-family: $font-family-base;
    transition: border-color $transition-fast;

    &::placeholder {
      color: $color-gray-400;
    }

    &:focus {
      outline: none;
      border-color: $color-gray-400;
    }
  }

  &__content {
    max-width: 1200px;
    margin: 0 auto;
    padding: $spacing-12 $spacing-6;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-6;
  }

  &__empty {
    text-align: center;
    padding: $spacing-16;
    color: $color-gray-400;
    font-size: $font-size-lg;
  }

  &__load-more {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-3;
    margin-top: $spacing-12;
  }

  &__load-more-btn {
    padding: $spacing-3 $spacing-8;
    background: transparent;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    color: $color-gray-800;
    font-size: $font-size-base;
    font-family: $font-family-base;
    cursor: pointer;
    transition: border-color $transition-fast, background $transition-fast;

    &:hover:not(:disabled) {
      border-color: $color-gray-400;
      background: $surface-card;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__count {
    font-size: $font-size-sm;
    color: $color-gray-400;
  }

  &__skeleton {
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    padding: $spacing-6;
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__skeleton-meta {
    width: 40%;
    height: 16px;
    background: $color-gray-200;
    border-radius: $radius-sm;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  &__skeleton-title {
    width: 85%;
    height: 22px;
    background: $color-gray-200;
    border-radius: $radius-sm;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    animation-delay: 0.1s;
  }

  &__skeleton-desc {
    width: 100%;
    height: 14px;
    background: $color-gray-200;
    border-radius: $radius-sm;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    animation-delay: 0.2s;

    &--short {
      width: 60%;
    }
  }

  &__skeleton-footer {
    width: 70%;
    height: 14px;
    background: $color-gray-200;
    border-radius: $radius-sm;
    margin-top: auto;
    padding-top: $spacing-3;
    border-top: 1px solid $color-gray-200;
    animation: skeleton-pulse 1.5s ease-in-out infinite;
    animation-delay: 0.3s;
  }

  @keyframes skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @media (max-width: $breakpoint-lg) {
    &__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: $breakpoint-sm) {
    &__grid {
      grid-template-columns: 1fr;
    }

    &__title {
      font-size: $font-size-3xl;
    }
  }
}
</style>

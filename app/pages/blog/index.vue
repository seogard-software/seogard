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
            @input="onSearchInput"
          >
        </div>
      </div>
    </section>

    <section class="blog-listing__content">
      <!-- Hubs catégories : maillage SSR, faible profondeur de clic -->
      <nav v-if="!isSearchActive && categories.length" class="blog-listing__themes" aria-label="Parcourir par thème">
        <h2 class="blog-listing__themes-title">Parcourir par thème</h2>
        <div class="blog-listing__themes-list">
          <NuxtLink
            v-for="cat in categories"
            :key="cat.slug"
            :to="`/blog/categorie/${cat.slug}`"
            class="blog-listing__theme"
          >
            {{ cat.category }}
            <span class="blog-listing__theme-count">{{ cat.count }}</span>
          </NuxtLink>
        </div>
      </nav>

      <div v-if="isLoadingSearch" class="blog-listing__grid">
        <div v-for="i in 6" :key="i" class="blog-listing__skeleton">
          <div class="blog-listing__skeleton-meta" />
          <div class="blog-listing__skeleton-title" />
          <div class="blog-listing__skeleton-desc" />
          <div class="blog-listing__skeleton-desc blog-listing__skeleton-desc--short" />
          <div class="blog-listing__skeleton-footer" />
        </div>
      </div>

      <template v-else-if="displayedArticles.length">
        <BlogArticleGrid :articles="displayedArticles" />

        <BlogPagination
          v-if="!isSearchActive"
          :current-page="1"
          :total-pages="totalPages"
          base-path="/blog"
        />
      </template>

      <div v-else class="blog-listing__empty">
        <p v-if="isSearchActive">Aucun article trouvé pour « {{ searchQuery }} »</p>
        <p v-else>Aucun article pour le moment. Revenez bientôt !</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ArticleListResponse, ArticleMeta, BlogCategory } from '~~/shared/types/article'
import { BLOG_PAGE_SIZE } from '~~/shared/utils/blog'

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

// SSR : page 1 + hubs catégories — tout rendu côté serveur.
const { data: listing } = await useFetch<ArticleListResponse>('/api/public/articles', {
  params: { limit: String(BLOG_PAGE_SIZE) },
})
const { data: categoriesData } = await useFetch<{ categories: BlogCategory[] }>('/api/public/articles/categories')

const articles = computed<ArticleMeta[]>(() => listing.value?.articles ?? [])
const total = computed(() => listing.value?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / BLOG_PAGE_SIZE)))
const categories = computed(() => categoriesData.value?.categories ?? [])

// Recherche (client-side, non indexable — logique dans le handler @input, pas de watch).
const searchQuery = ref('')
const searchResults = ref<ArticleMeta[] | null>(null)
const isLoadingSearch = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const isSearchActive = computed(() => searchQuery.value.trim().length >= 2)

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  const query = searchQuery.value.trim()
  if (query.length < 2) {
    searchResults.value = null
    isLoadingSearch.value = false
    return
  }
  isLoadingSearch.value = true
  searchTimeout = setTimeout(async () => {
    try {
      const data = await $fetch<{ articles: ArticleMeta[] }>('/api/public/articles', {
        params: { search: query, limit: '100' },
      })
      searchResults.value = data.articles ?? []
    }
    finally {
      isLoadingSearch.value = false
    }
  }, 300)
}

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})

const displayedArticles = computed<ArticleMeta[]>(() => {
  if (isSearchActive.value) return searchResults.value ?? []
  return articles.value
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.blog-listing {
  &__hero {
    // Garde la marge sous le header fixe (64px) mais compacte le reste
    // pour que les premiers articles soient visibles sans scroller.
    padding: calc($spacing-8 + 64px) $spacing-6 $spacing-8;
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
    margin-top: $spacing-6;
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
    padding: $spacing-8 $spacing-6 $spacing-12;
  }

  // ── Hubs catégories ──
  &__themes {
    margin-bottom: $spacing-8;
  }

  &__themes-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $color-gray-400;
    margin-bottom: $spacing-4;
  }

  &__themes-list {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-2;
  }

  &__theme {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-3;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    color: $color-gray-700;
    font-size: $font-size-sm;
    text-decoration: none;
    transition: border-color $transition-fast, color $transition-fast;

    &:hover {
      border-color: $color-accent;
      color: $color-gray-900;
      text-decoration: none;
    }
  }

  &__theme-count {
    font-size: $font-size-xs;
    color: $color-gray-400;
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

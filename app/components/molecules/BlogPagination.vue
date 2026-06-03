<template>
  <nav v-if="items.length" class="blog-pagination" aria-label="Pagination des articles">
    <NuxtLink
      v-if="currentPage > 1"
      :to="href(currentPage - 1)"
      rel="prev"
      class="blog-pagination__arrow"
      aria-label="Page précédente"
    >
      ‹ Précédent
    </NuxtLink>

    <template v-for="(item, index) in items" :key="index">
      <span v-if="item === 'ellipsis'" class="blog-pagination__ellipsis" aria-hidden="true">…</span>
      <NuxtLink
        v-else-if="item !== currentPage"
        :to="href(item)"
        class="blog-pagination__page"
      >
        {{ item }}
      </NuxtLink>
      <span
        v-else
        class="blog-pagination__page blog-pagination__page--current"
        aria-current="page"
      >
        {{ item }}
      </span>
    </template>

    <NuxtLink
      v-if="currentPage < totalPages"
      :to="href(currentPage + 1)"
      rel="next"
      class="blog-pagination__arrow"
      aria-label="Page suivante"
    >
      Suivant ›
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
import { paginationWindow } from '~~/shared/utils/blog'

const props = defineProps<{
  currentPage: number
  totalPages: number
  /** Base sans pagination, ex. '/blog' ou '/blog/categorie/seo-technique'. */
  basePath: string
}>()

const items = computed(() => paginationWindow(props.currentPage, props.totalPages))

// Page 1 = basePath (auto-canonique) ; pages ≥ 2 = basePath/page/N.
function href(page: number): string {
  return page <= 1 ? props.basePath : `${props.basePath}/page/${page}`
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.blog-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: $spacing-2;
  margin-top: $spacing-12;

  &__page,
  &__arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 40px;
    height: 40px;
    padding: 0 $spacing-3;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    color: $color-gray-700;
    font-size: $font-size-sm;
    text-decoration: none;
    transition: border-color $transition-fast, background $transition-fast;

    &:hover {
      border-color: $color-gray-400;
      background: $surface-card;
      text-decoration: none;
    }
  }

  &__page--current {
    background: $color-gray-900;
    border-color: $color-gray-900;
    color: $color-white;
    cursor: default;

    &:hover {
      background: $color-gray-900;
      border-color: $color-gray-900;
    }
  }

  &__ellipsis {
    min-width: 24px;
    text-align: center;
    color: $color-gray-400;
  }
}
</style>

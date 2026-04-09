<template>
  <NuxtLink :to="`/blog/${article.slug}`" class="blog-card">
    <div class="blog-card__content">
      <div class="blog-card__meta">
        <span class="blog-card__category">{{ article.category }}</span>
        <span class="blog-card__date">{{ formattedDate }}</span>
      </div>
      <h3 class="blog-card__title">{{ article.title }}</h3>
      <p class="blog-card__description">{{ article.description }}</p>
      <div class="blog-card__footer">
        <span class="blog-card__author">{{ article.author || 'Equipe Seogard' }}</span>
        <span class="blog-card__reading-time">{{ article.readingTime || 5 }} min de lecture</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface BlogArticle {
  title: string
  description: string
  date: string
  category: string
  author?: string
  readingTime?: number
  slug: string
}

const props = defineProps<{
  article: BlogArticle
}>()

const formattedDate = computed(() => {
  const d = new Date(props.article.date)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.blog-card {
  display: flex;
  flex-direction: column;
  background: $surface-card;
  border: 1px solid $color-gray-200;
  border-radius: $radius-lg;
  text-decoration: none;
  color: inherit;
  transition: all $transition-base;
  overflow: hidden;

  &:hover {
    border-color: $color-accent;
    box-shadow: $shadow-md;
    text-decoration: none;
  }

  &__content {
    padding: $spacing-6;
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
    flex: 1;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    font-size: $font-size-xs;
  }

  &__category {
    background: $color-info-bg;
    color: $color-accent;
    padding: $spacing-1 $spacing-2;
    border-radius: $radius-sm;
    font-weight: $font-weight-medium;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__date {
    color: $color-gray-400;
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    line-height: $line-height-snug;
  }

  &__description {
    font-size: $font-size-sm;
    color: $color-gray-500;
    line-height: $line-height-normal;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: $spacing-3;
    border-top: 1px solid $color-gray-200;
    font-size: $font-size-xs;
    color: $color-gray-400;
  }

  &__author {
    font-weight: $font-weight-medium;
    color: $color-gray-600;
  }
}
</style>

<template>
  <div class="blog-grid">
    <BlogCard
      v-for="article in articles"
      :key="article.slug"
      :article="article"
    />
  </div>
</template>

<script setup lang="ts">
import type { ArticleMeta } from '~~/shared/types/article'

defineProps<{
  articles: ArticleMeta[]
}>()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.blog-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-6;

  @media (max-width: $breakpoint-lg) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr;
  }
}
</style>

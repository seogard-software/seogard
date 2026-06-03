<template>
  <nav class="blog-breadcrumb" aria-label="Fil d'Ariane">
    <template v-for="(item, index) in items" :key="index">
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        class="blog-breadcrumb__link"
      >
        {{ item.name }}
      </NuxtLink>
      <span
        v-else
        class="blog-breadcrumb__current"
        :aria-current="index === items.length - 1 ? 'page' : undefined"
      >{{ item.name }}</span>
      <span
        v-if="index < items.length - 1"
        class="blog-breadcrumb__sep"
        aria-hidden="true"
      >›</span>
    </template>
  </nav>
</template>

<script setup lang="ts">
// Étape de fil d'Ariane. `to` présent → lien crawlable ; absent → page courante (texte).
interface Crumb {
  name: string
  to?: string
}

defineProps<{
  items: Crumb[]
}>()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.blog-breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: $spacing-2;
  font-size: $font-size-sm;

  &__link {
    color: $color-gray-500;
    text-decoration: none;

    &:hover {
      color: $color-gray-900;
      text-decoration: none;
    }
  }

  &__current {
    color: $color-gray-500;
  }

  &__sep {
    color: $color-gray-300;
  }
}
</style>

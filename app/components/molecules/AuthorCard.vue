<template>
  <aside class="author-card">
    <div class="author-card__avatar" aria-hidden="true">{{ initials }}</div>
    <div class="author-card__body">
      <p class="author-card__name">{{ name }}</p>
      <p class="author-card__role">{{ $t('docs.author.role') }}</p>
      <nav class="author-card__links">
        <NuxtLink :to="localePath({ name: 'a-propos' })" class="author-card__link">{{ $t('docs.author.about') }}</NuxtLink>
        <a v-for="link in socialLinks" :key="link.href" :href="link.href" class="author-card__link" target="_blank" rel="noopener noreferrer">{{ link.label }}</a>
      </nav>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { AUTHOR, AUTHOR_SAME_AS } from '~~/shared/utils/author'

const localePath = useLocalePath()

const name = AUTHOR.name
const initials = AUTHOR.initials

// Libellé dérivé du domaine (linkedin.com → LinkedIn) — pas de wording à traduire (noms de marque).
const socialLinks = computed(() => AUTHOR_SAME_AS.map((href) => {
  const host = href.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] ?? href
  const brand = host.split('.')[0] ?? host
  return { href, label: brand.charAt(0).toUpperCase() + brand.slice(1) }
}))
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.author-card {
  display: flex;
  gap: $spacing-4;
  align-items: center;
  margin-top: $spacing-8;
  padding: $spacing-4 $spacing-5;
  border: 1px solid $color-gray-200;
  border-radius: $radius-xl;
  background: $surface-elevated;

  &__avatar {
    width: 52px;
    height: 52px;
    flex: none;
    border-radius: $radius-full;
    display: grid;
    place-items: center;
    font-weight: $font-weight-bold;
    font-size: $font-size-lg;
    color: $color-accent;
    background: rgba($color-accent, 0.12);
  }

  &__name {
    font-weight: $font-weight-semibold;
    font-size: $font-size-base;
    color: $color-gray-900;
    margin: 0;
  }

  &__role {
    font-size: $font-size-xs;
    color: $color-gray-500;
    margin: 2px 0 0;
  }

  &__links {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-3;
    margin-top: $spacing-2;
  }

  &__link {
    font-size: $font-size-xs;
    color: $color-gray-500;
    text-decoration: none;

    &:hover { color: $color-gray-900; }
  }
}
</style>

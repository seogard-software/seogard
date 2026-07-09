<template>
  <div class="error-page">
    <AppLogo size="sm" class="error-page__logo" />
    <p class="error-page__code">{{ error?.statusCode ?? 500 }}</p>
    <h1 class="error-page__title">{{ is404 ? $t('common.errorPage.title404') : $t('common.errorPage.title500') }}</h1>
    <p class="error-page__text">{{ is404 ? $t('common.errorPage.text404') : $t('common.errorPage.text500') }}</p>
    <button class="error-page__btn" @click="goHome">{{ $t('common.errorPage.backHome') }}</button>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'

// Page d'erreur globale (404/500) — traduite par locale (angle mort G du plan i18n :
// sans ce fichier, Nuxt affichait sa page par défaut en anglais).
const { error } = defineProps<{ error: NuxtError }>()

const localePath = useLocalePath()

const is404 = computed(() => error?.statusCode === 404)

function goHome() {
  clearError({ redirect: localePath({ name: 'index' }) })
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-3;
  padding: $spacing-6;
  text-align: center;

  &__logo {
    margin-bottom: $spacing-6;
  }

  &__code {
    font-family: $font-family-mono;
    font-size: $font-size-sm;
    color: $color-gray-400;
    margin: 0;
  }

  &__title {
    font-size: $font-size-3xl;
    letter-spacing: -0.02em;
    margin: 0;
  }

  &__text {
    font-size: $font-size-base;
    color: $color-gray-600;
    margin: 0 0 $spacing-4;
  }

  &__btn {
    background: $color-gray-900;
    color: $color-white;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    padding: $spacing-3 $spacing-5;
    border: none;
    border-radius: $radius-md;
    cursor: pointer;
    transition: background $transition-fast;

    &:hover {
      background: $color-gray-700;
    }
  }
}
</style>

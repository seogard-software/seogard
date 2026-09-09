<template>
  <div class="formations">
    <!-- Hero -->
    <section class="formations__hero">
      <span class="formations__badge">
        <AppIcon name="check" size="sm" />
        {{ $t('landing.formations.hero.badge') }}
      </span>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <h1 class="formations__title" v-html="$t('landing.formations.hero.title')" />
      <p class="formations__subtitle">
        {{ $t('landing.formations.hero.subtitle') }}
      </p>
      <div class="formations__cta">
        <NuxtLink :to="localePath({ name: 'docs-rules' })" class="formations__btn formations__btn--primary">
          {{ $t('landing.formations.hero.ctaPrimary') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'scanner' })" class="formations__btn formations__btn--ghost">
          {{ $t('landing.formations.hero.ctaSecondary') }}
        </NuxtLink>
      </div>
    </section>

    <section class="formations__program">
      <h2 class="formations__section-title">{{ $t('landing.formations.program.title') }}</h2>
      <details class="formations__outline">
        <summary class="formations__summary">
          <span>{{ $t('landing.formations.course.title') }}</span>
          <span class="formations__count">{{ $t('landing.formations.course.metaModules', { count: lessons.length }) }}</span>
          <AppIcon name="chevron-down" size="sm" class="formations__chevron" />
        </summary>
        <p class="formations__program-intro">
          {{ $t('landing.formations.program.intro', { count: lessons.length }) }}
        </p>
        <ul class="formations__topics">
          <li v-for="lesson in lessons" :key="lesson">{{ lesson }}</li>
        </ul>
      </details>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })

interface Lesson { title: string }

const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

// Programme en préparation : les guides et le scanner sont les ressources disponibles.
const lessons = computed(() =>
  (tm('landing.formations.lessons') as Lesson[]).map(lesson => rt(lesson.title)),
)

const ogImage = computed(() => `${appUrl}${locale.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)

useSeoMeta({
  title: t('seo.formations.title'),
  description: t('seo.formations.description'),
  ogTitle: t('seo.formations.ogTitle'),
  ogDescription: t('seo.formations.ogDescription'),
  ogType: 'website',
  ogUrl: `${appUrl}${localePath({ name: 'formations' })}`,
  ogImage,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage,
  twitterTitle: t('seo.formations.twitterTitle'),
  twitterDescription: t('seo.formations.twitterDescription'),
  robots: 'index, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.formations {
  max-width: 960px;
  margin: 0 auto;
  padding: 9rem $spacing-6 $spacing-12;
  display: flex;
  flex-direction: column;
  gap: $spacing-10;

  &__hero {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-5;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-4;
    background: $color-info-bg;
    color: $color-info;
    border-radius: $radius-2xl;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
  }

  &__title {
    font-family: $font-family-heading;
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: $line-height-tight;
    color: $color-gray-900;
    max-width: 22ch;

    :deep(em) {
      font-style: italic;
      color: $color-info;
    }
  }

  &__subtitle {
    font-size: $font-size-lg;
    line-height: $line-height-normal;
    color: $color-gray-600;
    max-width: 60ch;
  }

  &__cta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-3;
    justify-content: center;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    padding: $spacing-3 $spacing-6;
    border-radius: $radius-lg;
    font-weight: $font-weight-semibold;
    font-size: $font-size-base;
    transition: opacity 0.15s ease;

    &--primary {
      background: $color-accent;
      color: $color-white;

      &:hover { opacity: 0.88; }
    }

    &--ghost {
      background: $color-white;
      color: $color-gray-900;
      border: 1px solid $color-gray-300;

      &:hover { background: $color-gray-50; }
    }
  }

  &__section-title {
    font-family: $font-family-heading;
    font-size: $font-size-2xl;
    color: $color-gray-900;
    text-align: center;
    margin-bottom: $spacing-5;
  }

  &__outline {
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;

    &[open] .formations__chevron { transform: rotate(180deg); }
  }

  &__summary {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-3;
    padding: $spacing-5;
    cursor: pointer;
    list-style: none;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;

    &::-webkit-details-marker { display: none; }
    &:hover { background: $color-gray-50; }
  }

  &__count {
    margin-left: auto;
    font-size: $font-size-sm;
    font-weight: $font-weight-normal;
    color: $color-gray-600;
  }

  &__chevron {
    flex-shrink: 0;
    color: $color-gray-500;
    transition: transform $transition-fast;
  }

  &__program-intro {
    padding: 0 $spacing-5;
    font-size: $font-size-sm;
    line-height: $line-height-normal;
    color: $color-gray-600;
  }

  &__topics {
    margin: $spacing-4 $spacing-5 $spacing-5;
    padding-left: $spacing-5;
    font-size: $font-size-sm;
    line-height: $line-height-normal;
    color: $color-gray-700;

    li + li { margin-top: $spacing-2; }
  }
}
</style>

<template>
  <div class="demo-page">
    <header class="demo-page__hero">
      <NuxtLink :to="localePath({ name: 'scanner' })" class="demo-page__back">
        <span aria-hidden="true">←</span> {{ $t('docs.ssrDemo.back') }}
      </NuxtLink>
      <p class="demo-page__eyebrow"><span aria-hidden="true" />{{ $t('docs.ssrDemo.eyebrow') }}</p>
      <h1>{{ $t('docs.ssrDemo.heroTitle') }}<br><span>{{ $t('docs.ssrDemo.heroAccent') }}</span></h1>
      <p class="demo-page__intro">{{ $t('docs.ssrDemo.heroIntro') }}</p>
    </header>

    <SsrDemo />

    <section id="analyser" class="demo-page__cta" aria-labelledby="demo-cta-title">
      <div>
        <p class="demo-page__eyebrow">{{ $t('docs.ssrDemo.ctaEyebrow') }}</p>
        <h2 id="demo-cta-title">{{ $t('docs.ssrDemo.ctaTitle') }}</h2>
        <p>{{ $t('docs.ssrDemo.ctaIntro') }}</p>
        <NuxtLink :to="localePath({ name: 'outils-monitoring' })" class="demo-page__monitor">{{ $t('docs.ssrDemo.monitorLink') }} <span aria-hidden="true">→</span></NuxtLink>
      </div>
      <div class="demo-page__scan">
        <ScanBar size="hero" source="ssr_demo" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
const absolute = (name: string) => appUrl + localePath({ name })
const ogImage = computed(() => appUrl + (locale.value === 'en' ? '/og-image-en.png' : '/og-image.png'))

useHead(() => ({
  title: t('seo.ssrDemo.title'),
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': t('seo.scanner.jsonld.breadcrumbHome'), 'item': absolute('index') },
        { '@type': 'ListItem', 'position': 2, 'name': t('docs.ssrDemo.back'), 'item': absolute('scanner') },
        { '@type': 'ListItem', 'position': 3, 'name': t('docs.ssrDemo.eyebrow'), 'item': absolute('demo-ssr') },
      ],
    }),
  }],
}))
useSeoMeta({
  description: () => t('seo.ssrDemo.description'),
  ogTitle: () => t('seo.ssrDemo.title'),
  ogDescription: () => t('seo.ssrDemo.description'),
  ogType: 'website',
  ogUrl: () => absolute('demo-ssr'),
  ogImage: () => ogImage.value,
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('seo.ssrDemo.title'),
  twitterDescription: () => t('seo.ssrDemo.description'),
  twitterImage: () => ogImage.value,
  robots: 'index, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.demo-page {
  max-width: 1160px;
  margin: 0 auto;
  padding: 112px 28px 72px;

  &__hero { max-width: 900px; margin: 0 auto 36px; text-align: center; }
  &__back { display: inline-flex; align-items: center; gap: $spacing-2; margin-bottom: 28px; font-size: $font-size-sm; color: $color-gray-600; text-decoration: none; }
  &__back:hover { color: $color-info; text-decoration: underline; }
  &__eyebrow { display: flex; align-items: center; justify-content: center; gap: $spacing-2; font-size: 12px; color: $color-info; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: $spacing-4; }
  &__eyebrow > span { width: 7px; height: 7px; background: $color-info; border-radius: 50%; box-shadow: 0 0 0 5px $color-info-bg; margin-right: 4px; }
  h1 { font-size: clamp(36px, 4.6vw, 60px); line-height: 1.04; letter-spacing: -0.045em; color: $color-gray-900; }
  h1 > span { color: $color-info; }
  &__intro { max-width: 650px; margin: 22px auto 0; color: $color-gray-600; font-size: 18px; line-height: 1.55; text-wrap: pretty; }
  &__cta {
    scroll-margin-top: 7rem;
    display: grid; grid-template-columns: 1fr 1.1fr; align-items: center; gap: 40px;
    margin-top: 40px; padding: 40px;
    background: $color-white; border: 1px solid $color-gray-200; border-radius: 24px;
  }
  &__cta &__eyebrow { justify-content: flex-start; margin-bottom: 12px; }
  h2 { font-size: clamp(28px, 3vw, 36px); line-height: 1.1; letter-spacing: -0.035em; margin-bottom: 12px; }
  &__cta p:not(.demo-page__eyebrow) { color: $color-gray-600; font-size: $font-size-base; line-height: 1.6; max-width: 400px; }
  &__monitor { display: inline-flex; gap: $spacing-2; margin-top: 18px; color: $color-info; font-size: $font-size-sm; text-underline-offset: 4px; }
  &__scan { min-width: 0; }
  a:focus-visible { outline: 3px solid $color-info; outline-offset: 4px; border-radius: 4px; }
  @media (max-width: $breakpoint-md) {
    &__cta { grid-template-columns: 1fr; gap: 24px; padding: 28px; }
  }
  @media (max-width: $breakpoint-sm) {
    padding: 96px 16px 40px;
    &__hero { margin-bottom: 28px; text-align: left; }
    &__back { margin-bottom: 24px; }
    &__eyebrow { justify-content: flex-start; font-size: 10px; }
    h1 { font-size: clamp(32px, 8.8vw, 40px); line-height: 1.08; }
    &__intro { font-size: 16px; margin-top: 18px; }
    &__cta { padding: 24px 20px; margin-top: 28px; border-radius: 20px; }
  }
}
</style>

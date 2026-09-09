<template>
  <div class="outils-page">
    <section class="outils-page__hero">
      <span class="outils-page__badge">
        <AppIcon name="radar" size="sm" />
        {{ $t('landing.outilsMonitoring.hero.badge') }}
      </span>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <h1 class="outils-page__title" v-html="$t('landing.outilsMonitoring.hero.title')" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p class="outils-page__subtitle" v-html="$t('landing.outilsMonitoring.hero.subtitle')" />
      <div class="outils-page__cta">
        <NuxtLink :to="localePath({ name: 'register' })" class="outils-page__btn outils-page__btn--primary">
          {{ $t('landing.outilsMonitoring.hero.ctaPrimary') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'scanner' })" class="outils-page__btn outils-page__btn--ghost">
          {{ $t('landing.outilsMonitoring.hero.ctaSecondary') }}
        </NuxtLink>
      </div>
    </section>

    <section class="outils-page__features">
      <h2 class="outils-page__section-title">{{ $t('landing.outilsMonitoring.features.sectionTitle') }}</h2>
      <ul class="outils-page__grid">
        <li v-for="feature in features" :key="feature.title" class="outils-page__card">
          <AppIcon :name="feature.icon" size="md" class="outils-page__card-icon" />
          <h3 class="outils-page__card-title">{{ feature.title }}</h3>
          <p class="outils-page__card-desc">{{ feature.desc }}</p>
        </li>
      </ul>
    </section>

    <section class="outils-page__final">
      <h2 class="outils-page__final-title">{{ $t('landing.outilsMonitoring.final.title') }}</h2>
      <p class="outils-page__final-desc">
        {{ $t('landing.outilsMonitoring.final.desc', { price: cloudPriceDisplay }) }}
      </p>
      <NuxtLink :to="localePath({ name: 'register' })" class="outils-page__btn outils-page__btn--primary">
        {{ $t('landing.outilsMonitoring.final.cta') }}
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { IconName } from '~/composables/useIcons'
import { formatCloudPrice } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })
// Slug EN traduit (cf. LOCALIZED_PATHS, shared/utils/i18n.ts) — garder synchro.
defineI18nRoute({ paths: { fr: '/outils/monitoring', en: '/tools/monitoring' } })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
const ogImage = computed(() => `${appUrl}${locale.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)

const cloudPriceDisplay = formatCloudPrice(locale.value)

const features: { title: string, desc: string, icon: IconName }[] = [
  { title: t('landing.outilsMonitoring.features.feature1Title'), desc: t('landing.outilsMonitoring.features.feature1Desc'), icon: 'code' },
  { title: t('landing.outilsMonitoring.features.feature2Title'), desc: t('landing.outilsMonitoring.features.feature2Desc'), icon: 'shield-check' },
  { title: t('landing.outilsMonitoring.features.feature3Title'), desc: t('landing.outilsMonitoring.features.feature3Desc'), icon: 'bell' },
  { title: t('landing.outilsMonitoring.features.feature4Title'), desc: t('landing.outilsMonitoring.features.feature4Desc'), icon: 'activity' },
]

useSeoMeta({
  title: t('seo.outilsMonitoring.title'),
  description: t('seo.outilsMonitoring.description'),
  ogTitle: t('seo.outilsMonitoring.ogTitle'),
  ogDescription: t('seo.outilsMonitoring.ogDescription'),
  ogType: 'website',
  ogUrl: () => `${appUrl}${localePath({ name: 'outils-monitoring' })}`,
  ogImage,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage,
  twitterTitle: t('seo.outilsMonitoring.twitterTitle'),
  twitterDescription: t('seo.outilsMonitoring.twitterDescription'),
  robots: 'index, follow',
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      'inLanguage': locale.value,
      'name': t('seo.outilsMonitoring.jsonld.name'),
      'serviceType': t('seo.outilsMonitoring.jsonld.serviceType'),
      'description': t('seo.outilsMonitoring.jsonld.description'),
      'provider': { '@type': 'Organization', 'name': 'Seogard', 'url': `${appUrl}${localePath({ name: 'index' })}` },
      'areaServed': 'FR',
    }),
  }],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/outils-page';
@use '~/assets/styles/variables' as *;

.outils-page {
  gap: $spacing-10;

  &__title { max-width: 22ch; }
  &__grid { margin-top: $spacing-6; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  &__final { padding: $spacing-8 $spacing-6; }
}

@media (max-width: 640px) {
  .outils-page__grid { grid-template-columns: minmax(0, 1fr); }
}
</style>

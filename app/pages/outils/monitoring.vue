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

    <section class="outils-page__steps">
      <h2 class="outils-page__section-title">{{ $t('landing.outilsMonitoring.steps.sectionTitle') }}</h2>
      <ol class="outils-page__steps-list">
        <li v-for="(step, i) in steps" :key="step" class="outils-page__step">
          <span class="outils-page__step-num">{{ i + 1 }}</span>
          <span class="outils-page__step-text">{{ step }}</span>
        </li>
      </ol>
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

const cloudPriceDisplay = formatCloudPrice(locale.value)

const features: { title: string, desc: string, icon: IconName }[] = [
  { title: t('landing.outilsMonitoring.features.feature1Title'), desc: t('landing.outilsMonitoring.features.feature1Desc'), icon: 'code' },
  { title: t('landing.outilsMonitoring.features.feature2Title'), desc: t('landing.outilsMonitoring.features.feature2Desc'), icon: 'shield-check' },
  { title: t('landing.outilsMonitoring.features.feature3Title'), desc: t('landing.outilsMonitoring.features.feature3Desc'), icon: 'bell' },
  { title: t('landing.outilsMonitoring.features.feature4Title'), desc: t('landing.outilsMonitoring.features.feature4Desc'), icon: 'activity' },
  { title: t('landing.outilsMonitoring.features.feature5Title'), desc: t('landing.outilsMonitoring.features.feature5Desc'), icon: 'zap' },
  { title: t('landing.outilsMonitoring.features.feature6Title'), desc: t('landing.outilsMonitoring.features.feature6Desc'), icon: 'folder' },
]

const steps = [
  t('landing.outilsMonitoring.steps.step1'),
  t('landing.outilsMonitoring.steps.step2'),
  t('landing.outilsMonitoring.steps.step3'),
]

useSeoMeta({
  title: t('seo.outilsMonitoring.title'),
  description: t('seo.outilsMonitoring.description'),
  ogTitle: t('seo.outilsMonitoring.ogTitle'),
  ogDescription: t('seo.outilsMonitoring.ogDescription'),
  ogType: 'website',
  ogUrl: 'https://seogard.io/fr/outils/monitoring',
  ogImage: 'https://seogard.io/og-image.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://seogard.io/og-image.png',
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
      'provider': { '@type': 'Organization', 'name': 'Seogard', 'url': 'https://seogard.io/fr' },
      'areaServed': 'FR',
    }),
  }],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/outils-page';
</style>

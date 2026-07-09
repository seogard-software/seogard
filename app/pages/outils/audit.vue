<template>
  <div class="outils-page">
    <section class="outils-page__hero">
      <span class="outils-page__badge">
        <AppIcon name="shield-check" size="sm" />
        {{ $t('landing.outilsAudit.hero.badge') }}
      </span>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <h1 class="outils-page__title" v-html="$t('landing.outilsAudit.hero.title')" />
      <p class="outils-page__subtitle">
        {{ $t('landing.outilsAudit.hero.subtitle', { count: RULES_COUNT }) }}
      </p>
      <div class="outils-page__cta">
        <NuxtLink :to="localePath({ name: 'scanner' })" class="outils-page__btn outils-page__btn--primary">
          {{ $t('landing.outilsAudit.hero.ctaPrimary') }}
        </NuxtLink>
        <NuxtLink :to="localePath({ name: 'register' })" class="outils-page__btn outils-page__btn--ghost">
          {{ $t('landing.outilsAudit.hero.ctaSecondary') }}
        </NuxtLink>
      </div>
    </section>

    <section class="outils-page__features">
      <h2 class="outils-page__section-title">{{ $t('landing.outilsAudit.features.sectionTitle') }}</h2>
      <ul class="outils-page__grid">
        <li v-for="feature in features" :key="feature.title" class="outils-page__card">
          <AppIcon :name="feature.icon" size="md" class="outils-page__card-icon" />
          <h3 class="outils-page__card-title">{{ feature.title }}</h3>
          <p class="outils-page__card-desc">{{ feature.desc }}</p>
        </li>
      </ul>
    </section>

    <section class="outils-page__steps">
      <h2 class="outils-page__section-title">{{ $t('landing.outilsAudit.steps.sectionTitle') }}</h2>
      <ol class="outils-page__steps-list">
        <li v-for="(step, i) in steps" :key="step" class="outils-page__step">
          <span class="outils-page__step-num">{{ i + 1 }}</span>
          <span class="outils-page__step-text">{{ step }}</span>
        </li>
      </ol>
    </section>

    <section class="outils-page__final">
      <h2 class="outils-page__final-title">{{ $t('landing.outilsAudit.final.title') }}</h2>
      <p class="outils-page__final-desc">
        {{ $t('landing.outilsAudit.final.desc', { price: cloudPriceDisplay }) }}
      </p>
      <NuxtLink :to="localePath({ name: 'scanner' })" class="outils-page__btn outils-page__btn--primary">
        {{ $t('landing.outilsAudit.final.cta') }}
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RULES_COUNT } from '~~/shared/utils/rules-list'
import type { IconName } from '~/composables/useIcons'
import { formatCloudPrice } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })
// Slug EN traduit (cf. LOCALIZED_PATHS, shared/utils/i18n.ts) — garder synchro.
defineI18nRoute({ paths: { fr: '/outils/audit', en: '/tools/audit' } })

const { t, locale } = useI18n()
const localePath = useLocalePath()

const cloudPriceDisplay = formatCloudPrice(locale.value)

const features: { title: string, desc: string, icon: IconName }[] = [
  { title: t('landing.outilsAudit.features.feature1Title', { count: RULES_COUNT }), desc: t('landing.outilsAudit.features.feature1Desc'), icon: 'shield-check' },
  { title: t('landing.outilsAudit.features.feature2Title'), desc: t('landing.outilsAudit.features.feature2Desc'), icon: 'code' },
  { title: t('landing.outilsAudit.features.feature3Title'), desc: t('landing.outilsAudit.features.feature3Desc'), icon: 'file' },
  { title: t('landing.outilsAudit.features.feature4Title'), desc: t('landing.outilsAudit.features.feature4Desc'), icon: 'zap' },
  { title: t('landing.outilsAudit.features.feature5Title'), desc: t('landing.outilsAudit.features.feature5Desc'), icon: 'help-circle' },
  { title: t('landing.outilsAudit.features.feature6Title'), desc: t('landing.outilsAudit.features.feature6Desc'), icon: 'chart-bar' },
]

const steps = [
  t('landing.outilsAudit.steps.step1', { count: RULES_COUNT }),
  t('landing.outilsAudit.steps.step2'),
  t('landing.outilsAudit.steps.step3'),
]

useSeoMeta({
  title: t('seo.outilsAudit.title'),
  description: t('seo.outilsAudit.description', { count: RULES_COUNT }),
  ogTitle: t('seo.outilsAudit.ogTitle'),
  ogDescription: t('seo.outilsAudit.ogDescription', { count: RULES_COUNT }),
  ogType: 'website',
  ogUrl: 'https://seogard.io/fr/outils/audit',
  ogImage: 'https://seogard.io/og-image.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://seogard.io/og-image.png',
  twitterTitle: t('seo.outilsAudit.twitterTitle'),
  twitterDescription: t('seo.outilsAudit.twitterDescription', { count: RULES_COUNT }),
  robots: 'index, follow',
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      'inLanguage': locale.value,
      'name': t('seo.outilsAudit.jsonld.name'),
      'serviceType': t('seo.outilsAudit.jsonld.serviceType'),
      'description': t('seo.outilsAudit.jsonld.description', { count: RULES_COUNT }),
      'provider': { '@type': 'Organization', 'name': 'Seogard', 'url': 'https://seogard.io/fr' },
      'areaServed': 'FR',
    }),
  }],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/outils-page';
</style>

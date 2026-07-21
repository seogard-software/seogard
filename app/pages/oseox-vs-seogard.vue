<template>
  <div class="compare-page">
    <!-- Hero -->
    <section class="compare-page__hero">
      <span class="compare-page__badge">{{ $t('compare.vsSeogard.badge') }}</span>
      <h1 class="compare-page__title">{{ $t('compare.vsSeogard.h1') }}</h1>
      <p class="compare-page__tldr">{{ $t('compare.vsSeogard.tldr') }}</p>
      <div class="compare-page__scan">
        <ScanBar size="hero" source="oseox" />
      </div>
    </section>

    <div class="compare-page__body">
      <!-- Positionnement -->
      <section class="compare-page__block">
        <h2 class="compare-page__h2">{{ $t('compare.vsSeogard.positioning.title') }}</h2>
        <p class="compare-page__p"><strong>Oseox.</strong> {{ $t('compare.vsSeogard.positioning.oseox') }}</p>
        <p class="compare-page__p"><strong>Seogard.</strong> {{ $t('compare.vsSeogard.positioning.seogard') }}</p>
      </section>

      <!-- Tableau -->
      <section class="compare-page__block">
        <h2 class="compare-page__h2">{{ $t('compare.table.heading') }}</h2>
        <CompareTable />
        <p class="compare-page__datanote">{{ $t('compare.dataNote') }}</p>
      </section>

      <!-- Différence JS (verbatim sourcé) -->
      <section class="compare-page__block">
        <h2 class="compare-page__h2">{{ $t('compare.vsSeogard.jsDiff.title') }}</h2>
        <p class="compare-page__p">{{ $t('compare.vsSeogard.jsDiff.text') }}</p>
        <blockquote class="compare-page__quote">
          &laquo;&nbsp;{{ $t('compare.vsSeogard.jsDiff.verbatim') }}&nbsp;&raquo;
          <cite class="compare-page__quote-src">{{ $t('compare.vsSeogard.jsDiff.verbatimSource') }}</cite>
        </blockquote>
      </section>

      <!-- Prix -->
      <section class="compare-page__block">
        <h2 class="compare-page__h2">{{ $t('compare.vsSeogard.pricingNote.title') }}</h2>
        <p class="compare-page__p">{{ $t('compare.vsSeogard.pricingNote.text') }}</p>
      </section>

      <!-- Lequel choisir -->
      <section class="compare-page__block compare-page__block--callout">
        <h2 class="compare-page__h2">{{ $t('compare.vsSeogard.choose.title') }}</h2>
        <p class="compare-page__p">{{ $t('compare.vsSeogard.choose.text') }}</p>
        <p class="compare-page__crosslink">
          <NuxtLink :to="localePath({ name: 'alternative-oseox' })">{{ $t('compare.links.altAnchor') }}</NuxtLink>
          <span aria-hidden="true"> · </span>
          <NuxtLink :to="localePath({ name: 'outils-monitoring' })">{{ $t('compare.links.monitoringAnchor') }}</NuxtLink>
        </p>
      </section>
    </div>

    <!-- CTA final -->
    <section class="compare-page__cta">
      <h2 class="compare-page__cta-title">{{ $t('compare.vsSeogard.cta.title') }}</h2>
      <p class="compare-page__cta-text">{{ $t('compare.vsSeogard.cta.text') }}</p>
      <div class="compare-page__scan">
        <ScanBar size="hero" source="oseox" />
      </div>
      <p class="compare-page__cta-self">
        <i18n-t keypath="compare.vsSeogard.cta.selfHosted" scope="global" tag="span">
          <template #link>
            <NuxtLink :to="localePath({ name: 'docs-self-hosted' })">{{ $t('compare.links.selfHostedAnchor') }}</NuxtLink>
          </template>
        </i18n-t>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })
// Slug identique FR/EN (noms propres) — le préfixe /fr /en les distingue.
defineI18nRoute({ paths: { fr: '/oseox-vs-seogard', en: '/oseox-vs-seogard' } })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

useSeoMeta({
  title: t('compare.vsSeogard.seo.title'),
  description: t('compare.vsSeogard.seo.description'),
  ogTitle: t('compare.vsSeogard.seo.ogTitle'),
  ogDescription: t('compare.vsSeogard.seo.ogDescription'),
  ogType: 'website',
  ogImage: `${appUrl}/og-image.png`,
  twitterCard: 'summary_large_image',
  twitterTitle: t('compare.vsSeogard.seo.twitterTitle'),
  twitterDescription: t('compare.vsSeogard.seo.twitterDescription'),
  twitterImage: `${appUrl}/og-image.png`,
  robots: 'index, follow',
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Seogard', 'item': `${appUrl}/${locale.value}` },
        { '@type': 'ListItem', 'position': 2, 'name': t('compare.vsSeogard.h1') },
      ],
    }),
  }],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/compare-page';
</style>

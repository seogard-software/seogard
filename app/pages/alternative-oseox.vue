<template>
  <div class="compare-page">
    <!-- Hero -->
    <section class="compare-page__hero">
      <span class="compare-page__badge">{{ $t('compare.alternativeOseox.badge') }}</span>
      <h1 class="compare-page__title">{{ $t('compare.alternativeOseox.h1') }}</h1>
      <p class="compare-page__tldr">{{ $t('compare.alternativeOseox.tldr') }}</p>
      <div class="compare-page__scan">
        <ScanBar size="hero" source="oseox" />
      </div>
    </section>

    <div class="compare-page__body">
      <!-- Déjà Oseox ? (objection-handling) -->
      <section class="compare-page__block">
        <h2 class="compare-page__h2">{{ $t('compare.alternativeOseox.already.title') }}</h2>
        <p class="compare-page__p">{{ $t('compare.alternativeOseox.already.p1') }}</p>
        <p class="compare-page__p">{{ $t('compare.alternativeOseox.already.p2') }}</p>
        <p class="compare-page__p">{{ $t('compare.alternativeOseox.already.p3') }}</p>
      </section>

      <!-- Stack JS -->
      <section class="compare-page__block">
        <h2 class="compare-page__h2">{{ $t('compare.alternativeOseox.stack.title') }}</h2>
        <p class="compare-page__story">{{ $t('compare.alternativeOseox.stack.story') }}</p>
        <p class="compare-page__p">{{ $t('compare.alternativeOseox.stack.tech') }}</p>
      </section>

      <!-- Tableau comparatif -->
      <section class="compare-page__block">
        <h2 class="compare-page__h2">{{ $t('compare.table.heading') }}</h2>
        <CompareTable />
        <p class="compare-page__datanote">{{ $t('compare.dataNote') }}</p>
      </section>

      <!-- Complément -->
      <section class="compare-page__block compare-page__block--callout">
        <h2 class="compare-page__h2">{{ $t('compare.alternativeOseox.complement.title') }}</h2>
        <p class="compare-page__p">{{ $t('compare.alternativeOseox.complement.text') }}</p>
        <p class="compare-page__crosslink">
          <NuxtLink :to="localePath({ name: 'oseox-vs-seogard' })">{{ $t('compare.links.vsAnchor') }}</NuxtLink>
          <span aria-hidden="true"> · </span>
          <NuxtLink :to="localePath({ name: 'outils-monitoring' })">{{ $t('compare.links.monitoringAnchor') }}</NuxtLink>
        </p>
      </section>

      <!-- FAQ -->
      <section class="compare-page__block">
        <h2 class="compare-page__h2">{{ $t('compare.alternativeOseox.faq.heading') }}</h2>
        <div v-for="(item, i) in faq" :key="i" class="compare-page__faq">
          <h3 class="compare-page__faq-q">{{ item.q }}</h3>
          <p class="compare-page__faq-a">{{ item.a }}</p>
        </div>
      </section>
    </div>

    <!-- CTA final -->
    <section class="compare-page__cta">
      <h2 class="compare-page__cta-title">{{ $t('compare.alternativeOseox.cta.title') }}</h2>
      <p class="compare-page__cta-text">{{ $t('compare.alternativeOseox.cta.text') }}</p>
      <div class="compare-page__scan">
        <ScanBar size="hero" source="oseox" />
      </div>
      <p class="compare-page__cta-self">
        <i18n-t keypath="compare.alternativeOseox.cta.selfHosted" scope="global" tag="span">
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
// Slug EN traduit (cf. LOCALIZED_PATHS, shared/utils/i18n.ts) — garder synchro.
defineI18nRoute({ paths: { fr: '/alternative-oseox', en: '/oseox-alternative' } })

const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

// tm() renvoie les messages bruts d'un tableau ; rt() les résout. `any` justifié : l'API tm de
// vue-i18n n'expose pas le type des objets de tableau localisés (même pattern que legal/cookies.vue).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const faq = computed(() => (tm('compare.alternativeOseox.faq.items') as any[]).map(item => ({
  q: rt(item.q),
  a: rt(item.a),
})))

useSeoMeta({
  title: t('compare.alternativeOseox.seo.title'),
  description: t('compare.alternativeOseox.seo.description'),
  ogTitle: t('compare.alternativeOseox.seo.ogTitle'),
  ogDescription: t('compare.alternativeOseox.seo.ogDescription'),
  ogType: 'website',
  ogImage: `${appUrl}/og-image.png`,
  twitterCard: 'summary_large_image',
  twitterTitle: t('compare.alternativeOseox.seo.twitterTitle'),
  twitterDescription: t('compare.alternativeOseox.seo.twitterDescription'),
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
        { '@type': 'ListItem', 'position': 2, 'name': t('compare.alternativeOseox.h1') },
      ],
    }),
  }],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/compare-page';
</style>

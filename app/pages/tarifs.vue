<template>
  <div class="page-tarifs">
    <!-- Badge groupé AVEC le tableau dans la même section, mais hardcodé dans la PAGE
         (jamais dans LandingPricing, partagé avec la home) → invisible sur la home. -->
    <section class="page-tarifs__section">
      <div class="page-tarifs__intro">
        <span class="page-tarifs__badge">
          <AppIcon name="check" size="sm" />
          {{ $t('landing.tarifs.badge') }}
        </span>
      </div>
      <LandingPricing />
    </section>

    <section class="page-tarifs__head">
      <h1 class="page-tarifs__title">{{ $t('landing.tarifs.title') }}</h1>
      <p class="page-tarifs__subtitle">
        {{ $t('landing.tarifs.subtitle', { price: cloudPriceDisplay }) }}
      </p>
    </section>

    <!-- Estimateur headless : l'en-tête ci-dessus lui sert de titre unique, pas de doublon. -->
    <section class="page-tarifs__section page-tarifs__section--estimator">
      <LandingEstimator headless />
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatCloudPrice } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })
// Slug EN traduit (cf. LOCALIZED_PATHS, shared/utils/i18n.ts) — garder synchro.
defineI18nRoute({ paths: { fr: '/tarifs', en: '/pricing' } })

const { t, locale } = useI18n()

const cloudPriceDisplay = formatCloudPrice(locale.value)
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
const ogImage = computed(() => `${appUrl}${locale.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)

// L'estimateur alimente estimatedPages ; LandingPricing l'affiche (même wiring que la home).
const estimatedPages = ref<number | null>(null)
provide('estimatedPages', estimatedPages)

useHead({ title: t('seo.tarifs.title') })
useSeoMeta({
  description: t('seo.tarifs.description', { price: cloudPriceDisplay }),
  ogTitle: t('seo.tarifs.ogTitle'),
  ogDescription: t('seo.tarifs.ogDescription', { price: cloudPriceDisplay }),
  ogImage: ogImage.value,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage.value,
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-tarifs {
  display: flex;
  flex-direction: column;
  padding-top: 9rem; // même air sous le header que le hero du scanner (cohérence inter-pages)
  padding-bottom: $spacing-16; // l'estimateur est le dernier bloc : on l'écarte du footer

  // Badge intro propre à la page (hardcodé ici, jamais dans LandingPricing partagé avec la home).
  // Flex explicite : le conteneur .page-tarifs est lui-même en flex column → on centre sans ambiguïté.
  &__intro {
    display: flex;
    justify-content: center;
    padding: 0 $spacing-4;
    margin-bottom: $spacing-3; // rapproche le badge du tableau (sert de lead-in à la section pricing)
  }

  // Le badge sert de lead-in → on réduit fortement le padding-top interne de LandingPricing
  // UNIQUEMENT sur cette page (le composant garde son style d'origine sur la home).
  :deep(.landing-pricing) { padding-top: $spacing-4; }

  &__head {
    text-align: center;
    max-width: 720px;
    margin: 0 auto $spacing-8; // séparé du tableau par les 6rem internes de LandingPricing au-dessus
    padding: 0 $spacing-4;
  }

  // Badge pill : même style que le hero accueil et la page scanner.
  &__badge {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    margin-bottom: $spacing-4;
    padding: $spacing-2 $spacing-4;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    box-shadow: $shadow-sm;
  }

  &__title {
    font-size: $font-size-4xl;
    font-weight: $font-weight-bold;
    line-height: 1.1;
    color: $color-gray-900;
    margin-bottom: $spacing-4;
  }

  &__subtitle {
    color: $color-gray-600;
    font-size: $font-size-lg;
    line-height: 1.6;
  }

  // Estimateur headless (padding retiré) ; LandingPricing apporte ensuite son propre espacement.
  &__section--estimator {
    max-width: 640px;
    width: 100%;
    margin: 0 auto;
    padding: 0 $spacing-4;
  }

  @media (max-width: $breakpoint-md) {
    padding-top: 7rem;

    &__title { font-size: $font-size-3xl; }
  }
}
</style>

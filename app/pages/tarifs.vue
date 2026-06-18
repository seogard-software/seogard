<template>
  <div class="page-tarifs">
    <section class="page-tarifs__head">
      <span class="page-tarifs__eyebrow">Tarifs</span>
      <h1 class="page-tarifs__title">Combien coûte l'audit &amp; le monitoring SEO de votre site ?</h1>
      <p class="page-tarifs__subtitle">
        Entrez l'URL de votre site : on analyse votre sitemap et on vous envoie une estimation au volume.
        Self-hosted gratuit pour toujours, ou Cloud dès {{ cloudPriceDisplay }} €/mois/page.
        Sans engagement, essai 14 jours sans carte bancaire.
      </p>
    </section>

    <!-- Estimateur d'abord (le visiteur a déjà vu le tableau sur la home) ; headless = l'en-tête
         de la page sert de titre unique, pas de doublon. -->
    <section class="page-tarifs__section page-tarifs__section--estimator">
      <LandingEstimator headless />
    </section>

    <section class="page-tarifs__section">
      <LandingPricing />
    </section>
  </div>
</template>

<script setup lang="ts">
import { formatCloudPrice } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })

const cloudPriceDisplay = formatCloudPrice()

// L'estimateur alimente estimatedPages ; LandingPricing l'affiche (même wiring que la home).
const estimatedPages = ref<number | null>(null)
provide('estimatedPages', estimatedPages)

useHead({ title: 'Tarifs' })
useSeoMeta({
  title: 'Tarifs — Seogard',
  description: `Tarifs Seogard : audit & monitoring SEO/GEO en continu. Self-hosted gratuit ou Cloud dès ${cloudPriceDisplay} €/mois/page. Estimez votre tarif selon le nombre de pages monitorées. Sans engagement, essai 14 jours sans carte bancaire.`,
  ogTitle: 'Tarifs — Seogard',
  ogDescription: `Audit & monitoring SEO/GEO en continu. Self-hosted gratuit ou Cloud dès ${cloudPriceDisplay} €/mois/page. Estimez votre tarif au volume.`,
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-tarifs {
  display: flex;
  flex-direction: column;
  padding-top: 8rem; // dégage le header fixe (~68px) + respiration ; bas géré par LandingPricing

  &__head {
    text-align: center;
    max-width: 720px;
    margin: 0 auto $spacing-8; // espace resserré avant l'estimateur
    padding: 0 $spacing-4;
  }

  &__eyebrow {
    display: inline-block;
    margin-bottom: $spacing-3;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-accent;
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
    padding-top: 6.5rem;

    &__title { font-size: $font-size-3xl; }
  }
}
</style>

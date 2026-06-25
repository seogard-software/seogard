<template>
  <div class="outils-page">
    <section class="outils-page__hero">
      <span class="outils-page__badge">
        <AppIcon name="radar" size="sm" />
        Monitoring SEO continu
      </span>
      <h1 class="outils-page__title">
        Détectez les régressions SEO <em>avant</em> Google
      </h1>
      <p class="outils-page__subtitle">
        Seogard surveille votre site en continu et compare le HTML brut (ce que Google et les IA
        indexent) au rendu JavaScript (ce que vous voyez). Dès qu'une meta, un canonical, un
        <code>noindex</code> ou un status code régresse, vous êtes alerté — avant que ça ne coûte
        du trafic.
      </p>
      <div class="outils-page__cta">
        <NuxtLink to="/register" class="outils-page__btn outils-page__btn--primary">
          Tester gratuitement
        </NuxtLink>
        <NuxtLink to="/scanner" class="outils-page__btn outils-page__btn--ghost">
          Scanner mon site
        </NuxtLink>
      </div>
    </section>

    <section class="outils-page__features">
      <h2 class="outils-page__section-title">Ce que le monitoring surveille en continu</h2>
      <ul class="outils-page__grid">
        <li v-for="feature in features" :key="feature.title" class="outils-page__card">
          <AppIcon :name="feature.icon" size="md" class="outils-page__card-icon" />
          <h3 class="outils-page__card-title">{{ feature.title }}</h3>
          <p class="outils-page__card-desc">{{ feature.desc }}</p>
        </li>
      </ul>
    </section>

    <section class="outils-page__steps">
      <h2 class="outils-page__section-title">Comment ça marche</h2>
      <ol class="outils-page__steps-list">
        <li v-for="(step, i) in steps" :key="step" class="outils-page__step">
          <span class="outils-page__step-num">{{ i + 1 }}</span>
          <span class="outils-page__step-text">{{ step }}</span>
        </li>
      </ol>
    </section>

    <section class="outils-page__final">
      <h2 class="outils-page__final-title">Surveillez votre SEO en continu</h2>
      <p class="outils-page__final-desc">
        Self-hosted gratuit pour toujours, ou Cloud dès {{ cloudPriceDisplay }} €/mois/page monitorée.
        Essai 14 jours, sans carte bancaire.
      </p>
      <NuxtLink to="/register" class="outils-page__btn outils-page__btn--primary">
        Démarrer gratuitement
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { IconName } from '~/composables/useIcons'
import { formatCloudPrice } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })

const cloudPriceDisplay = formatCloudPrice()

const features: { title: string, desc: string, icon: IconName }[] = [
  { title: 'HTML brut vs rendu JavaScript', desc: 'La comparaison continue SSR/CSR qui détecte les régressions invisibles quand le SSR casse mais que le navigateur affiche tout normalement.', icon: 'code' },
  { title: 'Metas, canonicals, noindex, status codes', desc: 'Les éléments critiques d\'indexation surveillés à chaque crawl. Une meta qui disparaît ou un noindex ajouté par erreur ? Alerte immédiate.', icon: 'shield-check' },
  { title: 'Alerte instantanée', desc: 'Email dès qu\'une régression apparaît ou se répare. Canal événementiel : on vous écrit uniquement quand quelque chose change.', icon: 'bell' },
  { title: 'Gate CI/CD', desc: 'Bloquez un déploiement régressif avant la mise en prod, avec trois niveaux de strictness par zone.', icon: 'activity' },
  { title: 'Visibilité IA (GEO)', desc: 'llms.txt, crawlers ChatGPT/Perplexity, FAQ et données structurées : on surveille aussi ce que les moteurs génératifs voient de votre site.', icon: 'zap' },
  { title: 'Multi-zone', desc: 'Des règles différentes par section de site : surveillez vos pages critiques (checkout, catégories) plus strictement que le reste.', icon: 'folder' },
]

const steps = [
  'Vous ajoutez votre site : Seogard découvre vos pages et établit une référence (baseline).',
  'À chaque crawl, il compare HTML brut et rendu JavaScript et confronte chaque page à sa référence.',
  'Une régression apparaît ? Vous recevez une alerte et un rapport — avant que Google ne réindexe.',
]

useSeoMeta({
  title: 'Monitoring SEO continu — détectez les régressions avant Google | Seogard',
  description: 'Surveillance SEO continue : Seogard compare le HTML brut (vu par Google et l\'IA) et le rendu JavaScript, détecte les régressions (metas, canonical, noindex, status code) et vous alerte avant Google. Gate CI/CD, multi-zone, GEO.',
  ogTitle: 'Monitoring SEO continu — détectez les régressions avant Google',
  ogDescription: 'Surveillance continue SSR vs CSR, alertes instantanées, gate CI/CD. Détectez les régressions SEO avant Google.',
  ogType: 'website',
  ogUrl: 'https://seogard.io/outils/monitoring',
  ogImage: 'https://seogard.io/og-image.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://seogard.io/og-image.png',
  twitterTitle: 'Monitoring SEO continu — détectez les régressions avant Google',
  twitterDescription: 'Surveillance continue SSR vs CSR, alertes, gate CI/CD. Avant Google.',
  robots: 'index, follow',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://seogard.io/outils/monitoring' }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': 'Monitoring SEO continu — Seogard',
      'serviceType': 'Monitoring de régression SEO et GEO',
      'description': 'Surveillance continue qui compare le HTML brut et le rendu JavaScript pour détecter les régressions SEO avant Google.',
      'provider': { '@type': 'Organization', 'name': 'Seogard', 'url': 'https://seogard.io' },
      'areaServed': 'FR',
    }),
  }],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/outils-page';
</style>

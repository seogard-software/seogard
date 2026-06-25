<template>
  <div class="outils-page">
    <section class="outils-page__hero">
      <span class="outils-page__badge">
        <AppIcon name="shield-check" size="sm" />
        Audit SEO &amp; GEO
      </span>
      <h1 class="outils-page__title">
        L'état de santé <em>complet</em> de votre SEO
      </h1>
      <p class="outils-page__subtitle">
        Seogard scanne votre site contre 65 règles SEO, GEO et performance, et produit un rapport
        « État de santé SEO » clair (Markdown et PDF). Vous voyez exactement ce que Google et les IA
        voient — et vous corrigez sans coder grâce à l'export IA, collable dans ChatGPT ou l'assistant
        de votre CMS.
      </p>
      <div class="outils-page__cta">
        <NuxtLink to="/scanner" class="outils-page__btn outils-page__btn--primary">
          Lancer un scan gratuit
        </NuxtLink>
        <NuxtLink to="/register" class="outils-page__btn outils-page__btn--ghost">
          Créer un compte
        </NuxtLink>
      </div>
    </section>

    <section class="outils-page__features">
      <h2 class="outils-page__section-title">Ce que l'audit analyse</h2>
      <ul class="outils-page__grid">
        <li v-for="feature in features" :key="feature.title" class="outils-page__card">
          <AppIcon :name="feature.icon" size="md" class="outils-page__card-icon" />
          <h3 class="outils-page__card-title">{{ feature.title }}</h3>
          <p class="outils-page__card-desc">{{ feature.desc }}</p>
        </li>
      </ul>
    </section>

    <section class="outils-page__steps">
      <h2 class="outils-page__section-title">De l'audit à la correction</h2>
      <ol class="outils-page__steps-list">
        <li v-for="(step, i) in steps" :key="step" class="outils-page__step">
          <span class="outils-page__step-num">{{ i + 1 }}</span>
          <span class="outils-page__step-text">{{ step }}</span>
        </li>
      </ol>
    </section>

    <section class="outils-page__final">
      <h2 class="outils-page__final-title">Auditez votre site maintenant</h2>
      <p class="outils-page__final-desc">
        Self-hosted gratuit pour toujours, ou Cloud dès {{ cloudPriceDisplay }} €/mois/page monitorée.
        Essai 14 jours, sans carte bancaire.
      </p>
      <NuxtLink to="/scanner" class="outils-page__btn outils-page__btn--primary">
        Scanner mon site gratuitement
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
  { title: '65 règles SEO, GEO & performance', desc: 'Metas, canonicals, indexation, headings, données structurées, hreflang, poids de page… et les règles GEO (llms.txt, crawlers IA, FAQ, signaux de citation).', icon: 'shield-check' },
  { title: 'Comparaison HTML brut vs rendu JS', desc: 'L\'audit révèle ce qui n\'existe que dans le rendu JavaScript et reste invisible pour Google au premier passage et pour les IA.', icon: 'code' },
  { title: 'Rapport « État de santé SEO »', desc: 'Un Markdown exhaustif (toutes les règles + URLs) et un PDF de synthèse métier, figés à chaque crawl et téléchargeables.', icon: 'file' },
  { title: 'Export IA pour corriger sans coder', desc: 'Le rapport lisible par IA se colle dans ChatGPT, Claude ou l\'assistant de votre CMS, qui applique le correctif — même sans être développeur.', icon: 'zap' },
  { title: 'Fiche « Comprendre & corriger »', desc: 'Chaque alerte est documentée : le constat, pourquoi ça compte pour Google et les LLM, et l\'action à mener.', icon: 'help-circle' },
  { title: 'Priorisation par sévérité', desc: 'Les causes racines masquent le bruit : une page en erreur ne génère pas dix alertes « manquant ». Vous voyez l\'essentiel d\'abord.', icon: 'chart-bar' },
]

const steps = [
  'Vous lancez un scan : Seogard crawle vos pages et les confronte aux 65 règles.',
  'Vous recevez le rapport « État de santé SEO » (Markdown + PDF), trié par sévérité.',
  'Vous collez l\'export IA dans votre assistant pour corriger, puis activez le monitoring continu.',
]

useSeoMeta({
  title: 'Audit SEO & GEO — rapport État de santé de votre site | Seogard',
  description: 'Audit SEO et GEO : Seogard scanne votre site contre 65 règles (SEO technique, GEO, performance), compare HTML brut et rendu JavaScript, et produit un rapport État de santé SEO (Markdown + PDF) corrigeable sans coder via l\'export IA.',
  ogTitle: 'Audit SEO & GEO — l\'état de santé complet de votre site',
  ogDescription: 'Scan contre 65 règles SEO/GEO, rapport État de santé (Markdown + PDF), export IA pour corriger sans coder.',
  ogType: 'website',
  ogUrl: 'https://seogard.io/outils/audit',
  ogImage: 'https://seogard.io/og-image.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://seogard.io/og-image.png',
  twitterTitle: 'Audit SEO & GEO — l\'état de santé complet de votre site',
  twitterDescription: 'Scan 65 règles SEO/GEO, rapport État de santé (md + PDF), export IA.',
  robots: 'index, follow',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://seogard.io/outils/audit' }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      'name': 'Audit SEO & GEO — Seogard',
      'serviceType': 'Audit SEO technique et GEO',
      'description': 'Scan d\'un site contre 65 règles SEO, GEO et performance, avec rapport État de santé SEO (Markdown + PDF) et export IA.',
      'provider': { '@type': 'Organization', 'name': 'Seogard', 'url': 'https://seogard.io' },
      'areaServed': 'FR',
    }),
  }],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/outils-page';
</style>

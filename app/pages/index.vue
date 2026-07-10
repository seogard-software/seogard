<template>
  <div class="landing">
    <!-- ═══════ HERO ═══════ -->
    <section id="hero" class="landing__section hero">
      <div class="hero__bg">
        <div class="hero__grid-pattern" />
        <div class="hero__prism" />
        <div class="hero__glow-left" />
        <div class="hero__glow-right" />
      </div>
      <div class="landing__container">
        <div class="hero__badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          {{ $t('landing.index.hero.badge') }}
        </div>
        <h1 class="hero__title">
          {{ $t('landing.index.hero.title') }}<br>
          <span class="hero__title-accent">{{ $t('landing.index.hero.titleAccent') }}</span>
        </h1>
        <p class="hero__subtitle">
          {{ $t('landing.index.hero.subtitle') }}
        </p>
        <div class="hero__scan">
          <ScanBar size="hero" />
        </div>
        <div class="hero__ctas">
          <a :href="demoUrl" target="_blank" rel="noopener" class="hero__cta hero__cta--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            {{ $t('landing.index.hero.ctaDemo') }}
          </a>
          <a href="https://github.com/seogard-software/seogard" target="_blank" rel="noopener" class="hero__cta hero__cta--ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {{ $t('landing.index.hero.ctaDownload') }}
          </a>
          <NuxtLink :to="localePath({ name: 'tarifs' })" class="hero__cta hero__cta--ghost">
            {{ $t('landing.index.hero.ctaPricing') }}
          </NuxtLink>
        </div>
        <p class="hero__no-cc">{{ $t('landing.index.hero.noCc', { price: cloudPriceDisplay }) }}</p>
      </div>
    </section>

    <div class="landing__separator" />

    <!-- ═══════ PROBLEM — storytelling + impact ═══════ -->
    <section id="problem" class="landing__section problem">
      <div class="landing__container">
        <span class="section-label">{{ $t('landing.index.problem.label') }}</span>
        <h2 class="section-title">{{ $t('landing.index.problem.title1') }}<br>{{ $t('landing.index.problem.title2') }}</h2>
        <p class="section-desc problem__story">
          {{ $t('landing.index.problem.story1') }}
          <br><br>
          {{ $t('landing.index.problem.story2') }}
        </p>
        <div class="problem__cards">
          <div class="problem__card">
            <span class="problem__card-value">{{ $t('landing.index.problem.card1Value') }}</span>
            <span class="problem__card-label">{{ $t('landing.index.problem.card1Label') }}</span>
          </div>
          <div class="problem__card">
            <span class="problem__card-value">{{ $t('landing.index.problem.card2Value') }}</span>
            <span class="problem__card-label">{{ $t('landing.index.problem.card2Label') }}</span>
          </div>
          <div class="problem__card problem__card--danger">
            <span class="problem__card-value">{{ $t('landing.index.problem.card3Value') }}</span>
            <span class="problem__card-label">{{ $t('landing.index.problem.card3Label') }}</span>
          </div>
        </div>
        <p class="problem__footer">{{ $t('landing.index.problem.footer') }}</p>
      </div>
    </section>

    <div class="landing__separator" />

    <!-- ═══════ FEATURES — hero + 6-card grid ═══════ -->
    <section id="features" class="landing__section features">
      <div class="landing__container">
        <span class="section-label">{{ $t('landing.index.features.label') }}</span>
        <h2 class="section-title">{{ $t('landing.index.features.title') }}</h2>
        <p class="section-desc">
          {{ $t('landing.index.features.desc', { count: RULES_COUNT }) }}
        </p>

        <!-- Feature hero — SSR vs CSR -->
        <div class="features__hero">
          <div class="features__hero-text">
            <span class="features__hero-badge">{{ $t('landing.index.features.heroBadge') }}</span>
            <h3 class="features__hero-title">{{ $t('landing.index.features.heroTitle') }}</h3>
            <p class="features__hero-desc">
              {{ $t('landing.index.features.heroDesc1') }}
            </p>
            <p class="features__hero-desc">
              {{ $t('landing.index.features.heroDesc2') }}
            </p>
          </div>
          <div class="features__hero-visual">
            <div class="features__hero-panel features__hero-panel--ssr">
              <span class="features__hero-panel-label features__hero-panel-label--danger">{{ $t('landing.index.features.panelSsrLabel') }}</span>
              <pre class="features__hero-code"><code>&lt;title&gt;&lt;/title&gt;
&lt;meta name="description" content=""&gt;
&lt;h1&gt;&lt;/h1&gt;
&lt;div id="app"&gt;&lt;/div&gt;</code></pre>
              <span class="features__hero-verdict features__hero-verdict--danger">{{ $t('landing.index.features.panelSsrVerdict') }}</span>
            </div>
            <div class="features__hero-panel features__hero-panel--csr">
              <span class="features__hero-panel-label features__hero-panel-label--success">{{ $t('landing.index.features.panelCsrLabel') }}</span>
              <pre class="features__hero-code"><code>{{ $t('landing.index.features.panelCsrCode') }}</code></pre>
              <span class="features__hero-verdict features__hero-verdict--success">{{ $t('landing.index.features.panelCsrVerdict') }}</span>
            </div>
          </div>
        </div>

        <!-- Compact feature list -->
        <div class="features__list">
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            <div>
              <strong class="features__item-title">{{ $t('landing.index.features.item1Title') }}</strong>
              <span class="features__item-desc">{{ $t('landing.index.features.item1Desc') }}</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            <div>
              <strong class="features__item-title">{{ $t('landing.index.features.item2Title') }}</strong>
              <span class="features__item-desc">{{ $t('landing.index.features.item2Desc') }}</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <div>
              <strong class="features__item-title">{{ $t('landing.index.features.item3Title') }}</strong>
              <span class="features__item-desc">{{ $t('landing.index.features.item3Desc') }}</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <div>
              <strong class="features__item-title">{{ $t('landing.index.features.item4Title') }}</strong>
              <span class="features__item-desc">{{ $t('landing.index.features.item4Desc') }}</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            <div>
              <strong class="features__item-title">{{ $t('landing.index.features.item5Title') }}</strong>
              <span class="features__item-desc">{{ $t('landing.index.features.item5Desc') }}</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            <div>
              <strong class="features__item-title">{{ $t('landing.index.features.item6Title') }}</strong>
              <span class="features__item-desc">{{ $t('landing.index.features.item6Desc') }}</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
            <div>
              <strong class="features__item-title">{{ $t('landing.index.features.item7Title') }}</strong>
              <span class="features__item-desc">{{ $t('landing.index.features.item7Desc') }}</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            <div>
              <strong class="features__item-title">{{ $t('landing.index.features.item8Title') }}</strong>
              <span class="features__item-desc">{{ $t('landing.index.features.item8Desc') }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="landing__separator" />

    <!-- ═══════ COMPARE — competitor comparison ═══════ -->
    <section id="compare" class="landing__section compare">
      <div class="landing__container">
        <span class="section-label">{{ $t('landing.index.comparison.label') }}</span>
        <h2 class="section-title">{{ $t('landing.index.comparison.title') }}</h2>
        <p class="section-desc">
          {{ $t('landing.index.comparison.desc') }}
        </p>

        <!-- Desktop table -->
        <div class="compare__table-wrapper">
          <table class="compare__table">
            <thead>
              <tr>
                <th class="compare__th compare__th--feature" />
                <th class="compare__th compare__th--seogard">Seogard</th>
                <th class="compare__th">ContentKing</th>
                <th class="compare__th">Lumar</th>
                <th class="compare__th">Botify</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in COMPARISON_ROWS" :key="row.feature" class="compare__row">
                <td class="compare__td compare__td--feature">{{ row.feature }}</td>
                <td class="compare__td compare__td--seogard">
                  <span v-if="row.seogard === true" class="compare__check compare__check--yes">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  <span v-else :class="['compare__text', row.feature.includes('Prix') ? 'compare__text--price' : '']">{{ row.seogard }}</span>
                </td>
                <td v-for="competitor in (['contentking', 'lumar', 'botify'] as const)" :key="competitor" class="compare__td">
                  <span v-if="row[competitor] === true" class="compare__check compare__check--muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  <span v-else-if="row[competitor] === false" class="compare__dash">&mdash;</span>
                  <span v-else class="compare__text compare__text--muted">{{ row[competitor] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile list -->
        <div class="compare__mobile">
          <div v-for="row in COMPARISON_ROWS" :key="row.feature" class="compare__advantage">
            <span class="compare__advantage-check">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </span>
            <div>
              <span class="compare__advantage-title">{{ row.feature }}</span>
              <span v-if="typeof row.seogard === 'string'" class="compare__advantage-detail">{{ row.seogard }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="landing__separator" />

    <!-- ═══════ PRICING — 3 plans (détail + estimateur sur /tarifs) ═══════ -->
    <div id="pricing" class="landing__section">
      <LandingPricing />
      <div class="landing__pricing-cta">
        <NuxtLink :to="localePath({ name: 'tarifs' })" class="hero__cta hero__cta--ghost">
          {{ $t('landing.index.pricing.cta') }}
        </NuxtLink>
      </div>
    </div>

    <div class="landing__separator" />

    <!-- ═══════ FAQ — rendue VISIBLE (le JSON-LD FAQPage doit refléter du contenu affiché) ═══════ -->
    <section id="faq" class="landing__section faq">
      <div class="landing__container">
        <span class="section-label">{{ $t('landing.index.faq.label') }}</span>
        <h2 class="section-title">{{ $t('landing.index.faq.title') }}</h2>
        <div class="faq__list">
          <AppAccordion :items="FAQ_ITEMS" />
        </div>
      </div>
    </section>

    <div class="landing__separator" />

    <!-- ═══════ FINAL CTA ═══════ -->
    <section id="download" class="landing__section final-cta">
      <div class="landing__container">
        <h2 class="final-cta__title">{{ $t('landing.index.finalCta.title1') }}<br>{{ $t('landing.index.finalCta.title2') }}</h2>
        <p class="final-cta__desc">
          {{ $t('landing.index.finalCta.desc') }}
        </p>
        <div class="final-cta__buttons">
          <a :href="demoUrl" target="_blank" rel="noopener" class="hero__cta hero__cta--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            {{ $t('landing.index.hero.ctaDemo') }}
          </a>
          <a href="https://github.com/seogard-software/seogard" target="_blank" rel="noopener" class="hero__cta hero__cta--ghost">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            {{ $t('landing.index.hero.ctaDownload') }}
          </a>
          <NuxtLink to="/register" class="hero__cta hero__cta--ghost">
            {{ $t('landing.index.finalCta.ctaRegister') }}
          </NuxtLink>
        </div>
        <div class="final-cta__trust">
          <span>{{ $t('landing.index.finalCta.trust1') }}</span>
          <span>{{ $t('landing.index.finalCta.trust2') }}</span>
          <span>{{ $t('landing.index.finalCta.trust3') }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RULES_COUNT } from '~~/shared/utils/rules-list'
import { getCloudPricePerPage, formatCloudPrice } from '~~/shared/utils/pricing'
import { buildPersonNode } from '~~/shared/utils/author'

definePageMeta({ layout: 'landing', auth: false })

const { t, locale } = useI18n()
const localePath = useLocalePath()

// URLs absolues localisées pour le head (JSON-LD, og:url) : suivent la locale de la route —
// jamais /fr en dur sur une page /en (sinon Google choisit son propre canonical).
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
function abs(name: string): string {
  return `${appUrl}${localePath({ name })}`
}
// og:image décliné par locale (le texte de l'image est traduit — og-image-en.png).
const ogImage = computed(() => `${appUrl}${locale.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)

const estimatedPages = ref<number | null>(null)
provide('estimatedPages', estimatedPages)

const cloudPriceDisplay = formatCloudPrice(locale.value)
const demoUrl = useRuntimeConfig().public.demoUrl

const FAQ_ITEMS = [
  { q: t('landing.index.faq.q1'), a: t('landing.index.faq.a1', { count: RULES_COUNT }) },
  { q: t('landing.index.faq.q2'), a: t('landing.index.faq.a2') },
  { q: t('landing.index.faq.q3'), a: t('landing.index.faq.a3') },
  { q: t('landing.index.faq.q4'), a: t('landing.index.faq.a4') },
  { q: t('landing.index.faq.q5'), a: t('landing.index.faq.a5', { count: RULES_COUNT }) },
  { q: t('landing.index.faq.q6'), a: t('landing.index.faq.a6') },
  { q: t('landing.index.faq.q7'), a: t('landing.index.faq.a7') },
  { q: t('landing.index.faq.q8'), a: t('landing.index.faq.a8') },
  { q: t('landing.index.faq.q9'), a: t('landing.index.faq.a9') },
  { q: t('landing.index.faq.q10'), a: t('landing.index.faq.a10') },
  { q: t('landing.index.faq.q11'), a: t('landing.index.faq.a11') },
]

const COMPARISON_ROWS = [
  { feature: t('landing.index.comparison.feature1'), seogard: t('landing.index.comparison.valueAuto'), contentking: false, lumar: t('landing.index.comparison.valuePartial'), botify: t('landing.index.comparison.valuePartial') },
  { feature: t('landing.index.comparison.feature2'), seogard: true, contentking: true, lumar: true, botify: true },
  { feature: t('landing.index.comparison.feature3'), seogard: true, contentking: true, lumar: false, botify: false },
  { feature: t('landing.index.comparison.feature4'), seogard: true, contentking: true, lumar: true, botify: true },
  { feature: t('landing.index.comparison.feature5'), seogard: true, contentking: false, lumar: false, botify: false },
  { feature: t('landing.index.comparison.feature6'), seogard: true, contentking: false, lumar: true, botify: false },
  { feature: t('landing.index.comparison.feature7'), seogard: true, contentking: false, lumar: false, botify: false },
  { feature: t('landing.index.comparison.feature8'), seogard: true, contentking: false, lumar: false, botify: false },
  { feature: t('landing.index.comparison.feature9'), seogard: t('landing.index.comparison.valueFree'), contentking: t('landing.index.comparison.valueQuote'), lumar: t('landing.index.comparison.valueLumarPrice'), botify: t('landing.index.comparison.valueBotifyPrice') },
]

useHead({
  title: t('seo.index.title'),
  titleTemplate: '%s',
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            'name': 'Seogard',
            'legalName': 'SAVEPNP',
            'url': abs('index'),
            'logo': ogImage.value,
            'sameAs': ['https://github.com/seogard-software/seogard'],
            'address': {
              '@type': 'PostalAddress',
              'streetAddress': '25 rue Camille Blanc',
              'addressLocality': 'Vitry-sur-Seine',
              'postalCode': '94400',
              'addressCountry': 'FR',
            },
            'vatID': 'FR04912784030',
            'taxID': '912 784 030 00021',
            'foundingDate': '2022-04-25',
            'contactPoint': {
              '@type': 'ContactPoint',
              'email': 'support@seogard.io',
              'contactType': 'customer support',
              'availableLanguage': ['French', 'English'],
            },
            'founder': buildPersonNode(appUrl, { jobTitle: t('about.role'), aboutUrl: abs('a-propos') }),
          },
          {
            '@type': 'SoftwareApplication',
            'name': 'Seogard',
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Web',
            'inLanguage': locale.value,
            'description': t('seo.index.jsonld.appDescription', { price: cloudPriceDisplay }),
            'url': abs('index'),
            'author': { '@type': 'Organization', 'name': 'Seogard', 'legalName': 'SAVEPNP' },
            'publisher': { '@type': 'Organization', 'name': 'Seogard', 'legalName': 'SAVEPNP' },
            'datePublished': '2025-06-01',
            'offers': [
              {
                '@type': 'Offer',
                'name': 'Self-hosted',
                'price': '0',
                'priceCurrency': 'EUR',
                'description': t('seo.index.jsonld.offerSelfHostedDesc'),
              },
              {
                '@type': 'Offer',
                'name': 'Cloud',
                'price': String(getCloudPricePerPage()),
                'priceCurrency': 'EUR',
                'description': t('seo.index.jsonld.offerCloudDesc', { price: cloudPriceDisplay }),
                'unitCode': 'PAGE',
              },
            ],
            'featureList': [
              t('seo.index.jsonld.feature1'),
              t('seo.index.jsonld.feature2'),
              t('seo.index.jsonld.feature3'),
              t('seo.index.jsonld.feature4'),
              t('seo.index.jsonld.feature5'),
              t('seo.index.jsonld.feature6'),
              t('seo.index.jsonld.feature7', { count: RULES_COUNT }),
              t('seo.index.jsonld.feature8'),
              t('seo.index.jsonld.feature9'),
              t('seo.index.jsonld.feature10'),
              'SSO / SAML',
            ],
          },
          {
            '@type': 'ItemList',
            'name': 'Site Navigation',
            // Uniquement des pages réelles indexables (aucune ancre #) → cohérent avec la nav HTML,
            // candidats légitimes aux sitelinks Google.
            'itemListElement': [
              { '@type': 'SiteNavigationElement', 'position': 1, 'name': t('seo.index.jsonld.nav1'), 'url': abs('formations') },
              { '@type': 'SiteNavigationElement', 'position': 2, 'name': t('seo.index.jsonld.nav2'), 'url': abs('outils-monitoring') },
              { '@type': 'SiteNavigationElement', 'position': 3, 'name': t('seo.index.jsonld.nav3'), 'url': abs('outils-audit') },
              { '@type': 'SiteNavigationElement', 'position': 4, 'name': t('seo.index.jsonld.nav4'), 'url': abs('scanner') },
              { '@type': 'SiteNavigationElement', 'position': 5, 'name': t('seo.index.jsonld.nav5'), 'url': abs('tarifs') },
              { '@type': 'SiteNavigationElement', 'position': 6, 'name': t('seo.index.jsonld.nav6'), 'url': abs('docs-rules') },
              { '@type': 'SiteNavigationElement', 'position': 7, 'name': t('seo.index.jsonld.nav7'), 'url': abs('docs-rules') },
              { '@type': 'SiteNavigationElement', 'position': 8, 'name': t('seo.index.jsonld.nav8'), 'url': abs('docs-self-hosted') },
            ],
          },
          {
            '@type': 'FAQPage',
            'mainEntity': FAQ_ITEMS.map(item => ({
              '@type': 'Question',
              'name': item.q,
              'acceptedAnswer': {
                '@type': 'Answer',
                'text': item.a,
              },
            })),
          },
        ],
      }),
    },
  ],
})

useSeoMeta({
  description: t('seo.index.description', { count: RULES_COUNT, price: cloudPriceDisplay }),
  ogTitle: t('seo.index.ogTitle'),
  ogDescription: t('seo.index.ogDescription', { count: RULES_COUNT, price: cloudPriceDisplay }),
  ogType: 'website',
  ogUrl: abs('index'),
  ogImage: ogImage.value,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage.value,
  twitterTitle: t('seo.index.twitterTitle'),
  twitterDescription: t('seo.index.twitterDescription', { count: RULES_COUNT, price: cloudPriceDisplay }),
  robots: 'index, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.landing {
  padding: 80px $spacing-4 0;

  &__container {
    max-width: $container-width;
    margin: 0 auto;
    padding: 0 $spacing-6;
  }

  &__section {
    max-width: $container-width;
    margin: 0 auto;
    background: $color-white;
    border-radius: 16px;
    border: 1px solid $color-gray-200;
  }

  &__pricing-cta {
    display: flex;
    justify-content: center;
    margin-top: -2.5rem; // resserre le gap créé par le padding bas de LandingPricing (6rem)
    padding-bottom: 5rem; // respiration avant le bord bas de la carte
  }

  &__separator {
    max-width: $container-width;
    margin: 0 auto;
    height: 48px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 0;
      border-left: 1px dashed $color-gray-300;
    }
  }
}

// ═══════════════════════════════════════
// SHARED SECTION STYLES
// ═══════════════════════════════════════
.section-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-accent;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: $spacing-4;
  text-align: center;
}

.section-title {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  color: $color-gray-900;
  margin-bottom: $spacing-4;
  letter-spacing: -0.02em;
  text-align: center;
}

.section-desc {
  font-size: $font-size-lg;
  color: $color-gray-500;
  max-width: 600px;
  margin: 0 auto $spacing-12;
  line-height: $line-height-normal;
  text-align: center;
}

// ═══════════════════════════════════════
// HERO
// ═══════════════════════════════════════
.hero {
  position: relative;
  background: $color-white;
  padding: 4rem 0; // symétrique haut/bas (le header reste au-dessus via le padding de .landing)
  text-align: center;
  overflow: hidden;
  min-height: 90vh;
  display: flex;
  align-items: center;

  &__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__grid-pattern {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient($color-gray-200 1px, transparent 1px),
      linear-gradient(90deg, $color-gray-200 1px, transparent 1px);
    background-size: 80px 80px;
    opacity: 0.4;
    mask-image: radial-gradient(ellipse 70% 60% at 50% 55%, black 20%, transparent 70%);
  }

  // Subtle accent glow
  &__prism {
    position: absolute;
    left: 50%;
    top: 58%;
    transform: translate(-50%, -50%);
    width: 900px;
    height: 500px;
    background: radial-gradient(ellipse at center, rgba($color-gray-300, 0.3) 0%, transparent 70%);
    border-radius: 50%;
  }

  // Side glows — very subtle on light
  &__glow-left {
    position: absolute;
    left: -200px;
    top: 40%;
    width: 500px;
    height: 400px;
    background: radial-gradient(circle, rgba($color-gray-200, 0.5) 0%, transparent 70%);
  }

  &__glow-right {
    position: absolute;
    right: -200px;
    top: 35%;
    width: 500px;
    height: 400px;
    background: radial-gradient(circle, rgba($color-gray-200, 0.5) 0%, transparent 70%);
  }

  &__badge {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-4;
    background: $color-gray-100;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    color: $color-gray-600;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    margin-bottom: $spacing-5;
  }

  &__title {
    position: relative;
    font-size: clamp(2.5rem, 5.5vw, 3.75rem);
    font-weight: $font-weight-bold;
    line-height: 1.07;
    margin-bottom: $spacing-5;
    letter-spacing: -0.04em;
    color: $color-gray-900;
  }

  &__title-accent {
    background: linear-gradient(120deg, $color-info, $color-success);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__subtitle {
    position: relative;
    font-size: $font-size-lg;
    color: $color-gray-500;
    max-width: 620px;
    margin: 0 auto $spacing-6;
    line-height: $line-height-normal;
  }

  &__scan {
    position: relative;
    max-width: 560px;
    margin: 0 auto $spacing-6;
  }

  &__ctas {
    position: relative;
    display: flex;
    gap: $spacing-4;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: $spacing-4;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: 0.875rem $spacing-8;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;
    text-decoration: none;
    transition: all $transition-base;

    &--primary {
      background: $color-accent;
      color: $color-white;

      &:hover {
        background: $color-accent-light;
        box-shadow: $shadow-lg;
        text-decoration: none;
      }
    }

    &--ghost {
      background: transparent;
      color: $color-gray-600;
      border: 1px solid $color-gray-300;

      &:hover {
        background: $color-gray-50;
        color: $color-gray-900;
        border-color: $color-gray-400;
        text-decoration: none;
      }
    }
  }

  &__no-cc {
    position: relative;
    font-size: $font-size-sm;
    color: $color-gray-400;
  }
}

// ═══════════════════════════════════════
// COMPARE — competitor table
// ═══════════════════════════════════════
.compare {
  padding: 6rem 0;

  &__table-wrapper {
    max-width: 900px;
    margin: 0 auto;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
  }

  &__th {
    padding: $spacing-4 $spacing-5;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-gray-500;
    background: $surface-elevated;
    text-align: center;
    border-bottom: 1px solid $color-gray-200;

    &--feature {
      width: 35%;
    }

    &--seogard {
      color: $color-gray-900;
      background: $color-gray-50;
    }
  }

  &__row {
    border-bottom: 1px solid $color-gray-200;

    &:last-child {
      border-bottom: none;
    }
  }

  &__td {
    padding: $spacing-4 $spacing-5;
    font-size: $font-size-sm;
    text-align: center;
    color: $color-gray-500;

    &--feature {
      text-align: left;
      font-weight: $font-weight-medium;
      color: $color-gray-800;
    }

    &--seogard {
      background: $color-gray-50;
    }
  }

  &__check {
    display: inline-flex;

    &--yes {
      color: $color-success;
    }

    &--muted {
      color: $color-gray-400;
    }
  }

  &__dash {
    color: $color-gray-300;
    font-size: $font-size-lg;
  }

  &__text {
    font-size: $font-size-sm;

    &--price {
      color: $color-success;
      font-weight: $font-weight-semibold;
    }

    &--muted {
      color: $color-gray-400;
    }
  }

  // Mobile: hide table, show advantage list
  &__mobile {
    display: none;
  }

  &__advantage {
    display: flex;
    align-items: flex-start;
    gap: $spacing-3;
    padding: $spacing-4 0;
    border-bottom: 1px solid $color-gray-200;

    &:last-child {
      border-bottom: none;
    }
  }

  &__advantage-check {
    display: inline-flex;
    color: $color-success;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__advantage-title {
    display: block;
    font-size: $font-size-base;
    font-weight: $font-weight-medium;
    color: $color-gray-900;
  }

  &__advantage-detail {
    display: block;
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin-top: $spacing-1;
  }
}

// ═══════════════════════════════════════
// PROBLEM — impactful cards
// ═══════════════════════════════════════
.problem {
  padding: 6rem 0;

  &__cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-5;
    max-width: 900px;
    margin: 0 auto;
  }

  &__card {
    text-align: center;
    padding: $spacing-8 $spacing-6;
    background: $surface-elevated;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    transition: border-color $transition-base;

    &:hover {
      border-color: $color-gray-300;
    }

    &--danger {
      border-color: rgba($color-danger, 0.2);
    }
  }

  &__card-value {
    display: block;
    font-size: clamp(2rem, 4vw, $font-size-5xl);
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin-bottom: $spacing-2;
    letter-spacing: -0.02em;

    .problem__card--danger & {
      color: $color-danger;
    }
  }

  &__card-label {
    font-size: $font-size-sm;
    color: $color-gray-500;
    line-height: $line-height-normal;
  }

  &__story {
    text-align: left;
    max-width: 700px;
  }

  &__footer {
    text-align: center;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin-top: $spacing-8;
  }
}

// ═══════════════════════════════════════
// FEATURES — 6-card grid
// ═══════════════════════════════════════
.features {
  padding: 6rem 0;

  &__list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-4 $spacing-8;
    max-width: 800px;
    margin: 0 auto;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: $spacing-3;
  }

  &__item-icon {
    flex-shrink: 0;
    color: $color-gray-500;
    margin-top: 2px;
  }

  &__item-title {
    display: block;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin-bottom: 2px;
  }

  &__item-desc {
    display: block;
    font-size: $font-size-xs;
    color: $color-gray-500;
    line-height: $line-height-normal;
  }

  // Feature hero — SSR vs CSR visual
  &__hero {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: $spacing-8;
    align-items: center;
    max-width: 1000px;
    margin: 0 auto $spacing-12;
    padding: $spacing-8;
    background: $surface-elevated;
    border: 1px solid $color-gray-200;
    border-radius: $radius-xl;
  }

  &__hero-badge {
    display: inline-block;
    padding: $spacing-1 $spacing-3;
    background: $color-gray-900;
    color: $color-white;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-4;
  }

  &__hero-title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin-bottom: $spacing-4;
    line-height: $line-height-tight;
  }

  &__hero-desc {
    font-size: $font-size-sm;
    color: $color-gray-500;
    line-height: $line-height-normal;
    margin-bottom: $spacing-3;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__hero-visual {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__hero-panel {
    border-radius: $radius-lg;
    overflow: hidden;
    border: 1px solid $color-gray-200;

    &--ssr {
      border-color: rgba($color-danger, 0.3);
    }

    &--csr {
      border-color: rgba($color-success, 0.3);
    }
  }

  &__hero-panel-label {
    display: block;
    padding: $spacing-2 $spacing-4;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.04em;

    &--danger {
      background: rgba($color-danger, 0.08);
      color: $color-danger;
    }

    &--success {
      background: rgba($color-success, 0.08);
      color: $color-success;
    }
  }

  &__hero-code {
    margin: 0;
    padding: $spacing-4;
    background: $color-gray-900;
    font-size: $font-size-xs;
    line-height: 1.6;
    overflow-x: auto;
    border: none;

    code {
      background: none;
      color: rgba(255, 255, 255, 0.75);
      font-family: $font-family-mono;
      padding: 0;
    }
  }

  &__hero-verdict {
    display: block;
    padding: $spacing-2 $spacing-4;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    text-align: right;

    &--danger {
      background: rgba($color-danger, 0.05);
      color: $color-danger;
    }

    &--success {
      background: rgba($color-success, 0.05);
      color: $color-success;
    }
  }
}

// ═══════════════════════════════════════
// FAQ — visible section (feeds FAQPage JSON-LD)
// ═══════════════════════════════════════
.faq {
  padding: 5rem 0;

  &__list {
    max-width: 760px;
    margin: $spacing-8 auto 0;
  }
}

// ═══════════════════════════════════════
// FINAL CTA — light section
// ═══════════════════════════════════════
.final-cta {
  position: relative;
  padding: 8rem 0;
  text-align: center;
  overflow: hidden;

  &__title {
    font-size: clamp(1.75rem, 3.5vw, 2.75rem);
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin-bottom: $spacing-4;
    letter-spacing: -0.03em;
  }

  &__desc {
    font-size: $font-size-lg;
    color: $color-gray-500;
    margin-bottom: $spacing-8;
  }

  &__buttons {
    display: flex;
    gap: $spacing-4;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: $spacing-6;
  }

  &__trust {
    display: flex;
    gap: $spacing-6;
    justify-content: center;
    flex-wrap: wrap;

    span {
      font-size: $font-size-sm;
      color: $color-gray-500;

      &::before {
        content: '✓ ';
        color: $color-gray-400;
      }
    }
  }
}

// ═══════════════════════════════════════
// RESPONSIVE
// ═══════════════════════════════════════
@media (max-width: $breakpoint-lg) {
  .features__list {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
}

@media (max-width: $breakpoint-md) {
  .hero {
    min-height: auto;
    padding: 8rem 0 4rem;
  }

  .problem__cards {
    grid-template-columns: 1fr;
    max-width: 400px;
  }

  .features__hero {
    grid-template-columns: 1fr;
    padding: $spacing-4;
  }

  .features__hero-visual {
    min-width: 0;
  }

  .features__hero-panel {
    min-width: 0;
  }

  .features__hero-code {
    font-size: 11px;
    overflow-x: auto;
  }

  .compare__table-wrapper {
    display: none;
  }

  .compare__mobile {
    display: block;
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>

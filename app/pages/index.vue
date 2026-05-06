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
          Double analyse HTML brut + rendu JavaScript en continu
        </div>
        <h1 class="hero__title">
          Détectez les régressions SEO<br>
          <span class="hero__title-accent">avant Google.</span>
        </h1>
        <p class="hero__subtitle">
          Seogard compare le HTML brut (ce que Google indexe) et le rendu JavaScript
          (ce que vous voyez). Metas, canonicals, noindex, status codes — et bien plus encore. Alerte instantanée.
        </p>
        <div class="hero__ctas">
          <a href="https://github.com/seogard-software/seogard" target="_blank" rel="noopener" class="hero__cta hero__cta--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Télécharger gratuitement
          </a>
          <a href="#estimator" class="hero__cta hero__cta--primary">
            Estimer mon tarif Cloud
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
          </a>
          <a href="#problem" class="hero__cta hero__cta--ghost">
            Découvrir
          </a>
        </div>
        <p class="hero__no-cc">Self-hosted gratuit, code source disponible (BSL 1.1). Cloud dès {{ cloudPriceDisplay }} €/mois/page. Essai gratuit 14 jours — sans carte bancaire.</p>
      </div>
    </section>

    <div class="landing__separator" />

    <!-- ═══════ PROBLEM — storytelling + impact ═══════ -->
    <section id="problem" class="landing__section problem">
      <div class="landing__container">
        <span class="section-label">Le problème</span>
        <h2 class="section-title">Vous déployez vendredi.<br>Lundi, Google voit une page vide.</h2>
        <p class="section-desc problem__story">
          Vendredi 17h, l'équipe pousse une refonte du header. Dans le navigateur, tout fonctionne.
          Mais côté serveur, le SSR a cassé sur 200 pages produit — les metas ont disparu.
          Google indexe du vide. Personne ne s'en aperçoit.
          <br><br>
          3 semaines plus tard, le trafic organique a chuté de 40%.
        </p>
        <div class="problem__cards">
          <div class="problem__card">
            <span class="problem__card-value">200K</span>
            <span class="problem__card-label">clics perdus — incident réel chez un grand compte français</span>
          </div>
          <div class="problem__card">
            <span class="problem__card-value">160K&euro;</span>
            <span class="problem__card-label">de revenus SEO perdus en une seule régression</span>
          </div>
          <div class="problem__card problem__card--danger">
            <span class="problem__card-value">21 jours</span>
            <span class="problem__card-label">délai moyen de détection sans monitoring automatisé</span>
          </div>
        </div>
        <p class="problem__footer">Avec Seogard, l'alerte serait arrivée vendredi à 17h30.</p>
      </div>
    </section>

    <div class="landing__separator" />

    <!-- ═══════ FEATURES — hero + 6-card grid ═══════ -->
    <section id="features" class="landing__section features">
      <div class="landing__container">
        <span class="section-label">Fonctionnalités</span>
        <h2 class="section-title">Ce que Seogard surveille pour vous</h2>
        <p class="section-desc">
          60+ règles de détection appliquées à chaque page, chaque jour. Alerte instantanée dès qu'une régression apparaît.
        </p>

        <!-- Feature hero — SSR vs CSR -->
        <div class="features__hero">
          <div class="features__hero-text">
            <span class="features__hero-badge">Exclusif</span>
            <h3 class="features__hero-title">Comparaison HTML brut vs rendu JavaScript</h3>
            <p class="features__hero-desc">
              Google indexe le HTML brut envoyé par votre serveur — pas le rendu JavaScript
              que vous voyez dans Chrome. Si votre SSR casse, Google voit une page vide
              alors que tout semble normal dans votre navigateur.
            </p>
            <p class="features__hero-desc">
              Seogard compare automatiquement les deux versions de chaque page,
              en continu, à chaque crawl. Détecte les régressions avant que Google
              ne re-rende vos pages.
            </p>
          </div>
          <div class="features__hero-visual">
            <div class="features__hero-panel features__hero-panel--ssr">
              <span class="features__hero-panel-label features__hero-panel-label--danger">HTML brut — ce que Google voit</span>
              <pre class="features__hero-code"><code>&lt;title&gt;&lt;/title&gt;
&lt;meta name="description" content=""&gt;
&lt;h1&gt;&lt;/h1&gt;
&lt;div id="app"&gt;&lt;/div&gt;</code></pre>
              <span class="features__hero-verdict features__hero-verdict--danger">SSR cassé</span>
            </div>
            <div class="features__hero-panel features__hero-panel--csr">
              <span class="features__hero-panel-label features__hero-panel-label--success">Rendu JS — ce que vous voyez</span>
              <pre class="features__hero-code"><code>&lt;title&gt;Mon Produit&lt;/title&gt;
&lt;meta name="description"
  content="Découvrez notre..."&gt;
&lt;h1&gt;Mon Produit Premium&lt;/h1&gt;
&lt;div id="app"&gt;
  &lt;section&gt;...&lt;/section&gt;
&lt;/div&gt;</code></pre>
              <span class="features__hero-verdict features__hero-verdict--success">Rendu OK</span>
            </div>
          </div>
        </div>

        <!-- Compact feature list -->
        <div class="features__list">
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            <div>
              <strong class="features__item-title">Alertes instantanées</strong>
              <span class="features__item-desc">Email et Slack, diff exact avant/après avec sévérité</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
            <div>
              <strong class="features__item-title">Monitoring quotidien</strong>
              <span class="features__item-desc">Chaque page, chaque jour — SSR + CSR complet</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <div>
              <strong class="features__item-title">Metas, canonicals, noindex</strong>
              <span class="features__item-desc">Title, description, canonical, hreflang, Open Graph</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <div>
              <strong class="features__item-title">Status codes & soft 404</strong>
              <span class="features__item-desc">404, 500, redirections — alerte avant la désindexation</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
            <div>
              <strong class="features__item-title">CI/CD webhook</strong>
              <span class="features__item-desc">Bloquez la mise en prod si une régression SEO est détectée</span>
            </div>
          </div>
          <div class="features__item">
            <svg class="features__item-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
            <div>
              <strong class="features__item-title">Dashboard temps réel</strong>
              <span class="features__item-desc">Tous vos sites, alertes et crawls en un coup d'oeil</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="landing__separator" />

    <!-- ═══════ COMPARE — competitor comparison ═══════ -->
    <section id="compare" class="landing__section compare">
      <div class="landing__container">
        <span class="section-label">Pourquoi Seogard</span>
        <h2 class="section-title">Ce que les autres ne font pas</h2>
        <p class="section-desc">
          L'un des rares outils avec comparaison HTML brut vs rendu JS native, intégration CI/CD et version self-hosted gratuite à code source disponible.
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

    <!-- ═══════ ESTIMATEUR — interactive price estimator ═══════ -->
    <div class="landing__section">
      <LandingEstimator />
    </div>

    <div class="landing__separator" />

    <!-- ═══════ PRICING — 3 plans ═══════ -->
    <div id="pricing" class="landing__section">
      <LandingPricing />
    </div>

    <div class="landing__separator" />

    <!-- ═══════ FINAL CTA ═══════ -->
    <section id="download" class="landing__section final-cta">
      <div class="landing__container">
        <h2 class="final-cta__title">Ne découvrez pas vos régressions SEO<br>3 semaines trop tard.</h2>
        <p class="final-cta__desc">
          Self-hosted gratuit, code source disponible (BSL 1.1). Cloud sans engagement. Premier crawl offert.
        </p>
        <div class="final-cta__buttons">
          <a href="https://github.com/seogard-software/seogard" target="_blank" rel="noopener" class="hero__cta hero__cta--primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Télécharger gratuitement
          </a>
          <NuxtLink to="/register" class="hero__cta hero__cta--ghost">
            Créer un compte Cloud
          </NuxtLink>
        </div>
        <div class="final-cta__trust">
          <span>Code source disponible (BSL 1.1)</span>
          <span>Données exportables</span>
          <span>Sans engagement</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { getCloudPricePerPage, formatCloudPrice } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })

const estimatedPages = ref<number | null>(null)
provide('estimatedPages', estimatedPages)

const cloudPriceDisplay = formatCloudPrice()

const FAQ_ITEMS = [
  {
    q: 'Qu\'est-ce que Seogard surveille exactement ?',
    a: '60+ règles : meta title et description, canonical, noindex accidentel, status codes (404, 500, redirections), SSR cassé, hreflang, Open Graph, llms.txt, AI crawlers (GPTBot, ClaudeBot, PerplexityBot) et bien plus. Chaque règle est classée par sévérité : critique, warning ou info.',
  },
  {
    q: 'Seogard est-il gratuit ?',
    a: 'La version self-hosted est gratuite, sous licence BSL 1.1 (code source disponible) et sans limite de pages. Vous l\'installez sur votre serveur avec Docker. La version Cloud est facturée à l\'usage pour ceux qui préfèrent ne pas gérer l\'infrastructure.',
  },
  {
    q: 'En quoi Seogard est différent d\'un crawler classique ?',
    a: 'Les crawlers classiques (Screaming Frog, Sitebulb) analysent le HTML brut ou le rendu JavaScript, mais pas les deux simultanément. Seogard compare automatiquement les deux versions de chaque page pour détecter les régressions invisibles, comme un SSR cassé que le navigateur masque.',
  },
  {
    q: 'Comment fonctionnent les alertes ?',
    a: 'Chaque page est crawlée quotidiennement. Dès qu\'un changement est détecté, une alerte avec le diff exact avant/après est envoyée par email, Slack, Teams ou Jira. Chaque alerte inclut la page concernée, la règle déclenchée et le niveau de sévérité.',
  },
  {
    q: 'Comment intégrer Seogard dans un pipeline CI/CD ?',
    a: 'Seogard propose un webhook CI/CD natif. Vous déclenchez un crawl via un appel POST après chaque déploiement. Seogard analyse les pages et retourne un verdict pass/fail. Le niveau de strictness est configurable pour bloquer la mise en production en cas de régression critique.',
  },
  {
    q: 'Combien de pages puis-je surveiller ?',
    a: 'En self-hosted, aucune limite : cela dépend uniquement des ressources de votre serveur. En Cloud, seules les pages réellement crawlées dans le mois sont facturées — relancer un crawl sur les mêmes pages ne coûte rien de plus. Sans engagement ni minimum.',
  },
  {
    q: 'Le crawler respecte-t-il le robots.txt ?',
    a: 'Oui. Seogard-Bot respecte les directives robots.txt et ne surcharge pas vos serveurs. Il s\'identifie avec le User-Agent « Seogard-Bot/1.0 » et utilise une adresse IP fixe unique pour faciliter le whitelisting.',
  },
  {
    q: 'Quelles intégrations sont disponibles ?',
    a: 'Email et Slack nativement, avec le diff avant/après pour chaque alerte. D\'autres intégrations (Teams, Jira) sont également disponibles. Le webhook CI/CD permet aussi de connecter Seogard à n\'importe quel pipeline de déploiement.',
  },
]

const COMPARISON_ROWS = [
  { feature: 'Comparaison HTML brut vs rendu JS', seogard: 'Auto', contentking: false, lumar: 'Partiel', botify: 'Partiel' },
  { feature: 'Rendu JavaScript (navigateur)', seogard: true, contentking: true, lumar: true, botify: true },
  { feature: 'Monitoring 24/7', seogard: true, contentking: true, lumar: false, botify: false },
  { feature: 'Optimisation GEO & visibilité IA', seogard: true, contentking: false, lumar: false, botify: false },
  { feature: 'Crawl on deploy (CI/CD)', seogard: true, contentking: false, lumar: true, botify: false },
  { feature: 'Code source disponible (BSL 1.1)', seogard: true, contentking: false, lumar: false, botify: false },
  { feature: 'Self-hosted gratuit', seogard: true, contentking: false, lumar: false, botify: false },
  { feature: 'Prix', seogard: 'Gratuit', contentking: 'Sur devis', lumar: 'Dès 250 $/mois', botify: 'Dès 500 $/mois' },
]

useHead({
  title: 'Seogard — Monitoring SEO technique | Alerte instantanée',
  titleTemplate: '%s',
  link: [
    { rel: 'canonical', href: 'https://seogard.io' },
  ],
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
            'url': 'https://seogard.io',
            'logo': 'https://seogard.io/og-image.png',
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
          },
          {
            '@type': 'SoftwareApplication',
            'name': 'Seogard',
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'Web',
            'description': `Compare le HTML brut et le rendu JavaScript pour détecter les régressions SEO invisibles. Self-hosted gratuit ou Cloud dès ${cloudPriceDisplay} €/mois/page.`,
            'url': 'https://seogard.io',
            'author': { '@type': 'Organization', 'name': 'Seogard', 'legalName': 'SAVEPNP' },
            'publisher': { '@type': 'Organization', 'name': 'Seogard', 'legalName': 'SAVEPNP' },
            'datePublished': '2025-06-01',
            'offers': [
              {
                '@type': 'Offer',
                'name': 'Self-hosted',
                'price': '0',
                'priceCurrency': 'EUR',
                'description': 'Version self-hosted gratuite, code source complet',
              },
              {
                '@type': 'Offer',
                'name': 'Cloud',
                'price': String(getCloudPricePerPage()),
                'priceCurrency': 'EUR',
                'description': `${cloudPriceDisplay} € par page monitorée par mois, infrastructure gérée`,
                'unitCode': 'PAGE',
              },
            ],
            'featureList': [
              'Comparaison HTML brut vs rendu JavaScript',
              'Monitoring meta et canonicals',
              'Détection noindex accidentels',
              'Alertes instantanées email, Slack, Teams, Jira',
              'Crawl quotidien automatique',
              'Dashboard temps réel',
              '60+ règles de détection SEO et GEO',
              'Optimisation GEO et visibilité IA',
              'Version self-hosted gratuite',
              'CI/CD webhook intégré',
              'SSO / SAML',
            ],
          },
          {
            '@type': 'ItemList',
            'name': 'Site Navigation',
            'itemListElement': [
              { '@type': 'SiteNavigationElement', 'position': 1, 'name': 'Fonctionnalités', 'url': 'https://seogard.io/#features' },
              { '@type': 'SiteNavigationElement', 'position': 2, 'name': 'Tarifs', 'url': 'https://seogard.io/#pricing' },
              { '@type': 'SiteNavigationElement', 'position': 3, 'name': 'Télécharger gratuitement', 'url': 'https://seogard.io/#download' },
              { '@type': 'SiteNavigationElement', 'position': 4, 'name': 'Blog SEO Technique', 'url': 'https://seogard.io/blog' },
              { '@type': 'SiteNavigationElement', 'position': 5, 'name': 'Documentation', 'url': 'https://seogard.io/docs' },
              { '@type': 'SiteNavigationElement', 'position': 6, 'name': 'Règles SEO', 'url': 'https://seogard.io/docs/rules' },
              { '@type': 'SiteNavigationElement', 'position': 7, 'name': 'Self-Hosted', 'url': 'https://seogard.io/docs/self-hosted' },
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
  description: `Monitoring SEO technique : compare HTML brut et rendu JavaScript pour détecter les régressions invisibles. Self-hosted gratuit ou Cloud dès ${cloudPriceDisplay} €/mois/page. 60+ règles SEO et GEO, alerte instantanée.`,
  ogTitle: 'Seogard — Monitoring SEO technique | Alerte instantanée',
  ogDescription: `Self-hosted gratuit ou Cloud dès ${cloudPriceDisplay} €/mois/page. Compare ce que Google voit (HTML brut) et ce que l'utilisateur voit (rendu JS). 60+ règles SEO et GEO, alerte instantanée.`,
  ogType: 'website',
  ogUrl: 'https://seogard.io',
  ogImage: 'https://seogard.io/og-image.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://seogard.io/og-image.png',
  twitterTitle: 'Seogard — Monitoring SEO technique | HTML brut vs rendu JS',
  twitterDescription: `Self-hosted gratuit. Cloud dès ${cloudPriceDisplay} €/mois/page. Détecte les régressions SEO invisibles. Alerte instantanée.`,
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
  padding: 10rem 0 8rem;
  text-align: center;
  overflow: hidden;
  min-height: 100vh;
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
    margin-bottom: $spacing-8;
  }

  &__title {
    position: relative;
    font-size: clamp(3rem, 7vw, 5rem);
    font-weight: $font-weight-bold;
    line-height: 1.05;
    margin-bottom: $spacing-6;
    letter-spacing: -0.04em;
    color: $color-gray-900;
  }

  &__title-accent {
    background: linear-gradient(135deg, #111827, #374151);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__subtitle {
    position: relative;
    font-size: $font-size-xl;
    color: $color-gray-500;
    max-width: 600px;
    margin: 0 auto $spacing-10;
    line-height: $line-height-normal;
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

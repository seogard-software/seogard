<template>
  <div class="scanner">
    <!-- ═══════ HERO ═══════ -->
    <section class="scanner__hero">
      <div class="scanner__hero-bg" aria-hidden="true">
        <div class="scanner__glow scanner__glow--left" />
        <div class="scanner__glow scanner__glow--right" />
      </div>
      <div class="scanner__container scanner__container--narrow">
        <span class="scanner__badge">
          <AppIcon name="search" size="sm" />
          Scan gratuit · sans carte bancaire
        </span>
        <h1 class="scanner__title">
          Le scanner SEO qui voit<br>
          <span class="scanner__title-accent">ce que Google voit vraiment.</span>
        </h1>
        <p class="scanner__subtitle">
          Entrez votre URL. Seogard compare le <strong>HTML brut</strong> — ce que Google et les IA indexent —
          au <strong>rendu JavaScript</strong> que voit votre navigateur, et remonte les régressions invisibles.
          Résultat immédiat sur votre dashboard.
        </p>
        <div class="scanner__bar">
          <ScanBar size="hero" />
        </div>
        <p class="scanner__trust">
          Self-hosted gratuit · Cloud dès {{ cloudPriceDisplay }} €/mois/page · essai 14 jours sans engagement
        </p>
      </div>
    </section>

    <!-- ═══════ DIFFÉRENCIATEUR — HTML brut vs rendu JS ═══════ -->
    <section class="scanner__section">
      <div class="scanner__container">
        <span class="scanner__eyebrow">Le point aveugle des autres outils</span>
        <h2 class="scanner__h2">Votre page est belle dans le navigateur.<br>Mais que lit Google ?</h2>
        <div class="scanner__compare">
          <article class="scanner__pane scanner__pane--raw">
            <header class="scanner__pane-head">
              <span class="scanner__pane-tag">HTML brut · ce que Google indexe</span>
            </header>
            <pre class="scanner__code"><span class="scanner__code-ok">&lt;title&gt;Chaussures running&lt;/title&gt;</span>
<span class="scanner__code-bad">&lt;!-- meta description : vide --&gt;</span>
<span class="scanner__code-bad">&lt;!-- h1 : injecté par JS --&gt;</span>
<span class="scanner__code-bad">&lt;!-- canonical : absent --&gt;</span></pre>
            <p class="scanner__pane-verdict scanner__pane-verdict--bad">Google indexe une page à moitié vide.</p>
          </article>

          <article class="scanner__pane scanner__pane--rendered">
            <header class="scanner__pane-head">
              <span class="scanner__pane-tag">Rendu JS · ce que vous voyez</span>
            </header>
            <pre class="scanner__code"><span class="scanner__code-ok">&lt;title&gt;Chaussures running&lt;/title&gt;</span>
<span class="scanner__code-ok">&lt;meta name="description" …&gt;</span>
<span class="scanner__code-ok">&lt;h1&gt;Chaussures running homme&lt;/h1&gt;</span>
<span class="scanner__code-ok">&lt;link rel="canonical" …&gt;</span></pre>
            <p class="scanner__pane-verdict scanner__pane-verdict--ok">Tout est là — dans le navigateur seulement.</p>
          </article>
        </div>
        <p class="scanner__compare-note">
          C'est exactement la fenêtre où un SSR cassé indexe du vide. Oncrawl, Lumar, ContentKing crawlent sans
          comparer en continu les deux. <strong>Seogard, si.</strong>
        </p>
      </div>
    </section>

    <!-- ═══════ ÉTAPES ═══════ -->
    <section class="scanner__section scanner__section--muted">
      <div class="scanner__container">
        <span class="scanner__eyebrow">En 30 secondes</span>
        <h2 class="scanner__h2">Comment ça marche</h2>
        <ol class="scanner__steps">
          <li v-for="(step, i) in steps" :key="step.title" class="scanner__step">
            <span class="scanner__step-num">{{ i + 1 }}</span>
            <h3 class="scanner__step-title">{{ step.title }}</h3>
            <p class="scanner__step-text">{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- ═══════ CE QU'ON ANALYSE ═══════ -->
    <section class="scanner__section">
      <div class="scanner__container">
        <span class="scanner__eyebrow">{{ RULES_COUNT }} règles, vérifiées à chaque crawl</span>
        <h2 class="scanner__h2">Ce que le scan détecte</h2>
        <div class="scanner__checks">
          <article v-for="c in checks" :key="c.title" class="scanner__check">
            <span class="scanner__check-icon"><AppIcon :name="c.icon" size="md" /></span>
            <div>
              <h3 class="scanner__check-title">{{ c.title }}</h3>
              <p class="scanner__check-text">{{ c.text }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ═══════ FAQ ═══════ -->
    <section class="scanner__section scanner__section--muted">
      <div class="scanner__container scanner__container--narrow">
        <h2 class="scanner__h2">Questions fréquentes</h2>
        <div class="scanner__faq">
          <details v-for="item in faq" :key="item.q" class="scanner__faq-item">
            <summary class="scanner__faq-q">{{ item.q }}</summary>
            <p class="scanner__faq-a">{{ item.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- ═══════ CTA FINAL ═══════ -->
    <section class="scanner__cta">
      <div class="scanner__container scanner__container--narrow">
        <h2 class="scanner__cta-title">Lancez votre scan maintenant</h2>
        <p class="scanner__cta-sub">Gratuit, sans carte bancaire. Vous voyez les régressions avant Google.</p>
        <div class="scanner__bar">
          <ScanBar size="hero" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RULES_COUNT } from '~~/shared/utils/rules-catalog'
import { formatCloudPrice } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })

const cloudPriceDisplay = formatCloudPrice()

const steps = [
  { title: 'Entrez votre URL', text: 'Aucune installation, aucune configuration. Juste l\'adresse de votre site.' },
  { title: 'On crawle en double vision', text: 'Seogard lit votre sitemap, récupère le HTML brut et le rendu JavaScript de chaque page, puis les compare.' },
  { title: 'Vos régressions, classées', text: 'Les écarts et erreurs SEO/GEO arrivent sur votre dashboard, triés par sévérité, avec la marche à suivre pour corriger.' },
]

const checks: { icon: IconName, title: string, text: string }[] = [
  { icon: 'code', title: 'Régressions SSR / CSR', text: 'Metas, H1, canonical ou contenu présents dans le navigateur mais absents du HTML brut indexé.' },
  { icon: 'file', title: 'Metas & titles', text: 'Title, meta description, Open Graph manquants, vides ou modifiés sans que vous le sachiez.' },
  { icon: 'shield-check', title: 'Indexabilité', text: 'noindex accidentels, canonicals cassés, robots.txt bloquant Googlebot.' },
  { icon: 'activity', title: 'Status codes', text: '404, 500, soft 404, redirections vers la home, chaînes de redirection.' },
  { icon: 'chart-bar', title: 'Données structurées', text: 'JSON-LD absent, invalide ou injecté uniquement par JavaScript.' },
  { icon: 'radar', title: 'Visibilité IA (GEO)', text: 'llms.txt, blocage des crawlers IA de citation, signaux exploités par ChatGPT et Perplexity.' },
]

const faq = [
  { q: 'Le scan est-il vraiment gratuit ?', a: 'Oui. Le scan démarre un essai de 14 jours sans carte bancaire. Vous pouvez aussi installer Seogard en self-hosted, gratuit pour toujours (code source disponible, BSL 1.1).' },
  { q: 'En quoi c\'est différent de Screaming Frog, Oncrawl ou Lumar ?', a: 'Ces outils crawlent une version de la page. Seogard compare en continu le HTML brut (ce que Google et les IA lisent) et le rendu JavaScript (ce que vous voyez) — la seule façon de détecter un SSR cassé avant qu\'il n\'indexe du vide.' },
  { q: 'Combien de temps pour avoir les résultats ?', a: 'Le crawl démarre dès l\'inscription. Les premières pages et alertes apparaissent en quelques secondes, le scan complet suit selon la taille du site.' },
  { q: 'Dois-je être propriétaire du site ?', a: 'Vous devez être propriétaire du site ou disposer d\'une autorisation pour le crawler. Le scan respecte votre robots.txt.' },
  { q: 'Mon site est protégé par un pare-feu / anti-bot ?', a: 'Certaines protections (Cloudflare strict, BitNinja…) peuvent bloquer notre crawler. Dans ce cas, il suffit d\'autoriser notre IP — la marche à suivre est indiquée sur votre dashboard.' },
]

useHead({
  title: 'Scanner SEO gratuit de votre site',
  link: [{ rel: 'canonical', href: 'https://seogard.io/scanner' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': 'https://seogard.io' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Scanner SEO gratuit', 'item': 'https://seogard.io/scanner' },
            ],
          },
          {
            '@type': 'FAQPage',
            'mainEntity': faq.map(item => ({
              '@type': 'Question',
              'name': item.q,
              'acceptedAnswer': { '@type': 'Answer', 'text': item.a },
            })),
          },
        ],
      }),
    },
  ],
})

useSeoMeta({
  description: `Scannez gratuitement le SEO de votre site : Seogard compare le HTML brut (vu par Google et les IA) et le rendu JavaScript, et détecte les régressions invisibles. Résultat immédiat, sans carte bancaire.`,
  ogTitle: 'Scanner SEO gratuit — voyez votre site comme Google',
  ogDescription: `Comparez HTML brut et rendu JavaScript, détectez les régressions SEO/GEO avant Google. Scan gratuit, sans carte bancaire.`,
  ogType: 'website',
  ogUrl: 'https://seogard.io/scanner',
  ogImage: 'https://seogard.io/og-image.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://seogard.io/og-image.png',
  twitterTitle: 'Scanner SEO gratuit — voyez votre site comme Google',
  twitterDescription: `Comparez HTML brut et rendu JS, détectez les régressions avant Google. Gratuit, sans CB.`,
  robots: 'index, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.scanner {
  &__container {
    max-width: $container-width;
    margin: 0 auto;
    padding: 0 $spacing-6;

    &--narrow { max-width: 760px; }
  }

  // ── HERO ──
  &__hero {
    position: relative;
    overflow: hidden;
    padding: 9rem $spacing-4 $spacing-16;
    text-align: center;
  }

  &__hero-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  &__glow {
    position: absolute;
    width: 420px;
    height: 420px;
    border-radius: $radius-full;
    filter: blur(120px);
    opacity: 0.5;

    &--left { top: -120px; left: -80px; background: rgba($color-info, 0.18); }
    &--right { top: -60px; right: -80px; background: rgba($color-success, 0.14); }
  }

  &__badge {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-4;
    margin-bottom: $spacing-6;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    box-shadow: $shadow-sm;
  }

  &__title {
    position: relative;
    z-index: 1;
    font-size: $font-size-5xl;
    font-weight: $font-weight-bold;
    line-height: $line-height-tight;
    letter-spacing: -0.03em;
    color: $color-gray-900;

    @media (max-width: $breakpoint-sm) { font-size: $font-size-4xl; }
  }

  &__title-accent {
    background: linear-gradient(120deg, $color-info, $color-success);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__subtitle {
    position: relative;
    z-index: 1;
    max-width: 640px;
    margin: $spacing-6 auto 0;
    font-size: $font-size-lg;
    line-height: $line-height-normal;
    color: $color-gray-600;

    strong { color: $color-gray-900; font-weight: $font-weight-semibold; }
  }

  &__bar {
    position: relative;
    z-index: 1;
    max-width: 540px;
    margin: $spacing-8 auto 0;
  }

  &__trust {
    position: relative;
    z-index: 1;
    margin-top: $spacing-5;
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  // ── SECTIONS ──
  &__section {
    padding: $spacing-16 $spacing-4;

    &--muted { background: $surface-elevated; }
  }

  &__eyebrow {
    display: block;
    text-align: center;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $color-info;
    margin-bottom: $spacing-3;
  }

  &__h2 {
    text-align: center;
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    line-height: $line-height-snug;
    letter-spacing: -0.02em;
    color: $color-gray-900;
    margin-bottom: $spacing-10;

    @media (max-width: $breakpoint-sm) { font-size: $font-size-2xl; }
  }

  // ── COMPARE ──
  &__compare {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-5;
    max-width: 880px;
    margin: 0 auto;

    @media (max-width: $breakpoint-sm) { grid-template-columns: 1fr; }
  }

  &__pane {
    border-radius: $radius-2xl;
    border: 1px solid $color-gray-200;
    background: $color-white;
    overflow: hidden;
    box-shadow: $shadow-lg;

    &--raw { border-color: rgba($color-danger, 0.3); }
    &--rendered { border-color: rgba($color-success, 0.3); }
  }

  &__pane-head {
    padding: $spacing-3 $spacing-4;
    border-bottom: 1px solid $color-gray-100;
    background: $surface-elevated;
  }

  &__pane-tag {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-600;
  }

  &__code {
    margin: 0;
    padding: $spacing-4;
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    line-height: 1.9;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__code-ok { color: $color-gray-700; display: block; }
  &__code-bad { color: $color-danger; display: block; }

  &__pane-verdict {
    margin: 0;
    padding: $spacing-3 $spacing-4 $spacing-4;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;

    &--bad { color: $color-danger; }
    &--ok { color: $color-success; }
  }

  &__compare-note {
    max-width: 640px;
    margin: $spacing-8 auto 0;
    text-align: center;
    font-size: $font-size-base;
    line-height: $line-height-normal;
    color: $color-gray-600;

    strong { color: $color-gray-900; }
  }

  // ── STEPS ──
  &__steps {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-6;
    max-width: 920px;
    margin: 0 auto;
    padding: 0;
    list-style: none;
    counter-reset: none;

    @media (max-width: $breakpoint-md) { grid-template-columns: 1fr; }
  }

  &__step {
    padding: $spacing-6;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-xl;
  }

  &__step-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-bottom: $spacing-4;
    font-size: $font-size-base;
    font-weight: $font-weight-bold;
    color: $color-white;
    background: $color-accent;
    border-radius: $radius-full;
  }

  &__step-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin-bottom: $spacing-2;
  }

  &__step-text {
    font-size: $font-size-sm;
    line-height: $line-height-normal;
    color: $color-gray-600;
  }

  // ── CHECKS ──
  &__checks {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-5;
    max-width: 980px;
    margin: 0 auto;

    @media (max-width: $breakpoint-md) { grid-template-columns: 1fr 1fr; }
    @media (max-width: $breakpoint-sm) { grid-template-columns: 1fr; }
  }

  &__check {
    display: flex;
    gap: $spacing-4;
    padding: $spacing-5;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-xl;
    transition: border-color $transition-fast, box-shadow $transition-fast, transform $transition-fast;

    &:hover {
      border-color: $color-gray-300;
      box-shadow: $shadow-lg;
      transform: translateY(-2px);
    }
  }

  &__check-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: $radius-lg;
    background: rgba($color-info, 0.08);
    color: $color-info;
  }

  &__check-title {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin-bottom: $spacing-1;
  }

  &__check-text {
    font-size: $font-size-sm;
    line-height: $line-height-snug;
    color: $color-gray-600;
  }

  // ── FAQ ──
  &__faq {
    border-top: 1px solid $color-gray-200;
  }

  &__faq-item {
    padding: $spacing-5 0;
    border-bottom: 1px solid $color-gray-200;
  }

  &__faq-q {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker { display: none; }
  }

  &__faq-a {
    margin-top: $spacing-3;
    font-size: $font-size-sm;
    line-height: $line-height-normal;
    color: $color-gray-600;
  }

  // ── CTA FINAL (clair : le bouton accent de ScanBar doit rester visible) ──
  &__cta {
    padding: $spacing-16 $spacing-4;
    text-align: center;
    background: linear-gradient(180deg, $surface-elevated, $color-white);
    border-top: 1px solid $color-gray-200;
  }

  &__cta-title {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    letter-spacing: -0.02em;
    color: $color-gray-900;
    margin-bottom: $spacing-3;
  }

  &__cta-sub {
    font-size: $font-size-base;
    color: $color-gray-500;
    margin-bottom: $spacing-8;
  }

  .scanner__cta &__bar { margin-top: 0; }
}
</style>

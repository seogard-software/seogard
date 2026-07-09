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
          {{ $t('landing.scanner.hero.badge') }}
        </span>
        <h1 class="scanner__title">
          {{ $t('landing.scanner.hero.title') }}<br>
          <span class="scanner__title-accent">{{ $t('landing.scanner.hero.titleAccent') }}</span>
        </h1>
        <p class="scanner__subtitle" v-html="$t('landing.scanner.hero.subtitle')" />
        <div class="scanner__bar">
          <ScanBar size="hero" />
        </div>
        <p class="scanner__trust">
          {{ $t('landing.scanner.hero.trust', { price: cloudPriceDisplay }) }}
        </p>
      </div>
    </section>

    <!-- ═══════ DIFFÉRENCIATEUR — HTML brut vs rendu JS ═══════ -->
    <section class="scanner__section">
      <div class="scanner__container">
        <span class="scanner__eyebrow">{{ $t('landing.scanner.compare.eyebrow') }}</span>
        <h2 class="scanner__h2" v-html="$t('landing.scanner.compare.title')" />
        <div class="scanner__compare">
          <article class="scanner__pane scanner__pane--raw">
            <header class="scanner__pane-head">
              <span class="scanner__pane-tag">{{ $t('landing.scanner.compare.rawTag') }}</span>
            </header>
            <pre class="scanner__code"><span class="scanner__code-ok">{{ $t('landing.scanner.compare.rawLine1') }}</span>
<span class="scanner__code-bad">{{ $t('landing.scanner.compare.rawLine2') }}</span>
<span class="scanner__code-bad">{{ $t('landing.scanner.compare.rawLine3') }}</span>
<span class="scanner__code-bad">{{ $t('landing.scanner.compare.rawLine4') }}</span></pre>
            <p class="scanner__pane-verdict scanner__pane-verdict--bad">{{ $t('landing.scanner.compare.rawVerdict') }}</p>
          </article>

          <article class="scanner__pane scanner__pane--rendered">
            <header class="scanner__pane-head">
              <span class="scanner__pane-tag">{{ $t('landing.scanner.compare.renderedTag') }}</span>
            </header>
            <pre class="scanner__code"><span class="scanner__code-ok">{{ $t('landing.scanner.compare.renderedLine1') }}</span>
<span class="scanner__code-ok">{{ $t('landing.scanner.compare.renderedLine2') }}</span>
<span class="scanner__code-ok">{{ $t('landing.scanner.compare.renderedLine3') }}</span>
<span class="scanner__code-ok">{{ $t('landing.scanner.compare.renderedLine4') }}</span></pre>
            <p class="scanner__pane-verdict scanner__pane-verdict--ok">{{ $t('landing.scanner.compare.renderedVerdict') }}</p>
          </article>
        </div>
        <p class="scanner__compare-note" v-html="$t('landing.scanner.compare.note')" />
      </div>
    </section>

    <!-- ═══════ ÉTAPES ═══════ -->
    <section class="scanner__section scanner__section--muted">
      <div class="scanner__container">
        <span class="scanner__eyebrow">{{ $t('landing.scanner.steps.eyebrow') }}</span>
        <h2 class="scanner__h2">{{ $t('landing.scanner.steps.title') }}</h2>
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
        <span class="scanner__eyebrow">{{ $t('landing.scanner.checks.eyebrow', { count: RULES_COUNT }) }}</span>
        <h2 class="scanner__h2">{{ $t('landing.scanner.checks.title') }}</h2>
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
        <h2 class="scanner__h2">{{ $t('landing.scanner.faq.title') }}</h2>
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
        <h2 class="scanner__cta-title">{{ $t('landing.scanner.cta.title') }}</h2>
        <p class="scanner__cta-sub">{{ $t('landing.scanner.cta.subtitle') }}</p>
        <div class="scanner__bar">
          <ScanBar size="hero" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { RULES_COUNT } from '~~/shared/utils/rules-list'
import { formatCloudPrice } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
const abs = (name: string): string => `${appUrl}${localePath({ name })}`
const ogImage = computed(() => `${appUrl}${locale.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)

const cloudPriceDisplay = formatCloudPrice(locale.value)

const steps = [
  { title: t('landing.scanner.steps.step1Title'), text: t('landing.scanner.steps.step1Text') },
  { title: t('landing.scanner.steps.step2Title'), text: t('landing.scanner.steps.step2Text') },
  { title: t('landing.scanner.steps.step3Title'), text: t('landing.scanner.steps.step3Text') },
]

const checks: { icon: IconName, title: string, text: string }[] = [
  { icon: 'code', title: t('landing.scanner.checks.check1Title'), text: t('landing.scanner.checks.check1Text') },
  { icon: 'file', title: t('landing.scanner.checks.check2Title'), text: t('landing.scanner.checks.check2Text') },
  { icon: 'shield-check', title: t('landing.scanner.checks.check3Title'), text: t('landing.scanner.checks.check3Text') },
  { icon: 'activity', title: t('landing.scanner.checks.check4Title'), text: t('landing.scanner.checks.check4Text') },
  { icon: 'chart-bar', title: t('landing.scanner.checks.check5Title'), text: t('landing.scanner.checks.check5Text') },
  { icon: 'radar', title: t('landing.scanner.checks.check6Title'), text: t('landing.scanner.checks.check6Text') },
]

const faq = [
  { q: t('landing.scanner.faq.q1'), a: t('landing.scanner.faq.a1') },
  { q: t('landing.scanner.faq.q2'), a: t('landing.scanner.faq.a2') },
  { q: t('landing.scanner.faq.q3'), a: t('landing.scanner.faq.a3') },
  { q: t('landing.scanner.faq.q4'), a: t('landing.scanner.faq.a4') },
  { q: t('landing.scanner.faq.q5'), a: t('landing.scanner.faq.a5') },
]

useHead({
  title: t('seo.scanner.title'),
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': t('seo.scanner.jsonld.breadcrumbHome'), 'item': abs('index') },
              { '@type': 'ListItem', 'position': 2, 'name': t('seo.scanner.jsonld.breadcrumbScanner'), 'item': abs('scanner') },
            ],
          },
          {
            '@type': 'FAQPage',
            'inLanguage': locale.value,
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
  description: t('seo.scanner.description'),
  ogTitle: t('seo.scanner.ogTitle'),
  ogDescription: t('seo.scanner.ogDescription'),
  ogType: 'website',
  ogUrl: abs('scanner'),
  ogImage: ogImage.value,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage.value,
  twitterTitle: t('seo.scanner.twitterTitle'),
  twitterDescription: t('seo.scanner.twitterDescription'),
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

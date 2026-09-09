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
          <ScanBar size="hero" source="home_hero" />
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

    <section id="features" class="landing__section features">
      <div class="landing__container">
        <h2 class="section-title">{{ $t('landing.index.features.title') }}</h2>
        <div class="features__list">
          <div class="features__item">
            <AppIcon name="code" size="md" class="features__item-icon" />
            <h3 class="features__item-title">{{ $t('landing.index.features.heroTitle') }}</h3>
            <p class="features__item-desc">{{ $t('landing.index.features.heroDesc2') }}</p>
          </div>
          <div class="features__item">
            <AppIcon name="shield-check" size="md" class="features__item-icon" />
            <h3 class="features__item-title">{{ $t('landing.index.features.item3Title') }}</h3>
            <p class="features__item-desc">{{ $t('landing.index.features.item3Desc') }}</p>
          </div>
          <div class="features__item">
            <AppIcon name="bell" size="md" class="features__item-icon" />
            <h3 class="features__item-title">{{ $t('landing.index.features.item1Title') }}</h3>
            <p class="features__item-desc">{{ $t('landing.index.features.item1Desc') }}</p>
          </div>
        </div>
        <div class="features__links">
          <NuxtLink :to="localePath({ name: 'outils-monitoring' })">{{ $t('common.nav.toolMonitoring') }}</NuxtLink>
          <NuxtLink :to="localePath({ name: 'outils-audit' })">{{ $t('common.nav.toolAudit') }}</NuxtLink>
          <NuxtLink :to="localePath({ name: 'docs-rules' })">{{ $t('landing.layout.footer.linkDocs') }}</NuxtLink>
        </div>
      </div>
    </section>

    <div class="landing__separator" />

    <section id="compare" class="landing__section compare">
      <div class="landing__container">
        <span class="section-label">{{ $t('landing.index.comparison.label') }}</span>
        <h2 class="section-title">{{ $t('landing.index.comparison.title') }}</h2>
        <p class="section-desc">
          {{ $t('landing.index.comparison.desc') }}
        </p>

        <PublicComparison />
        <NuxtLink :to="localePath({ name: 'demo-ssr' })" class="hero__cta hero__cta--ghost compare__demo">
          {{ $t('landing.index.comparison.cta') }}
        </NuxtLink>
      </div>
    </section>

    <div class="landing__separator" />

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
          <NuxtLink :to="localePath({ name: 'register' })" class="hero__cta hero__cta--ghost">
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

const cloudPriceDisplay = formatCloudPrice(locale.value)
const demoUrl = useRuntimeConfig().public.demoUrl

const FAQ_ITEMS = [
  { q: t('landing.index.faq.q2'), a: t('landing.index.faq.a2') },
  { q: t('landing.index.faq.q3'), a: t('landing.index.faq.a3') },
  { q: t('landing.index.faq.q4'), a: t('landing.index.faq.a4') },
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
            'sameAs': ['https://github.com/seogard-software/seogard', 'https://x.com/seogard_io'],
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

  &__separator {
    max-width: $container-width;
    margin: 0 auto;
    height: 32px;
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
  margin: 0 auto $spacing-6;
  line-height: $line-height-normal;
  text-align: center;
}

// ═══════════════════════════════════════
// HERO
// ═══════════════════════════════════════
.hero {
  position: relative;
  background: $color-white;
  padding: 3rem 0;
  text-align: center;
  overflow: hidden;
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
    color: $color-gray-600;
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
    color: $color-gray-600;
  }
}

// Atouts essentiels et liens vers les pages détaillées.
.features {
  padding: $spacing-10 0;

  &__list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: $spacing-6;
    margin-top: $spacing-6;
  }

  &__item {
    padding: $spacing-5;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
  }

  &__item-icon {
    color: $color-info;
    margin-bottom: $spacing-3;
  }

  &__item-title {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin-bottom: $spacing-2;
  }

  &__item-desc {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
  }

  &__links {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $spacing-5;
    margin-top: $spacing-6;

    a {
      color: $color-gray-900;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
  }
}

.compare {
  padding: $spacing-10 0;
  text-align: center;

  &__demo { margin-top: $spacing-5; }
}

// ═══════════════════════════════════════
// FAQ — visible section (feeds FAQPage JSON-LD)
// ═══════════════════════════════════════
.faq {
  padding: $spacing-10 0;

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
  padding: $spacing-10 0;
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
@media (max-width: $breakpoint-md) {
  .hero {
    padding: $spacing-8 0;
  }

  .landing__container {
    padding: 0 $spacing-4;
  }

  .features__list {
    grid-template-columns: 1fr;
  }
}
</style>

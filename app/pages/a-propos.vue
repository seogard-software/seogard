<template>
  <div class="about">
    <div class="about__container">
      <p class="about__eyebrow">{{ $t('about.eyebrow') }}</p>

      <header class="about__hero">
        <div class="about__avatar" aria-hidden="true">{{ initials }}</div>
        <div>
          <h1 class="about__name">{{ name }}</h1>
          <p class="about__role">{{ $t('about.role') }}</p>
          <nav v-if="socialLinks.length" class="about__socials">
            <a v-for="link in socialLinks" :key="link.href" :href="link.href" class="about__social" target="_blank" rel="noopener noreferrer">{{ link.label }}</a>
          </nav>
        </div>
      </header>

      <div class="about__prose">
        <p>{{ $t('about.intro') }}</p>

        <h2>{{ $t('about.whyHeading') }}</h2>
        <p>{{ $t('about.why1') }}</p>
        <p>{{ $t('about.why2') }}</p>

        <h2>{{ $t('about.masteryHeading') }}</h2>
        <div class="about__facts">
          <div v-for="fact in facts" :key="fact.key" class="about__fact">
            <span class="about__fact-k">{{ fact.key }}</span>
            <span class="about__fact-v">{{ fact.value }}</span>
          </div>
        </div>
        <p>{{ $t('about.rules') }}</p>
      </div>

      <section class="about__cta">
        <h2 class="about__cta-title">{{ $t('about.ctaTitle') }}</h2>
        <p class="about__cta-text">{{ $t('about.ctaText') }}</p>
        <div class="about__cta-bar">
          <ScanBar size="hero" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AUTHOR, AUTHOR_SAME_AS, buildPersonNode } from '~~/shared/utils/author'
import { toLocale } from '~~/shared/utils/i18n'

definePageMeta({ layout: 'landing', auth: false })
defineI18nRoute({ paths: { fr: '/a-propos', en: '/about' } })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const loc = computed(() => toLocale(locale.value))

const name = AUTHOR.name
const initials = AUTHOR.initials

const socialLinks = computed(() => AUTHOR_SAME_AS.map((href) => {
  const host = href.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] ?? href
  const brand = host.split('.')[0] ?? host
  return { href, label: brand.charAt(0).toUpperCase() + brand.slice(1) }
}))

const facts = computed(() => [
  { key: t('about.factTerrainKey'), value: t('about.factTerrainValue') },
  { key: t('about.factFocusKey'), value: t('about.factFocusValue') },
  { key: t('about.factCrawlerKey'), value: t('about.factCrawlerValue') },
  { key: t('about.factApproachKey'), value: t('about.factApproachValue') },
])

const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
const abs = (name_: string): string => `${appUrl}${localePath({ name: name_ })}`
const ogImage = computed(() => `${appUrl}${loc.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)

useHead(() => ({
  title: t('about.seoTitle'),
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ProfilePage',
          'inLanguage': loc.value,
          'mainEntity': buildPersonNode(appUrl, { jobTitle: t('about.role'), description: t('about.intro'), aboutUrl: abs('a-propos') }),
        },
      ],
    }),
  }],
}))

useSeoMeta({
  description: () => t('about.seoDescription'),
  ogTitle: () => t('about.seoTitle'),
  ogDescription: () => t('about.seoDescription'),
  ogType: 'profile',
  ogUrl: () => abs('a-propos'),
  ogImage: () => ogImage.value,
  twitterCard: 'summary_large_image',
  twitterImage: () => ogImage.value,
  robots: 'index, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.about {
  &__container {
    max-width: 760px;
    margin: 0 auto;
    padding: 9rem $spacing-6 $spacing-16;
  }

  &__eyebrow {
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: $color-info;
    margin: 0 0 $spacing-3;
  }

  &__hero {
    display: flex;
    gap: $spacing-5;
    align-items: center;
    flex-wrap: wrap;
    padding-bottom: $spacing-6;
    border-bottom: 1px solid $color-gray-200;
  }

  &__avatar {
    width: 88px;
    height: 88px;
    flex: none;
    border-radius: $radius-2xl;
    display: grid;
    place-items: center;
    font-weight: $font-weight-bold;
    font-size: $font-size-3xl;
    color: $color-accent;
    background: rgba($color-accent, 0.12);
  }

  &__name {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    letter-spacing: -0.02em;
    color: $color-gray-900;
    margin: 0;
  }

  &__role { font-size: $font-size-base; color: $color-gray-600; margin: $spacing-1 0 0; }

  &__socials { display: flex; flex-wrap: wrap; gap: $spacing-2; margin-top: $spacing-3; }

  &__social {
    font-size: $font-size-sm;
    color: $color-gray-700;
    padding: $spacing-1 $spacing-3;
    border: 1px solid $color-gray-200;
    border-radius: $radius-full;
    text-decoration: none;

    &:hover { background: $surface-elevated; }
  }

  &__prose {
    margin-top: $spacing-6;

    h2 {
      font-size: $font-size-xl;
      font-weight: $font-weight-semibold;
      color: $color-gray-900;
      letter-spacing: -0.01em;
      margin: $spacing-8 0 $spacing-3;
    }

    p {
      font-size: $font-size-base;
      line-height: $line-height-normal;
      color: $color-gray-700;
      margin: 0 0 $spacing-4;
    }
  }

  &__facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: $spacing-3;
    margin: $spacing-4 0 $spacing-6;
  }

  &__fact {
    padding: $spacing-3 $spacing-4;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    background: $surface-elevated;
  }

  &__fact-k {
    display: block;
    font-size: $font-size-xs;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-gray-400;
  }

  &__fact-v { display: block; font-size: $font-size-sm; font-weight: $font-weight-semibold; color: $color-gray-900; margin-top: 2px; }

  &__cta {
    margin-top: $spacing-12;
    padding: $spacing-8;
    text-align: center;
    background: linear-gradient(180deg, $surface-elevated, $color-white);
    border: 1px solid $color-gray-200;
    border-radius: $radius-2xl;
  }

  &__cta-title { font-size: $font-size-2xl; font-weight: $font-weight-bold; letter-spacing: -0.02em; color: $color-gray-900; margin: 0 0 $spacing-2; }
  &__cta-text { font-size: $font-size-base; color: $color-gray-600; margin: 0 0 $spacing-6; }
  &__cta-bar { max-width: 480px; margin: 0 auto; }
}
</style>

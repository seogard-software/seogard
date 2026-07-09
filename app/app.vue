<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <CookieConsent />
</template>

<script setup lang="ts">
// Lang HTML dynamique par locale (angle mort F du plan i18n) — 'fr' sur /fr/*, 'en' sur /en/*,
// défaut sur les routes non localisées (dashboard : suivra User.locale à l'étape 3).
const { locale, t } = useI18n()

// og:locale (fr_FR / en_US) + alternate = la ou les autres locales. Déclaré globalement pour
// que Facebook/LinkedIn ET les moteurs génératifs sachent la langue de chaque page.
const OG_LOCALE: Record<string, string> = { fr: 'fr_FR', en: 'en_US' }
const ogLocale = computed(() => OG_LOCALE[locale.value] ?? OG_LOCALE.fr)
const ogLocaleAlternate = computed(() => Object.entries(OG_LOCALE).filter(([l]) => l !== locale.value).map(([, og]) => og))

useHead({
  titleTemplate: '%s — Seogard',
  htmlAttrs: { lang: locale },
})

useSeoMeta({
  description: () => t('seo.default.description'),
  ogLocale,
  ogLocaleAlternate,
})
</script>

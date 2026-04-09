<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <CookieConsent />
</template>

<script setup lang="ts">
useHead({
  titleTemplate: '%s — Seogard',
  htmlAttrs: { lang: 'fr' },
})

useSeoMeta({
  description: 'Monitoring SEO technique. Détectez les régressions avant Google.',
})
</script>

<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <h1>{{ $t('legal.mentions.title') }}</h1>
      <p class="legal-page__updated">{{ $t('legal.mentions.updated') }}</p>

      <h2>{{ $t('legal.mentions.editorTitle') }}</h2>
      <p v-html="$t('legal.mentions.editor')" />

      <h2>{{ $t('legal.mentions.hostingTitle') }}</h2>
      <p v-html="$t('legal.mentions.hosting')" />

      <h2>{{ $t('legal.mentions.ipTitle') }}</h2>
      <p>{{ $t('legal.mentions.ip') }}</p>

      <h2>{{ $t('legal.mentions.dataTitle') }}</h2>
      <i18n-t keypath="legal.mentions.data" tag="p" scope="global">
        <template #link>
          <NuxtLink :to="localePath({ name: 'legal-privacy' })">{{ $t('legal.mentions.dataLink') }}</NuxtLink>
        </template>
      </i18n-t>

      <h2>{{ $t('legal.mentions.cookiesTitle') }}</h2>
      <i18n-t keypath="legal.mentions.cookies" tag="p" scope="global">
        <template #link>
          <NuxtLink :to="localePath({ name: 'legal-cookies' })">{{ $t('legal.mentions.cookiesLink') }}</NuxtLink>
        </template>
      </i18n-t>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

useHead({ title: t('legal.mentions.seo.title') })
useSeoMeta({
  description: t('legal.mentions.seo.description'),
  ogUrl: `${appUrl}${localePath({ name: 'legal-mentions' })}`,
  ogLocale: locale.value,
  robots: 'noindex, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/legal';
</style>

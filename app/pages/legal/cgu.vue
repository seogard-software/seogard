<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <h1>{{ $t('legal.cgu.title') }}</h1>
      <p class="legal-page__updated">{{ $t('legal.cgu.updated') }}</p>
      <p v-if="locale === 'en'" class="legal-page__note">{{ $t('legal.cgu.frPrevails') }}</p>

      <h2>{{ $t('legal.cgu.objTitle') }}</h2>
      <i18n-t keypath="legal.cgu.obj1" tag="p" scope="global">
        <template #link>
          <NuxtLink :to="localePath({ name: 'legal-mentions' })">{{ $t('legal.cgu.obj1Link') }}</NuxtLink>
        </template>
      </i18n-t>
      <i18n-t keypath="legal.cgu.obj2" tag="p" scope="global">
        <template #cgv>
          <NuxtLink :to="localePath({ name: 'legal-cgv' })">{{ $t('legal.cgu.obj2Cgv') }}</NuxtLink>
        </template>
        <template #privacy>
          <NuxtLink :to="localePath({ name: 'legal-privacy' })">{{ $t('legal.cgu.obj2Privacy') }}</NuxtLink>
        </template>
      </i18n-t>

      <h2>{{ $t('legal.cgu.proTitle') }}</h2>
      <p v-html="$t('legal.cgu.pro1')" />
      <p>{{ $t('legal.cgu.pro2') }}</p>

      <h2>{{ $t('legal.cgu.defTitle') }}</h2>
      <ul>
        <li v-for="(item, i) in list('legal.cgu.defs')" :key="i" v-html="item" />
      </ul>

      <h2>{{ $t('legal.cgu.accountTitle') }}</h2>
      <p>{{ $t('legal.cgu.account1') }}</p>
      <p>{{ $t('legal.cgu.account2') }}</p>
      <p>{{ $t('legal.cgu.account3') }}</p>

      <h2>{{ $t('legal.cgu.descTitle') }}</h2>
      <p>{{ $t('legal.cgu.descIntro') }}</p>
      <ul>
        <li v-for="(item, i) in list('legal.cgu.descList')" :key="i">{{ item }}</li>
      </ul>

      <h2>{{ $t('legal.cgu.oblTitle') }}</h2>
      <p>{{ $t('legal.cgu.oblIntro') }}</p>
      <ul>
        <li v-for="(item, i) in list('legal.cgu.oblList')" :key="i" v-html="item" />
      </ul>

      <h2>{{ $t('legal.cgu.warrTitle') }}</h2>
      <p v-html="$t('legal.cgu.warr1')" />
      <p v-html="$t('legal.cgu.warr2')" />
      <p>{{ $t('legal.cgu.warr3') }}</p>

      <h2>{{ $t('legal.cgu.ipTitle') }}</h2>
      <p>{{ $t('legal.cgu.ip1') }}</p>

      <h2>{{ $t('legal.cgu.availTitle') }}</h2>
      <p>{{ $t('legal.cgu.avail1') }}</p>
      <p>{{ $t('legal.cgu.avail2') }}</p>

      <h2>{{ $t('legal.cgu.limTitle') }}</h2>
      <p v-html="$t('legal.cgu.limIntro')" />
      <ul>
        <li v-for="(item, i) in list('legal.cgu.limList')" :key="i">{{ item }}</li>
      </ul>
      <p v-html="$t('legal.cgu.limOutro')" />

      <h2>{{ $t('legal.cgu.termTitle') }}</h2>
      <p>{{ $t('legal.cgu.term1') }}</p>

      <h2>{{ $t('legal.cgu.modifTitle') }}</h2>
      <p v-html="$t('legal.cgu.modif1')" />

      <h2>{{ $t('legal.cgu.lawTitle') }}</h2>
      <p v-html="$t('legal.cgu.law1')" />

      <h2>{{ $t('legal.cgu.contactTitle') }}</h2>
      <p v-html="$t('legal.cgu.contact')" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })

const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

function list(key: string): string[] {
  return (tm(key) as unknown[]).map(m => rt(m as string))
}

useHead({ title: t('legal.cgu.seo.title') })
useSeoMeta({
  description: t('legal.cgu.seo.description'),
  ogUrl: `${appUrl}${localePath({ name: 'legal-cgu' })}`,
  ogLocale: locale.value,
  robots: 'noindex, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/legal';
</style>

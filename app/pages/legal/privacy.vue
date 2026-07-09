<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <h1>{{ $t('legal.privacy.title') }}</h1>
      <p class="legal-page__updated">{{ $t('legal.privacy.updated') }}</p>
      <p v-if="locale === 'en'" class="legal-page__note">{{ $t('legal.privacy.frPrevails') }}</p>

      <p>{{ $t('legal.privacy.intro') }}</p>

      <h2>{{ $t('legal.privacy.controllerTitle') }}</h2>
      <p v-html="$t('legal.privacy.controller')" />

      <h2>{{ $t('legal.privacy.collectedTitle') }}</h2>

      <h3>{{ $t('legal.privacy.registrationTitle') }}</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>{{ $t('legal.privacy.thData') }}</th>
            <th>{{ $t('legal.privacy.thPurpose') }}</th>
            <th>{{ $t('legal.privacy.thBasis') }}</th>
            <th>{{ $t('legal.privacy.thRetention') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows('legal.privacy.registrationRows')" :key="i">
            <td>{{ row.data }}</td>
            <td>{{ row.purpose }}</td>
            <td>{{ row.basis }}</td>
            <td>{{ row.retention }}</td>
          </tr>
        </tbody>
      </table>

      <h3>{{ $t('legal.privacy.billingTitle') }}</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>{{ $t('legal.privacy.thData') }}</th>
            <th>{{ $t('legal.privacy.thPurpose') }}</th>
            <th>{{ $t('legal.privacy.thBasis') }}</th>
            <th>{{ $t('legal.privacy.thRetention') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows('legal.privacy.billingRows')" :key="i">
            <td>{{ row.data }}</td>
            <td>{{ row.purpose }}</td>
            <td>{{ row.basis }}</td>
            <td>{{ row.retention }}</td>
          </tr>
        </tbody>
      </table>
      <p v-html="$t('legal.privacy.billingNote')" />

      <h3>{{ $t('legal.privacy.crawlTitle') }}</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>{{ $t('legal.privacy.thData') }}</th>
            <th>{{ $t('legal.privacy.thPurpose') }}</th>
            <th>{{ $t('legal.privacy.thBasis') }}</th>
            <th>{{ $t('legal.privacy.thRetention') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows('legal.privacy.crawlRows')" :key="i">
            <td>{{ row.data }}</td>
            <td>{{ row.purpose }}</td>
            <td>{{ row.basis }}</td>
            <td>{{ row.retention }}</td>
          </tr>
        </tbody>
      </table>

      <h3>{{ $t('legal.privacy.navigationTitle') }}</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>{{ $t('legal.privacy.thData') }}</th>
            <th>{{ $t('legal.privacy.thPurpose') }}</th>
            <th>{{ $t('legal.privacy.thBasis') }}</th>
            <th>{{ $t('legal.privacy.thRetention') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows('legal.privacy.navigationRows')" :key="i">
            <td>{{ row.data }}</td>
            <td>{{ row.purpose }}</td>
            <td>{{ row.basis }}</td>
            <td>{{ row.retention }}</td>
          </tr>
        </tbody>
      </table>

      <h2>{{ $t('legal.privacy.subprocessorsTitle') }}</h2>
      <p>{{ $t('legal.privacy.subprocessorsIntro') }}</p>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>{{ $t('legal.privacy.thSubprocessor') }}</th>
            <th>{{ $t('legal.privacy.thPurpose') }}</th>
            <th>{{ $t('legal.privacy.thLocation') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows('legal.privacy.subprocessorsRows')" :key="i">
            <td>{{ row.name }}</td>
            <td>{{ row.purpose }}</td>
            <td>{{ row.location }}</td>
          </tr>
        </tbody>
      </table>
      <p>{{ $t('legal.privacy.subprocessorsNote') }}</p>

      <h2>{{ $t('legal.privacy.rightsTitle') }}</h2>
      <p>{{ $t('legal.privacy.rightsIntro') }}</p>
      <ul>
        <li v-for="(item, i) in list('legal.privacy.rightsList')" :key="i" v-html="item" />
      </ul>
      <p v-html="$t('legal.privacy.rightsExercise')" />
      <p v-html="$t('legal.privacy.rightsComplaint')" />

      <h2>{{ $t('legal.privacy.securityTitle') }}</h2>
      <p>{{ $t('legal.privacy.securityIntro') }}</p>
      <ul>
        <li v-for="(item, i) in list('legal.privacy.securityList')" :key="i">{{ item }}</li>
      </ul>

      <h2>{{ $t('legal.privacy.cookiesTitle') }}</h2>
      <i18n-t keypath="legal.privacy.cookies" tag="p" scope="global">
        <template #link>
          <NuxtLink :to="localePath({ name: 'legal-cookies' })">{{ $t('legal.privacy.cookiesLink') }}</NuxtLink>
        </template>
      </i18n-t>

      <h2>{{ $t('legal.privacy.changesTitle') }}</h2>
      <p>{{ $t('legal.privacy.changes') }}</p>

      <h2>{{ $t('legal.privacy.contactTitle') }}</h2>
      <p v-html="$t('legal.privacy.contact')" />
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
function rows(key: string): Record<string, string>[] {
  return (tm(key) as Record<string, unknown>[]).map(r =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, rt(v as string)])),
  )
}

useHead({ title: t('legal.privacy.seo.title') })
useSeoMeta({
  description: t('legal.privacy.seo.description'),
  ogUrl: `${appUrl}${localePath({ name: 'legal-privacy' })}`,
  ogLocale: locale.value,
  robots: 'noindex, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/legal';
</style>

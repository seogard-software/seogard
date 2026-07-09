<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <h1>{{ $t('legal.cookies.title') }}</h1>
      <p class="legal-page__updated">{{ $t('legal.cookies.updated') }}</p>

      <h2>{{ $t('legal.cookies.whatTitle') }}</h2>
      <p>{{ $t('legal.cookies.whatP') }}</p>

      <h2>{{ $t('legal.cookies.usedTitle') }}</h2>

      <h3>{{ $t('legal.cookies.necessaryTitle') }}</h3>
      <p>{{ $t('legal.cookies.necessaryP') }}</p>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>{{ $t('legal.cookies.thName') }}</th>
            <th>{{ $t('legal.cookies.thPurpose') }}</th>
            <th>{{ $t('legal.cookies.thDuration') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in rows('legal.cookies.necessaryRows')" :key="i">
            <td><code>{{ row.name }}</code></td>
            <td>{{ row.purpose }}</td>
            <td>{{ row.duration }}</td>
          </tr>
        </tbody>
      </table>

      <h3>{{ $t('legal.cookies.analyticsTitle') }}</h3>
      <p v-html="$t('legal.cookies.analyticsP')" />
      <ul>
        <li v-for="(item, i) in list('legal.cookies.analyticsList')" :key="i" v-html="item" />
      </ul>

      <h2>{{ $t('legal.cookies.thirdTitle') }}</h2>
      <p v-html="$t('legal.cookies.thirdP')" />

      <h2>{{ $t('legal.cookies.manageTitle') }}</h2>
      <p>{{ $t('legal.cookies.manageP') }}</p>

      <h2>{{ $t('legal.cookies.contactTitle') }}</h2>
      <p v-html="$t('legal.cookies.contact')" />
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

useHead({ title: t('legal.cookies.seo.title') })
useSeoMeta({
  description: t('legal.cookies.seo.description'),
  ogUrl: `${appUrl}${localePath({ name: 'legal-cookies' })}`,
  ogLocale: locale.value,
  robots: 'noindex, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/legal';
</style>

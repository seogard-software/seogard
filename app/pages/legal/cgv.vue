<template>
  <div class="legal-page">
    <div class="legal-page__container">
      <h1>{{ $t('legal.cgv.title') }}</h1>
      <p class="legal-page__updated">{{ $t('legal.cgv.updated') }}</p>
      <p v-if="locale === 'en'" class="legal-page__note">{{ $t('legal.cgv.frPrevails') }}</p>

      <h2>{{ $t('legal.cgv.objTitle') }}</h2>
      <i18n-t keypath="legal.cgv.obj1" tag="p" scope="global">
        <template #link>
          <NuxtLink :to="localePath({ name: 'legal-mentions' })">{{ $t('legal.cgv.obj1Link') }}</NuxtLink>
        </template>
      </i18n-t>
      <i18n-t keypath="legal.cgv.obj2" tag="p" scope="global">
        <template #cgu>
          <NuxtLink :to="localePath({ name: 'legal-cgu' })">{{ $t('legal.cgv.obj2Cgu') }}</NuxtLink>
        </template>
        <template #privacy>
          <NuxtLink :to="localePath({ name: 'legal-privacy' })">{{ $t('legal.cgv.obj2Privacy') }}</NuxtLink>
        </template>
      </i18n-t>
      <p v-html="$t('legal.cgv.obj3')" />

      <h2>{{ $t('legal.cgv.descTitle') }}</h2>
      <p>{{ $t('legal.cgv.descIntro') }}</p>
      <ul>
        <li v-for="(item, i) in list('legal.cgv.descList')" :key="i">{{ item }}</li>
      </ul>

      <h2>{{ $t('legal.cgv.pricingTitle') }}</h2>
      <h3>{{ $t('legal.cgv.pricingModelTitle') }}</h3>
      <p v-html="$t('legal.cgv.pricingModel', { price: pricePerPage })" />
      <p>{{ $t('legal.cgv.pricingVat', { priceTTC }) }}</p>
      <p v-html="$t('legal.cgv.pricingCounted')" />

      <h3>{{ $t('legal.cgv.countingTitle') }}</h3>
      <p v-html="$t('legal.cgv.counting1')" />
      <p v-html="$t('legal.cgv.counting2')" />

      <h3>{{ $t('legal.cgv.examplesTitle') }}</h3>
      <table class="legal-page__table">
        <thead>
          <tr>
            <th>{{ $t('legal.cgv.exampleScenario') }}</th>
            <th>{{ $t('legal.cgv.exampleBilled') }}</th>
            <th>{{ $t('legal.cgv.exampleCostHT') }}</th>
            <th>{{ $t('legal.cgv.exampleCostTTC') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="example in priceExamples" :key="example.pages">
            <td>{{ $t('legal.cgv.exampleRow', { pages: example.label }) }}</td>
            <td>{{ example.label }}</td>
            <td>{{ example.price }} €</td>
            <td>{{ example.priceTTC }} €</td>
          </tr>
        </tbody>
      </table>

      <h3>{{ $t('legal.cgv.revisionTitle') }}</h3>
      <p v-html="$t('legal.cgv.revision1')" />
      <p>{{ $t('legal.cgv.revision2') }}</p>

      <h3>{{ $t('legal.cgv.trialTitle') }}</h3>
      <p v-html="$t('legal.cgv.trial1')" />
      <p>{{ $t('legal.cgv.trial2') }}</p>
      <p>{{ $t('legal.cgv.trial3') }}</p>

      <h2>{{ $t('legal.cgv.billingTitle') }}</h2>
      <h3>{{ $t('legal.cgv.billingModalTitle') }}</h3>
      <p>{{ $t('legal.cgv.billing1') }}</p>

      <h3>{{ $t('legal.cgv.billingDelayTitle') }}</h3>
      <p>{{ $t('legal.cgv.billing2') }}</p>

      <h3>{{ $t('legal.cgv.lateTitle') }}</h3>
      <p>{{ $t('legal.cgv.lateIntro') }}</p>
      <ul>
        <li v-for="(item, i) in list('legal.cgv.lateList')" :key="i" v-html="item" />
      </ul>

      <h3>{{ $t('legal.cgv.suspTitle') }}</h3>
      <p>{{ $t('legal.cgv.suspIntro') }}</p>
      <ul>
        <li v-for="(item, i) in list('legal.cgv.suspList')" :key="i" v-html="item" />
      </ul>
      <p>{{ $t('legal.cgv.suspOutro') }}</p>

      <h2>{{ $t('legal.cgv.termTitle') }}</h2>
      <h3>{{ $t('legal.cgv.termDurationTitle') }}</h3>
      <p v-html="$t('legal.cgv.term1')" />

      <h3>{{ $t('legal.cgv.termClientTitle') }}</h3>
      <p>{{ $t('legal.cgv.term2') }}</p>

      <h3>{{ $t('legal.cgv.termProviderTitle') }}</h3>
      <p>{{ $t('legal.cgv.term3Intro') }}</p>
      <ul>
        <li v-for="(item, i) in list('legal.cgv.term3List')" :key="i">{{ item }}</li>
      </ul>

      <h2>{{ $t('legal.cgv.dataTitle') }}</h2>
      <i18n-t keypath="legal.cgv.data1" tag="p" scope="global">
        <template #days>
          <strong>{{ $t('legal.cgv.data1Days') }}</strong>
        </template>
        <template #link>
          <NuxtLink :to="localePath({ name: 'legal-privacy' })">{{ $t('legal.cgv.data1Link') }}</NuxtLink>
        </template>
      </i18n-t>

      <h2>{{ $t('legal.cgv.warrTitle') }}</h2>
      <p>{{ $t('legal.cgv.warrIntro') }}</p>
      <ul>
        <li v-for="(item, i) in list('legal.cgv.warrList')" :key="i">{{ item }}</li>
      </ul>
      <p v-html="$t('legal.cgv.warrLiability')" />
      <p>{{ $t('legal.cgv.warrIndirect') }}</p>

      <h2>{{ $t('legal.cgv.forceTitle') }}</h2>
      <p>{{ $t('legal.cgv.force1') }}</p>

      <h2>{{ $t('legal.cgv.lawTitle') }}</h2>
      <p v-html="$t('legal.cgv.law1')" />

      <h2>{{ $t('legal.cgv.severabilityTitle') }}</h2>
      <p>{{ $t('legal.cgv.severability1') }}</p>

      <h2>{{ $t('legal.cgv.contactTitle') }}</h2>
      <p v-html="$t('legal.cgv.contact')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCloudPrice, getCloudPricePerPage, getPriceExamples } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'landing', auth: false })

const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

function list(key: string): string[] {
  return (tm(key) as unknown[]).map(m => rt(m as string))
}

const pricePerPage = formatCloudPrice(locale.value)
const priceTTC = (getCloudPricePerPage() * 1.2).toFixed(4).replace('.', ',')

const rawExamples = getPriceExamples()
const priceExamples = rawExamples.map(ex => ({
  ...ex,
  priceTTC: (ex.pages * getCloudPricePerPage() * 1.2).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
}))

useHead({ title: t('legal.cgv.seo.title') })
useSeoMeta({
  description: t('legal.cgv.seo.description'),
  ogUrl: `${appUrl}${localePath({ name: 'legal-cgv' })}`,
  ogLocale: locale.value,
  robots: 'noindex, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/legal';
</style>

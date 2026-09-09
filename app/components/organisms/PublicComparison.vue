<template>
  <div class="public-comparison">
    <div class="public-comparison__scroll" tabindex="0" role="region" :aria-label="$t('landing.publicComparison.label')">
      <table>
        <caption>{{ $t('landing.publicComparison.caption') }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ $t('landing.publicComparison.feature') }}</th>
            <th scope="col">Seogard</th>
            <th scope="col">Conductor<br><small>ex-ContentKing</small></th>
            <th scope="col">Lumar</th>
            <th scope="col">Botify</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.key">
            <th scope="row">{{ $t(`landing.publicComparison.rows.${row.key}`) }}</th>
            <td>{{ $t(`landing.publicComparison.values.${row.seogard}`) }}</td>
            <td v-for="(cell, index) in row.others" :key="index">
              <a v-if="cell.url" :href="cell.url" :aria-label="`${$t(`landing.publicComparison.values.${cell.value}`)} — ${vendors[index]} — ${$t(`landing.publicComparison.rows.${row.key}`)} — ${$t('landing.publicComparison.source')}`">{{ $t(`landing.publicComparison.values.${cell.value}`) }}</a>
              <span v-else>{{ $t('landing.publicComparison.values.unverified') }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="public-comparison__note">{{ $t('landing.publicComparison.note') }}</p>
    <p><NuxtLink :to="localePath({ name: 'docs-self-hosted' })">{{ $t('landing.publicComparison.selfHosted') }}</NuxtLink></p>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const vendors = ['Conductor', 'Lumar', 'Botify']
const conductorJs = 'https://www.conductor.com/platform/features/technical-aeo-seo/javascript-rendering/'
const botifyJs = 'https://support.botify.com/en/articles/15656344-javascript-crawl-fields'
const rows = [
  { key: 'javascript', seogard: 'yes', others: [
    { value: 'yes', url: conductorJs },
    { value: 'yes', url: 'https://help.lumar.io/hc/en-us/articles/24080167335953-Setting-Up-a-Test-Suite' },
    { value: 'yes', url: botifyJs },
  ] },
  { key: 'comparison', seogard: 'comparison', others: [
    { value: 'comparison', url: conductorJs },
    { value: 'bothVersions', url: 'https://help.lumar.io/hc/en-us/articles/38879758925969-How-to-Crawl-a-Website-Site-Speed' },
    { value: 'comparison', url: botifyJs },
  ] },
  { key: 'monitoring', seogard: 'perCrawl', others: [
    { value: 'yes', url: 'https://www.conductor.com/platform/capabilities/monitoring/' },
    { value: 'monitor', url: 'https://www.lumar.io/platform/monitor/' },
    { value: 'alertPanel', url: 'https://support.botify.com/en/articles/9108700-custom-alert-use-cases-in-alertpanel' },
  ] },
  { key: 'ci', seogard: 'webhook', others: [
    { value: 'unverified', url: null },
    { value: 'protect', url: 'https://www.lumar.io/platform/protect/' },
    { value: 'unverified', url: null },
  ] },
]
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
.public-comparison {
  margin-top: $spacing-6;
  text-align: left;
  &__scroll { overflow-x: auto; border: 1px solid $color-gray-200; border-radius: $radius-lg; }
  table { width: 100%; min-width: 680px; border-collapse: collapse; font-size: $font-size-sm; }
  caption { padding: $spacing-3; text-align: left; color: $color-gray-600; }
  th, td { padding: $spacing-3; border-top: 1px solid $color-gray-200; vertical-align: top; }
  th { font-weight: $font-weight-semibold; }
  th:nth-child(2), td:nth-child(2) { background: $color-gray-50; }
  small { font-weight: $font-weight-normal; }
  a { color: $color-accent; text-decoration: underline; text-underline-offset: 3px; }
  &__note { font-size: $font-size-xs; color: $color-gray-600; margin: $spacing-3 0; line-height: $line-height-normal; }
}
</style>

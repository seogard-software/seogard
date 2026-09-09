<template>
  <section id="ssr-demo" class="ssr-demo" aria-labelledby="ssr-demo-title">
    <p class="ssr-demo__eyebrow">{{ $t('docs.ssrDemo.eyebrow') }}</p>
    <h2 id="ssr-demo-title">{{ $t('docs.ssrDemo.title') }}</h2>
    <p>{{ $t('docs.ssrDemo.intro') }}</p>
    <div class="ssr-demo__grid">
      <article v-for="phase in phases" :key="phase.key" class="ssr-demo__card">
        <h3>{{ $t(`docs.ssrDemo.${phase.key}`) }}</h3>
        <p class="ssr-demo__result">{{ $t('docs.ssrDemo.findings', { count: phase.data.detectedRules.length }) }}</p>
        <p>{{ $t('docs.ssrDemo.rawWordSummary', { count: phase.data.raw.wordCount }) }}</p>
        <details class="ssr-demo__source">
          <summary>{{ $t('docs.ssrDemo.details') }}</summary>
        <dl>
          <dt>{{ $t('docs.ssrDemo.rawTitle') }}</dt>
          <dd><code>{{ phase.data.raw.title }}</code></dd>
          <dt>{{ $t('docs.ssrDemo.renderedTitle') }}</dt>
          <dd><code>{{ phase.data.rendered.title }}</code></dd>
          <dt>{{ $t('docs.ssrDemo.rawWords') }}</dt>
          <dd>{{ phase.data.raw.wordCount }}</dd>
          <dt>{{ $t('docs.ssrDemo.renderedWords') }}</dt>
          <dd>{{ phase.data.rendered.wordCount }}</dd>
        </dl>
        <ul v-if="phase.data.detectedRules.length">
          <li v-for="id in phase.data.detectedRules" :key="id">{{ ruleLabel(id) }}</li>
        </ul>
        <p v-else>{{ $t('docs.ssrDemo.resolved') }}</p>
          <p class="ssr-demo__method">{{ $t('docs.ssrDemo.countNote') }}</p>
          <pre tabindex="0" :aria-label="$t('docs.ssrDemo.source')"><code>{{ phase.data.code }}</code></pre>
        </details>
      </article>
    </div>
    <p class="ssr-demo__method">{{ $t('docs.ssrDemo.method', { date: verifiedDisplay }) }}</p>
    <p class="ssr-demo__limit">{{ $t('docs.ssrDemo.limit') }}</p>
    <nav class="ssr-demo__guides" :aria-label="$t('docs.ssrDemo.guides')">
      <NuxtLink v-for="guide in guides" :key="guide.id" :to="guide.to">{{ guide.label }}</NuxtLink>
    </nav>
  </section>
</template>

<script setup lang="ts">
import demo from '~~/shared/data/ssr-demo.json'
import { getRulesCatalog } from '~~/shared/utils/rules-catalog'
import { getRuleSlug } from '~~/shared/utils/rule-knowledge'
import { toLocale } from '~~/shared/utils/i18n'
import { INTL_LOCALE } from '~~/shared/utils/format'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const loc = computed(() => toLocale(locale.value))
const catalog = computed(() => getRulesCatalog(loc.value))
const phases = [{ key: 'before', data: demo.before }, { key: 'after', data: demo.after }] as const
const verifiedDisplay = computed(() => new Date(demo.verifiedAt).toLocaleDateString(INTL_LOCALE[loc.value], { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }))
function ruleLabel(id: string): string {
  return catalog.value.find(rule => rule.id === id)?.label ?? id
}
const guides = computed(() => demo.rulesChecked.map(id => ({
  id,
  label: t(`docs.ssrDemo.guide.${id}`),
  to: localePath({ name: 'docs-rules-slug', params: { slug: getRuleSlug(id, loc.value)! } }),
})))
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.ssr-demo {
  scroll-margin-top: 7rem;
  color: $color-gray-900;
  line-height: $line-height-normal;

  h2 { font-size: $font-size-3xl; line-height: $line-height-tight; margin-bottom: $spacing-4; }
  h3 { font-size: $font-size-lg; margin-bottom: $spacing-4; }
  &__eyebrow { color: $color-accent; font-size: $font-size-sm; font-weight: $font-weight-semibold; margin-bottom: $spacing-2; }
  &__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: $spacing-5; margin: $spacing-6 0; }
  &__card { min-width: 0; border: 1px solid $color-gray-200; border-radius: $radius-lg; padding: $spacing-5; background: $color-white; }
  dl { margin: 0; }
  dt { font-size: $font-size-sm; color: $color-gray-600; margin-top: $spacing-3; }
  dd { margin: $spacing-1 0 0; overflow-wrap: anywhere; }
  code { font-family: $font-family-mono; font-size: $font-size-sm; }
  ul { padding-left: $spacing-5; }
  &__result { margin-top: $spacing-5; font-weight: $font-weight-semibold; }
  &__source { margin-top: $spacing-5; }
  summary { cursor: pointer; color: $color-gray-700; text-decoration: underline; }
  pre { max-height: 18rem; overflow: auto; margin-top: $spacing-3; padding: $spacing-3; border-radius: $radius-md; background: $color-gray-50; text-align: left; }
  &__method { margin-top: $spacing-3; font-size: $font-size-sm; color: $color-gray-600; }
  &__limit { margin-top: $spacing-4; padding-left: $spacing-4; border-left: 3px solid $color-accent; }
  &__guides { display: flex; flex-wrap: wrap; gap: $spacing-3 $spacing-6; margin-top: $spacing-5; }
  a { color: $color-accent; text-decoration: underline; text-underline-offset: 3px; }
  @media (max-width: $breakpoint-sm) {
    &__grid { grid-template-columns: minmax(0, 1fr); }
    h2 { font-size: $font-size-2xl; }
  }
}
</style>

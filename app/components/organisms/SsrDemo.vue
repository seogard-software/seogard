<template>
  <section class="ssr-demo" aria-labelledby="demo-example-title">
    <div class="ssr-demo__heading">
      <div>
        <p class="ssr-demo__step">{{ $t('docs.ssrDemo.step') }}</p>
        <h2 id="demo-example-title">{{ $t('docs.ssrDemo.exampleTitle') }}</h2>
      </div>
      <p class="ssr-demo__hint">{{ $t('docs.ssrDemo.switchHint') }}</p>
    </div>
    <div class="ssr-demo__experiment">
      <div class="ssr-demo__toolbar">
        <div class="ssr-demo__switch" role="group" :aria-label="$t('docs.ssrDemo.phaseLabel')">
          <button v-for="phase in phases" :key="phase.key" type="button" :aria-pressed="selected === phase.key" aria-controls="demo-observation" @click="selected = phase.key">
            <span class="ssr-demo__phase-dot" :class="{ 'ssr-demo__phase-dot--after': phase.key === 'after' }" aria-hidden="true" />
            {{ $t('docs.ssrDemo.' + phase.key) }}
          </button>
        </div>
        <span class="ssr-demo__scope" :class="{ 'ssr-demo__scope--after': selected === 'after' }">{{ $t('docs.ssrDemo.' + selected + 'Scope', { count: current.detectedRules.length, total: demo.rulesChecked.length }) }}</span>
      </div>
      <div id="demo-observation" class="ssr-demo__observation">
        <figure class="ssr-demo__browser">
          <figcaption>
            <span class="ssr-demo__browser-dots" aria-hidden="true"><i /><i /><i /></span>
            <span>{{ $t('docs.ssrDemo.browserTitle') }}</span>
            <span class="ssr-demo__language" lang="en">EN</span>
          </figcaption>
          <iframe :key="selected" :srcdoc="preview" :title="$t('docs.ssrDemo.previewTitle') + ' — ' + $t('docs.ssrDemo.' + selected)" sandbox="allow-scripts" referrerpolicy="no-referrer" class="ssr-demo__frame" />
          <div class="ssr-demo__caption">
            <span aria-hidden="true">↔</span><p>{{ $t('docs.ssrDemo.sameAppearance') }}</p>
          </div>
          <noscript><p class="ssr-demo__nojs">{{ $t('docs.ssrDemo.noJs') }}</p></noscript>
        </figure>
        <div class="ssr-demo__diagnosis" :class="{ 'ssr-demo__diagnosis--after': selected === 'after' }">
          <p class="ssr-demo__label">{{ $t('docs.ssrDemo.diagnosis') }}</p>
          <div class="ssr-demo__verdict" role="status" aria-live="polite" aria-atomic="true">
            <strong>{{ current.detectedRules.length }}</strong>
            <p>{{ $t('docs.ssrDemo.' + (selected === 'before' ? 'beforeVerdict' : 'afterVerdict')) }}</p>
          </div>
          <ul class="ssr-demo__findings">
            <li v-for="finding in ['title', 'content']" :key="finding">
              <span class="ssr-demo__finding-icon" aria-hidden="true">{{ selected === 'before' ? '!' : '✓' }}</span>
              <div>
                <h3>{{ $t('docs.ssrDemo.' + selected + 'Findings.' + finding + 'Title') }}</h3>
                <p>{{ $t('docs.ssrDemo.' + selected + 'Findings.' + finding + 'Text') }}</p>
              </div>
            </li>
          </ul>
          <p class="ssr-demo__takeaway">{{ $t('docs.ssrDemo.' + selected + 'Takeaway') }}</p>
        </div>
      </div>
      <p class="ssr-demo__fix"><span aria-hidden="true">↳</span><span>{{ $t('docs.ssrDemo.fix') }}</span></p>
    </div>
    <details class="ssr-demo__evidence">
      <summary><span>{{ $t('docs.ssrDemo.details') }}</span><span class="ssr-demo__expand" aria-hidden="true">+</span></summary>
      <div class="ssr-demo__evidence-body">
        <p class="ssr-demo__method">{{ $t('docs.ssrDemo.method', { date: verifiedDisplay }) }} {{ $t('docs.ssrDemo.previewNote') }}</p>
        <div class="ssr-demo__measurements">
          <article v-for="phase in phases" :key="phase.key">
            <h3>{{ $t('docs.ssrDemo.' + phase.key) }}</h3>
            <dl>
              <dt>{{ $t('docs.ssrDemo.rawTitle') }}</dt><dd><code>{{ phase.data.raw.title }}</code></dd>
              <dt>{{ $t('docs.ssrDemo.renderedTitle') }}</dt><dd><code>{{ phase.data.rendered.title }}</code></dd>
              <dt>{{ $t('docs.ssrDemo.rawWords') }}</dt><dd>{{ phase.data.raw.wordCount }}</dd>
              <dt>{{ $t('docs.ssrDemo.renderedWords') }}</dt><dd>{{ phase.data.rendered.wordCount }}</dd>
              <dt>{{ $t('docs.ssrDemo.measuredDifferences') }}</dt><dd>{{ phase.data.detectedRules.length }} / {{ demo.rulesChecked.length }}</dd>
            </dl>
            <details class="ssr-demo__source">
              <summary>{{ $t('docs.ssrDemo.source') }}</summary>
              <pre tabindex="0" role="region" :aria-label="$t('docs.ssrDemo.source') + ' — ' + $t('docs.ssrDemo.' + phase.key)"><code>{{ phase.data.code }}</code></pre>
            </details>
          </article>
        </div>
        <p class="ssr-demo__method">{{ $t('docs.ssrDemo.countNote') }}</p>
        <nav class="ssr-demo__guides" :aria-label="$t('docs.ssrDemo.guides')">
          <NuxtLink v-for="guide in guides" :key="guide.id" :to="guide.to">{{ guide.label }} <span aria-hidden="true">↗</span></NuxtLink>
        </nav>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import demo from '~~/shared/data/ssr-demo.json'
import { getRuleSlug } from '~~/shared/utils/rule-knowledge'
import { toLocale } from '~~/shared/utils/i18n'
import { INTL_LOCALE } from '~~/shared/utils/format'
import { ssrDemoPreview } from '~/utils/ssr-demo-preview'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const loc = computed(() => toLocale(locale.value))
const phases = [{ key: 'before', data: demo.before }, { key: 'after', data: demo.after }] as const
const selected = ref<'before' | 'after'>('before')
const current = computed(() => demo[selected.value])
const preview = computed(() => ssrDemoPreview(current.value.code))
const verifiedDisplay = computed(() => new Date(demo.verifiedAt).toLocaleDateString(INTL_LOCALE[loc.value], { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }))
const guides = computed(() => demo.rulesChecked.map(id => ({
  id,
  label: t('docs.ssrDemo.guide.' + id),
  to: localePath({ name: 'docs-rules-slug', params: { slug: getRuleSlug(id, loc.value)! } }),
})))
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.ssr-demo {
  color: $color-gray-900;
  &__heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin: 0 4px 20px; }
  &__step { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: $color-gray-600; margin-bottom: 8px; }
  h2 { font-size: clamp(24px, 2.6vw, 30px); line-height: 1.15; letter-spacing: -0.03em; }
  &__hint { color: $color-gray-600; font-size: 13px; line-height: 1.5; max-width: 225px; }
  &__experiment { background: $color-white; border: 1px solid $color-gray-200; border-radius: 24px; overflow: hidden; box-shadow: 0 16px 48px rgb(17 24 39 / 5%); }
  &__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid $color-gray-200; }
  &__switch { display: flex; padding: 4px; background: $color-gray-100; border: 1px solid $color-gray-200; border-radius: 12px; }
  &__switch button {
    display: inline-flex; justify-content: center; align-items: center; gap: 8px;
    min-height: 44px; padding: 10px 18px; border: 1px solid transparent; border-radius: 9px;
    color: $color-gray-600; background: transparent; font: inherit; font-size: 14px; cursor: pointer;
    transition: background 150ms, box-shadow 150ms;
    &[aria-pressed='true'] { background: $color-white; border-color: $color-gray-200; color: $color-gray-900; box-shadow: 0 2px 5px rgb(17 24 39 / 6%); }
    &:hover { color: $color-gray-900; }
  }
  &__phase-dot { width: 6px; height: 6px; background: #b45309; border-radius: 50%; flex-shrink: 0; }
  &__phase-dot--after { background: #15803d; }
  &__scope { font-size: 12px; color: #92400e; background: #fffbeb; padding: 6px 10px; border-radius: 7px; }
  &__scope--after { color: #166534; background: #f0fdf4; }
  &__observation { display: grid; grid-template-columns: 1.08fr 1fr; }
  &__browser { min-width: 0; margin: 24px; align-self: start; border: 1px solid $color-gray-200; border-radius: 12px; overflow: hidden; }
  figcaption { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-bottom: 1px solid $color-gray-200; background: $color-gray-50; color: $color-gray-600; font-size: 11px; }
  &__browser-dots { display: flex; gap: 4px; }
  &__browser-dots i { width: 6px; height: 6px; background: $color-gray-300; border-radius: 50%; }
  &__language { margin-left: auto; padding: 2px 5px; border: 1px solid $color-gray-200; border-radius: 4px; font-size: 10px; }
  &__frame { display: block; width: 100%; height: 310px; border: 0; background: $color-white; }
  &__caption { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: $color-gray-50; border-top: 1px solid $color-gray-200; color: $color-gray-600; font-size: 12px; line-height: 1.5; }
  &__caption > span { font-size: 20px; color: $color-info; }
  &__nojs { font-size: 13px; padding: 12px 16px; line-height: 1.5; }
  &__diagnosis { padding: 28px 32px 24px 8px; --signal: #92400e; --signal-bg: #fffbeb; }
  &__diagnosis--after { --signal: #166534; --signal-bg: #f0fdf4; }
  &__label { font-size: 11px; color: $color-gray-600; letter-spacing: 0.07em; text-transform: uppercase; }
  &__verdict { display: flex; align-items: center; gap: 18px; margin: 10px 0 22px; }
  &__verdict strong { color: var(--signal); font-size: 76px; line-height: 1; font-weight: 600; letter-spacing: -0.06em; font-variant-numeric: tabular-nums; }
  &__verdict p { max-width: 190px; color: $color-gray-900; font-size: 23px; line-height: 1.1; letter-spacing: -0.02em; text-wrap: pretty; }
  &__findings { list-style: none; padding: 0; margin: 0; }
  &__findings li { display: flex; align-items: flex-start; gap: 12px; padding: 14px 0; border-top: 1px solid $color-gray-200; }
  &__finding-icon { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; flex-shrink: 0; margin-top: 2px; border-radius: 7px; background: var(--signal-bg); color: var(--signal); font-size: 14px; font-weight: 600; }
  h3 { font-size: 16px; line-height: 1.3; letter-spacing: -0.015em; }
  &__findings p { color: $color-gray-600; font-size: 13px; line-height: 1.5; margin-top: 4px; }
  &__takeaway { color: var(--signal); background: var(--signal-bg); padding: 12px 14px; margin-top: 8px; border-radius: 10px; font-size: 13px; line-height: 1.5; }
  &__fix { display: flex; gap: 12px; align-items: baseline; border-top: 1px solid $color-gray-200; padding: 18px 24px; color: $color-gray-700; background: $color-gray-50; font-size: 14px; line-height: 1.6; }
  &__fix > span:first-child { color: $color-info; font-size: 20px; }
  &__evidence { margin-top: 16px; border: 1px solid $color-gray-200; border-radius: 16px; background: $color-white; overflow: hidden; }
  summary { cursor: pointer; }
  &__evidence > summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; list-style: none; padding: 20px 24px; font-size: 14px; }
  &__evidence > summary::-webkit-details-marker { display: none; }
  &__expand { font-size: 24px; line-height: 1; color: $color-gray-600; }
  &__evidence[open] > summary { border-bottom: 1px solid $color-gray-200; }
  &__evidence[open] &__expand { transform: rotate(45deg); }
  &__evidence-body { padding: 24px; }
  &__method { color: $color-gray-600; font-size: 13px; line-height: 1.65; }
  &__measurements { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px; margin: 24px 0; }
  &__measurements article { min-width: 0; }
  &__measurements h3 { margin-bottom: 16px; }
  dt { font-size: 12px; color: $color-gray-600; margin-top: 12px; }
  dd { margin: 4px 0 0; overflow-wrap: anywhere; font-size: 14px; }
  code { font-family: $font-family-mono; font-size: 12px; }
  &__source { margin-top: 20px; }
  &__source summary { color: $color-info; font-size: 13px; text-decoration: underline; text-underline-offset: 3px; }
  pre { max-height: 280px; overflow: auto; margin-top: 12px; padding: 16px; border-radius: 8px; background: $color-gray-50; line-height: 1.6; }
  &__guides { display: flex; flex-wrap: wrap; gap: 12px 24px; margin-top: 18px; }
  &__guides a { color: $color-info; font-size: 13px; line-height: 1.5; text-underline-offset: 3px; }
  button:focus-visible, summary:focus-visible, a:focus-visible, pre:focus-visible, iframe:focus-visible { outline: 3px solid $color-info; outline-offset: -3px; }
  @media (max-width: $breakpoint-md) {
    &__heading { align-items: flex-start; }
    &__hint { max-width: 180px; }
    &__observation { grid-template-columns: 1fr 1fr; }
    &__browser { margin: 20px 16px; }
    &__diagnosis { padding: 24px 20px 20px 4px; }
    &__verdict p { font-size: 20px; }
  }
  @media (max-width: $breakpoint-sm) {
    &__heading { display: block; margin-bottom: 16px; }
    &__hint { max-width: none; margin-top: 10px; font-size: 13px; }
    &__experiment { border-radius: 20px; }
    &__toolbar { padding: 12px; flex-direction: column; gap: 10px; }
    &__switch { width: 100%; }
    &__switch button { flex: 1; padding: 10px 6px; font-size: 12px; gap: 6px; }
    &__scope { font-size: 11px; }
    &__observation { grid-template-columns: 1fr; }
    &__browser { margin: 16px 16px 0; }
    &__browser-dots { display: none; }
    &__frame { height: 220px; }
    &__caption { font-size: 11px; padding: 10px 12px; }
    &__diagnosis { padding: 24px 20px 20px; }
    &__verdict { margin-bottom: 16px; }
    &__verdict strong { font-size: 64px; }
    &__verdict p { font-size: 23px; max-width: 180px; }
    &__fix { padding: 16px 20px; font-size: 13px; }
    &__evidence > summary { padding: 18px 20px; }
    &__evidence-body { padding: 20px; }
    &__measurements { grid-template-columns: 1fr; gap: 28px; }
  }
  @media (prefers-reduced-motion: reduce) { &__switch button { transition: none; } }
}
</style>

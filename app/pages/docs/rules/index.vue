<template>
  <div class="docs-rules">
    <div class="docs-rules__container">
      <nav class="docs-rules__crumb" :aria-label="$t('docs.fiche.crumbAria')">
        <span class="docs-rules__crumb-current">{{ $t('docs.fiche.crumbRules') }}</span>
      </nav>
      <h1 class="docs-rules__title">{{ $t('docs.rules.title') }}</h1>
      <p class="docs-rules__subtitle">{{ $t('docs.rules.subtitle', { count: total }) }}</p>

      <!-- Régressions -->
      <div class="docs-rules__block">
        <div class="docs-rules__block-header">
          <div>
            <h2 class="docs-rules__block-title">{{ $t('docs.rules.monitoringTitle') }}</h2>
            <p class="docs-rules__block-desc">{{ $t('docs.rules.monitoringDesc') }}</p>
          </div>
          <span class="docs-rules__block-count">{{ $t('docs.rules.rulesCount', { count: monitoringCount }) }}</span>
        </div>

        <div class="docs-rules__sections">
          <template v-for="(group, key) in groups" :key="key">
            <div v-if="!String(key).includes('REC')" class="docs-rules__section">
              <div class="docs-rules__section-header">
                <h3 :class="['docs-rules__section-title', `docs-rules__section-title--${key}`]">{{ group.label }}</h3>
                <span class="docs-rules__section-meta">{{ group.description }} · {{ $t('docs.rules.rulesCount', { count: group.rules.length }) }}</span>
              </div>
              <div class="docs-rules__table-wrap">
                <table class="docs-rules__table">
                  <thead>
                    <tr>
                      <th v-if="isDev">Rule ID</th>
                      <th>{{ $t('docs.rules.thLabel') }}</th>
                      <th class="docs-rules__th-center">{{ $t('docs.rules.thSeverity') }}</th>
                      <th v-if="isDev" class="docs-rules__th-center">Category</th>
                      <th v-if="isDev" class="docs-rules__th-center">Type</th>
                      <th v-if="isDev">File</th>
                      <th class="docs-rules__th-center">{{ $t('docs.rules.thDetails') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="rule in group.rules" :key="rule.id">
                      <td v-if="isDev" class="docs-rules__cell-mono">{{ rule.id }}</td>
                      <td class="docs-rules__cell-label">{{ rule.label }}</td>
                      <td class="docs-rules__cell-center">
                        <span :class="['docs-rules__badge', `docs-rules__badge--${rule.severity.split('/')[0]}`]">{{ rule.severity }}</span>
                      </td>
                      <td v-if="isDev" class="docs-rules__cell-center docs-rules__cell-dim">{{ rule.category }}</td>
                      <td v-if="isDev" class="docs-rules__cell-center docs-rules__cell-dim">{{ rule.type }}</td>
                      <td v-if="isDev" class="docs-rules__cell-mono docs-rules__cell-dim">{{ rule.file }}</td>
                      <td class="docs-rules__cell-center">
                        <NuxtLink :to="localePath({ name: 'docs-rules-slug', params: { slug: slugOf(rule.id) } })" class="docs-rules__detail-btn">{{ $t('docs.rules.readFiche') }}</NuxtLink>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
      </div>

      <hr class="docs-rules__divider">

      <!-- Audit -->
      <div class="docs-rules__block">
        <div class="docs-rules__block-header">
          <div>
            <h2 class="docs-rules__block-title">{{ $t('docs.rules.auditTitle') }}</h2>
            <p class="docs-rules__block-desc">{{ $t('docs.rules.auditDesc') }}</p>
          </div>
          <span class="docs-rules__block-count">{{ $t('docs.rules.rulesCount', { count: recommendationsCount }) }}</span>
        </div>

        <div class="docs-rules__sections">
          <template v-for="(group, key) in groups" :key="key">
            <div v-if="String(key).includes('REC')" class="docs-rules__section">
              <div class="docs-rules__section-header">
                <h3 :class="['docs-rules__section-title', `docs-rules__section-title--${key}`]">{{ group.label }}</h3>
                <span class="docs-rules__section-meta">{{ group.description }} · {{ $t('docs.rules.rulesCount', { count: group.rules.length }) }}</span>
              </div>
              <div class="docs-rules__table-wrap">
                <table class="docs-rules__table">
                  <thead>
                    <tr>
                      <th v-if="isDev">Rule ID</th>
                      <th>{{ $t('docs.rules.thLabel') }}</th>
                      <th class="docs-rules__th-center">{{ $t('docs.rules.thSeverity') }}</th>
                      <th v-if="isDev" class="docs-rules__th-center">Type</th>
                      <th v-if="isDev">File</th>
                      <th class="docs-rules__th-center">{{ $t('docs.rules.thDetails') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="rule in group.rules" :key="rule.id">
                      <td v-if="isDev" class="docs-rules__cell-mono">{{ rule.id }}</td>
                      <td class="docs-rules__cell-label">{{ rule.label }}</td>
                      <td class="docs-rules__cell-center">
                        <span :class="['docs-rules__badge', `docs-rules__badge--${rule.severity.split('/')[0]}`]">{{ rule.severity }}</span>
                      </td>
                      <td v-if="isDev" class="docs-rules__cell-center docs-rules__cell-dim">{{ rule.type }}</td>
                      <td v-if="isDev" class="docs-rules__cell-mono docs-rules__cell-dim">{{ rule.file }}</td>
                      <td class="docs-rules__cell-center">
                        <NuxtLink :to="localePath({ name: 'docs-rules-slug', params: { slug: slugOf(rule.id) } })" class="docs-rules__detail-btn">{{ $t('docs.rules.readFiche') }}</NuxtLink>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
      </div>

      <p class="docs-rules__compare-links">
        {{ $t('compare.links.hubLabel') }} :
        <NuxtLink :to="localePath({ name: 'oseox-vs-seogard' })">{{ $t('compare.links.vsAnchor') }}</NuxtLink>
        ·
        <NuxtLink :to="localePath({ name: 'alternative-oseox' })">{{ $t('compare.links.altAnchor') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getRulesCatalog, getPriorityMeta } from '~~/shared/utils/rules-catalog'
import { getPublishedRuleIds } from '~~/shared/utils/rules-list'
import { getRuleSlug } from '~~/shared/utils/rule-knowledge'
import { toLocale } from '~~/shared/utils/i18n'

definePageMeta({ layout: 'docs', auth: false })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const isDev = import.meta.dev
const loc = computed(() => toLocale(locale.value))

// SSR direct : le catalogue est rendu côté serveur (l'ancien endpoint /api/public/rules est supprimé).
const rules = computed(() => getRulesCatalog(loc.value))
const priorityMeta = computed(() => getPriorityMeta(loc.value))

interface Rule { id: string, label: string, severity: string, type: string, file: string, priority: string, category: string, description: string }

const groups = computed<Record<string, { label: string, description: string, rules: Rule[] }>>(() => {
  const grouped: Record<string, { label: string, description: string, rules: Rule[] }> = {}
  for (const rule of rules.value) {
    let group = grouped[rule.priority]
    if (!group) {
      const meta = priorityMeta.value[rule.priority] ?? { label: rule.priority, description: '' }
      group = { label: meta.label, description: meta.description, rules: [] }
      grouped[rule.priority] = group
    }
    group.rules.push(rule)
  }
  return grouped
})

const total = computed(() => rules.value.length)
const monitoringCount = computed(() => rules.value.filter(r => !r.priority.includes('REC')).length)
const recommendationsCount = computed(() => rules.value.filter(r => r.priority.includes('REC')).length)

function slugOf(id: string): string { return getRuleSlug(id, loc.value) ?? '' }

const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
const abs = (name: string): string => `${appUrl}${localePath({ name })}`
const ogImage = computed(() => `${appUrl}${loc.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)

// Liste des fiches publiées → ItemList (annuaire citable). Vide tant qu'aucune vague n'est publiée.
const publishedFiches = computed(() => getPublishedRuleIds()
  .map((id, i) => {
    const rule = rules.value.find(r => r.id === id)
    const slug = getRuleSlug(id, loc.value)
    if (!rule || !slug) return null
    return { '@type': 'ListItem', 'position': i + 1, 'name': rule.label, 'url': `${appUrl}${localePath({ name: 'docs-rules-slug', params: { slug } })}` }
  })
  .filter(Boolean))

useHead(() => {
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'CollectionPage',
      'name': t('docs.rules.title'),
      'inLanguage': loc.value,
      'url': abs('docs-rules'),
    },
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': t('docs.fiche.crumbHome'), 'item': abs('index') },
        { '@type': 'ListItem', 'position': 2, 'name': t('docs.fiche.crumbRules'), 'item': abs('docs-rules') },
      ],
    },
  ]
  if (publishedFiches.value.length) {
    graph.push({ '@type': 'ItemList', 'name': t('docs.rules.title'), 'itemListElement': publishedFiches.value })
  }
  return {
    title: t('seo.docsRules.title'),
    script: [{ type: 'application/ld+json', innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }) }],
  }
})

useSeoMeta({
  description: () => t('seo.docsRules.description', { count: total.value }),
  ogImage: () => ogImage.value,
  twitterCard: 'summary_large_image',
  twitterImage: () => ogImage.value,
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.docs-rules {
  &__container { max-width: 100%; }

  &__crumb { font-size: $font-size-xs; color: $color-gray-400; margin-bottom: $spacing-3; }
  &__crumb-current { color: $color-gray-500; }

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 $spacing-1;
    letter-spacing: -0.03em;
  }

  &__subtitle { font-size: $font-size-sm; color: $color-gray-500; margin: 0 0 $spacing-8; }

  &__compare-links {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin: $spacing-10 0 0;
    padding-top: $spacing-6;
    border-top: 1px solid $color-gray-100;

    a { color: $color-gray-900; text-decoration: underline; text-underline-offset: 2px; }
    a:hover { color: $color-accent; }
  }

  &__block { margin-bottom: $spacing-4; }

  &__block-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $spacing-4;
    margin-bottom: $spacing-6;
  }

  &__block-title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 $spacing-1;
    letter-spacing: -0.02em;
  }

  &__block-desc { font-size: $font-size-sm; color: $color-gray-500; margin: 0; max-width: 600px; line-height: $line-height-normal; }

  &__block-count { font-size: $font-size-sm; font-weight: $font-weight-semibold; color: $color-gray-400; white-space: nowrap; flex-shrink: 0; padding-top: $spacing-1; }

  &__divider { border: none; border-top: 1px solid $color-gray-200; margin: $spacing-10 0; }

  &__sections { display: flex; flex-direction: column; gap: $spacing-8; }

  &__section-header { display: flex; align-items: baseline; gap: $spacing-3; margin-bottom: $spacing-3; flex-wrap: wrap; }

  &__section-title {
    margin: 0;
    font-size: $font-size-base;
    font-weight: $font-weight-bold;

    &--P0 { color: $color-danger; }
    &--P1 { color: $color-warning; }
    &--P2 { color: #d97706; }
    &--P3 { color: $color-gray-500; }
    &--GEO,
    &--GEO-REC { color: $color-info; }
    &--REC { color: $color-success; }
  }

  &__section-meta { font-size: $font-size-xs; color: $color-gray-400; }

  &__table-wrap { overflow-x: auto; border: 1px solid $color-gray-200; border-radius: $radius-md; background: $surface-card; }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: $font-size-sm;

    th {
      padding: $spacing-2 $spacing-3;
      text-align: left;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      color: $color-gray-500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: $surface-elevated;
      border-bottom: 1px solid $color-gray-200;
      white-space: nowrap;
    }

    td { padding: $spacing-2 $spacing-3; border-bottom: 1px solid $color-gray-100; }
    tr:last-child td { border-bottom: none; }
  }

  &__th-center { text-align: center !important; }

  &__cell-mono { font-family: $font-family-mono; font-size: $font-size-xs; color: $color-gray-700; white-space: nowrap; }
  &__cell-label { font-weight: $font-weight-medium; color: $color-gray-900; }
  &__cell-center { text-align: center; }
  &__cell-dim { color: $color-gray-500; font-size: $font-size-xs; }

  &__badge {
    display: inline-block;
    padding: 2px $spacing-2;
    border-radius: $radius-sm;
    font-size: 11px;
    font-weight: $font-weight-semibold;

    &--critical { background: $color-danger-bg; color: $color-danger; }
    &--warning { background: $color-warning-bg; color: $color-warning; }
    &--info { background: $color-gray-100; color: $color-gray-500; }
  }

  &__detail-btn {
    display: inline-block;
    background: none;
    border: 1px solid $color-gray-200;
    border-radius: $radius-sm;
    padding: 2px $spacing-3;
    font-size: $font-size-xs;
    color: $color-accent;
    font-weight: $font-weight-medium;
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
    transition: all $transition-fast;

    &:hover { background: rgba($color-accent, 0.05); border-color: rgba($color-accent, 0.3); }
  }
}
</style>

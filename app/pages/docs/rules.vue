<template>
  <div class="docs-rules">
    <div class="docs-rules__container">
      <h1 class="docs-rules__title">{{ $t('docs.rules.title') }}</h1>
      <p class="docs-rules__subtitle">{{ $t('docs.rules.subtitle', { count: data?.total ?? '' }) }}</p>

      <template v-if="data">
        <!-- Régressions -->
        <div class="docs-rules__block">
          <div class="docs-rules__block-header">
            <div>
              <h2 class="docs-rules__block-title">{{ $t('docs.rules.monitoringTitle') }}</h2>
              <p class="docs-rules__block-desc">{{ $t('docs.rules.monitoringDesc') }}</p>
            </div>
            <span class="docs-rules__block-count">{{ $t('docs.rules.rulesCount', { count: data.monitoring }) }}</span>
          </div>

          <div class="docs-rules__sections">
            <template v-for="(group, key) in data.groups" :key="key">
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
                          <span :class="['docs-rules__badge', `docs-rules__badge--${rule.severity.split('/')[0]}`]">
                            {{ rule.severity }}
                          </span>
                        </td>
                        <td v-if="isDev" class="docs-rules__cell-center docs-rules__cell-dim">{{ rule.category }}</td>
                        <td v-if="isDev" class="docs-rules__cell-center docs-rules__cell-dim">{{ rule.type }}</td>
                        <td v-if="isDev" class="docs-rules__cell-mono docs-rules__cell-dim">{{ rule.file }}</td>
                        <td class="docs-rules__cell-center">
                          <button class="docs-rules__detail-btn" @click="openModal(rule)">{{ $t('docs.rules.detailBtn') }}</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Séparateur -->
        <hr class="docs-rules__divider">

        <!-- Audit -->
        <div class="docs-rules__block">
          <div class="docs-rules__block-header">
            <div>
              <h2 class="docs-rules__block-title">{{ $t('docs.rules.auditTitle') }}</h2>
              <p class="docs-rules__block-desc">{{ $t('docs.rules.auditDesc') }}</p>
            </div>
            <span class="docs-rules__block-count">{{ $t('docs.rules.rulesCount', { count: data.recommendations }) }}</span>
          </div>

          <div class="docs-rules__sections">
            <template v-for="(group, key) in data.groups" :key="key">
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
                          <span :class="['docs-rules__badge', `docs-rules__badge--${rule.severity.split('/')[0]}`]">
                            {{ rule.severity }}
                          </span>
                        </td>
                        <td v-if="isDev" class="docs-rules__cell-center docs-rules__cell-dim">{{ rule.type }}</td>
                        <td v-if="isDev" class="docs-rules__cell-mono docs-rules__cell-dim">{{ rule.file }}</td>
                        <td class="docs-rules__cell-center">
                          <button class="docs-rules__detail-btn" @click="openModal(rule)">{{ $t('docs.rules.detailBtn') }}</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <AppSpinner v-else :label="$t('docs.rules.loading')" />
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="selectedRule" class="docs-rules-modal" @click.self="selectedRule = null">
        <div class="docs-rules-modal__content">
          <div class="docs-rules-modal__header">
            <h3 class="docs-rules-modal__title">{{ selectedRule.label }}</h3>
            <button class="docs-rules-modal__close" @click="selectedRule = null">&times;</button>
          </div>
          <div class="docs-rules-modal__body">
            <p class="docs-rules-modal__description">{{ selectedRule.description }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'docs', auth: false })

const { t, locale } = useI18n()

const isDev = import.meta.dev

const { data } = await useFetch('/api/public/rules', { query: { locale } })

const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
const ogImage = computed(() => `${appUrl}${locale.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)

useHead({ title: t('seo.docsRules.title') })
useSeoMeta({
  description: t('seo.docsRules.description', { count: data.value?.total ?? '' }),
  ogImage: ogImage.value,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage.value,
})

interface Rule {
  id: string
  label: string
  severity: string
  type: string
  file: string
  priority: string
  category: string
  description: string
}

const selectedRule = ref<Rule | null>(null)

function openModal(rule: Rule) {
  selectedRule.value = rule
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.docs-rules {
  &__container {
    max-width: 100%;
  }

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 $spacing-1;
    letter-spacing: -0.03em;
  }

  &__subtitle {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin: 0 0 $spacing-8;
  }

  &__block {
    margin-bottom: $spacing-4;
  }

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

  &__block-desc {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin: 0;
    max-width: 600px;
    line-height: $line-height-normal;
  }

  &__block-count {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-400;
    white-space: nowrap;
    flex-shrink: 0;
    padding-top: $spacing-1;
  }

  &__divider {
    border: none;
    border-top: 1px solid $color-gray-200;
    margin: $spacing-10 0;
  }

  &__sections {
    display: flex;
    flex-direction: column;
    gap: $spacing-8;
  }

  &__section-header {
    display: flex;
    align-items: baseline;
    gap: $spacing-3;
    margin-bottom: $spacing-3;
    flex-wrap: wrap;
  }

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

  &__section-meta {
    font-size: $font-size-xs;
    color: $color-gray-400;
  }

  &__table-wrap {
    overflow-x: auto;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $surface-card;
  }

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

    td {
      padding: $spacing-2 $spacing-3;
      border-bottom: 1px solid $color-gray-100;
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  &__th-center {
    text-align: center !important;
  }

  &__cell-mono {
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    color: $color-gray-700;
    white-space: nowrap;
  }

  &__cell-label {
    font-weight: $font-weight-medium;
    color: $color-gray-900;
  }

  &__cell-center {
    text-align: center;
  }

  &__cell-dim {
    color: $color-gray-500;
    font-size: $font-size-xs;
  }

  &__badge {
    display: inline-block;
    padding: 2px $spacing-2;
    border-radius: $radius-sm;
    font-size: 11px;
    font-weight: $font-weight-semibold;

    &--critical {
      background: $color-danger-bg;
      color: $color-danger;
    }

    &--warning {
      background: $color-warning-bg;
      color: $color-warning;
    }

    &--info {
      background: $color-gray-100;
      color: $color-gray-500;
    }
  }

  &__detail-btn {
    background: none;
    border: 1px solid $color-gray-200;
    border-radius: $radius-sm;
    padding: 2px $spacing-3;
    font-size: $font-size-xs;
    color: $color-accent;
    font-weight: $font-weight-medium;
    cursor: pointer;
    white-space: nowrap;
    transition: all $transition-fast;

    &:hover {
      background: rgba($color-accent, 0.05);
      border-color: rgba($color-accent, 0.3);
    }
  }
}

// Modal
.docs-rules-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  padding: $spacing-4;

  &__content {
    background: white;
    border-radius: $radius-lg;
    max-width: 520px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-5 $spacing-6;
    border-bottom: 1px solid $color-gray-100;
  }

  &__title {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
  }

  &__close {
    background: none;
    border: none;
    font-size: 24px;
    color: $color-gray-400;
    cursor: pointer;
    padding: 0;
    line-height: 1;

    &:hover {
      color: $color-gray-600;
    }
  }

  &__body {
    padding: $spacing-6;
  }

  &__description {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
    margin: 0;
  }
}
</style>

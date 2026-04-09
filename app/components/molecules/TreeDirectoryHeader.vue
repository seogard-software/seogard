<template>
  <div v-if="node" class="tree-directory-header" @click="$emit('select', node.id)">
    <!-- Left: path + health bar -->
    <div class="tree-directory-header__left">
      <div class="tree-directory-header__title-row">
        <div class="tree-directory-header__icon-box">
          <AppIcon name="folder" size="md" />
        </div>
        <div class="tree-directory-header__title-info">
          <h2 class="tree-directory-header__path">{{ node.path === '/' ? node.label : node.path }}</h2>
          <span class="tree-directory-header__subtitle">
            {{ formatNumber(node.totalPageCount) }} page{{ node.totalPageCount > 1 ? 's' : '' }}
            dans ce répertoire
          </span>
        </div>
        <AppSpinner v-if="loading" size="sm" class="tree-directory-header__spinner" />
      </div>

      <div v-if="!neverCrawled" class="tree-directory-header__bar-track">
        <div
          class="tree-directory-header__bar-fill"
          :class="`tree-directory-header__bar-fill--${healthLevel}`"
          :style="{ width: `${node.healthScore}%` }"
        />
      </div>
    </div>

    <!-- Right: stats grid -->
    <div class="tree-directory-header__stats">
      <template v-if="neverCrawled">
        <div class="tree-directory-header__stat">
          <span class="tree-directory-header__stat-value">{{ formatNumber(node.totalPageCount) }}</span>
          <span class="tree-directory-header__stat-label">Pages</span>
        </div>
        <div class="tree-directory-header__stat-divider" />
        <div class="tree-directory-header__stat">
          <span class="tree-directory-header__stat-value tree-directory-header__stat-value--muted">—</span>
          <span class="tree-directory-header__stat-label">Aucun crawl</span>
        </div>
      </template>
      <template v-else>
        <div class="tree-directory-header__stat">
          <span class="tree-directory-header__stat-value" :class="`tree-directory-header__stat-value--${healthLevel}`">
            {{ node.healthScore }}
          </span>
          <span class="tree-directory-header__stat-label">Santé</span>
        </div>
        <div class="tree-directory-header__stat-divider" />
        <div class="tree-directory-header__stat">
          <span class="tree-directory-header__stat-value">{{ formatNumber(node.totalPageCount) }}</span>
          <span class="tree-directory-header__stat-label">Pages</span>
        </div>
        <div class="tree-directory-header__stat-divider" />
        <div class="tree-directory-header__stat">
          <span
            class="tree-directory-header__stat-value"
            :class="{ 'tree-directory-header__stat-value--danger': node.regressionCount > 0 }"
          >
            {{ formatNumber(node.regressionCount) }}
          </span>
          <span class="tree-directory-header__stat-label">Régressions</span>
        </div>
        <div class="tree-directory-header__stat-divider" />
        <div class="tree-directory-header__stat">
          <span
            class="tree-directory-header__stat-value"
            :class="{ 'tree-directory-header__stat-value--info': node.recommendationCount > 0 }"
          >
            {{ formatNumber(node.recommendationCount) }}
          </span>
          <span class="tree-directory-header__stat-label">Reco</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from '~~/shared/utils/format'

interface Props {
  node: TreeNode | null
  loading?: boolean
  neverCrawled?: boolean
}

defineEmits<{
  select: [id: string]
}>()

const props = defineProps<Props>()

const healthLevel = computed(() => {
  if (!props.node) return 'good'
  if (props.node.healthScore >= 80) return 'good'
  if (props.node.healthScore >= 50) return 'medium'
  return 'low'
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.tree-directory-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: $spacing-8;
  padding: $spacing-6;
  background: $surface-card;
  border: 1px solid $color-gray-200;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: border-color $transition-base, background-color $transition-base;
  overflow: hidden;

  // Subtle gradient accent on left
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, $color-gray-500 0%, $color-gray-300 100%);
    border-radius: 3px 0 0 3px;
  }

  &:hover {
    border-color: $color-gray-300;
    background: $surface-elevated;
  }

  // ── Left ──
  &__left {
    flex: 1;
    min-width: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    margin-bottom: $spacing-4;
  }

  &__icon-box {
    width: 40px;
    height: 40px;
    border-radius: $radius-md;
    background: $color-gray-50;
    border: 1px solid $color-gray-200;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-gray-600;
    flex-shrink: 0;
  }

  &__title-info {
    flex: 1;
    min-width: 0;
  }

  &__path {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    font-family: $font-family-mono;
    color: $color-gray-900;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
  }

  &__subtitle {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__spinner {
    flex-shrink: 0;
    padding: 0;

    :deep(.app-spinner__ring) {
      width: 16px;
      height: 16px;
      border-width: 2px;
    }
  }

  // ── Health bar ──
  &__bar-track {
    width: 100%;
    max-width: 360px;
    height: 4px;
    background: $color-gray-200;
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: $radius-full;
    transition: width 0.5s ease;

    &--good { background: $color-success; }
    &--medium { background: $color-warning; }
    &--low { background: $color-danger; }
  }

  // ── Stats ──
  &__stats {
    display: flex;
    align-items: center;
    gap: $spacing-4;
    flex-shrink: 0;
  }

  &__stat {
    text-align: center;
    min-width: 52px;
  }

  &__stat-divider {
    width: 1px;
    height: 32px;
    background: $color-gray-200;
  }

  &__stat-value {
    display: block;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-gray-800;
    letter-spacing: -0.02em;
    line-height: $line-height-tight;

    &--good { color: $color-success; }
    &--medium { color: $color-warning; }
    &--low { color: $color-danger; }

    &--danger,
    &--info {
      color: $color-gray-800;
    }

    &--muted {
      color: $color-gray-400;
    }
  }

  &__stat-label {
    font-size: $font-size-xs;
    color: $color-gray-500;
    margin-top: 2px;
  }
}
</style>

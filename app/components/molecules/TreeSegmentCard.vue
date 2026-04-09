<template>
  <div :class="['tree-segment-card', severityClass]" @click="$emit('drill', data.id)">
    <!-- Top row: icon + label -->
    <div class="tree-segment-card__header">
      <div class="tree-segment-card__icon-box">
        <AppIcon name="folder" size="sm" />
      </div>
      <div class="tree-segment-card__title">
        <span class="tree-segment-card__label">{{ data.path === '/' ? data.label : `/${data.label}` }}</span>
        <span class="tree-segment-card__pages">{{ data.totalPageCount }} page{{ data.totalPageCount > 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Health bar -->
    <div v-if="!neverCrawled" class="tree-segment-card__bar-track">
      <div
        class="tree-segment-card__bar-fill"
        :style="{ width: `${data.healthScore}%` }"
      />
    </div>

    <!-- Footer: tags + chevron -->
    <div class="tree-segment-card__footer">
      <div class="tree-segment-card__tags">
        <span v-if="data.regressionCount > 0" class="tree-segment-card__tag tree-segment-card__tag--regression">
          {{ data.regressionCount }} régression{{ data.regressionCount > 1 ? 's' : '' }}
        </span>
        <span v-if="data.recommendationCount > 0" class="tree-segment-card__tag tree-segment-card__tag--recommendation">
          {{ data.recommendationCount }} reco
        </span>
        <span v-if="data.regressionCount === 0 && data.recommendationCount === 0" class="tree-segment-card__tag tree-segment-card__tag--clean">
          {{ neverCrawled ? 'Aucun crawl lancé' : 'Aucun problème' }}
        </span>
      </div>
      <AppIcon name="chevron-right" size="sm" class="tree-segment-card__chevron" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: TreeNode
  neverCrawled?: boolean
}

defineEmits<{
  drill: [id: string]
  select: [id: string]
}>()

const props = defineProps<Props>()

const severityClass = computed(() => {
  if (!props.data.worstSeverity) return 'tree-segment-card--ok'
  return `tree-segment-card--${props.data.worstSeverity}`
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.tree-segment-card {
  position: relative;
  padding: $spacing-5;
  background: $surface-card;
  border: 1px solid $color-gray-200;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: border-color $transition-base, background-color $transition-base;
  overflow: hidden;

  // Subtle top accent line
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: $color-gray-300;
    transition: background $transition-base;
  }

  &:hover {
    border-color: $color-gray-300;
    background: $surface-elevated;

    .tree-segment-card__chevron {
      opacity: 1;
      transform: translateX(2px);
    }
  }

  // Severity — flat gray for all
  &--critical::before,
  &--warning::before,
  &--info::before,
  &--ok::before {
    background: $color-gray-300;
  }

  // ── Header ──
  &__header {
    display: flex;
    align-items: flex-start;
    gap: $spacing-3;
    margin-bottom: $spacing-4;
  }

  &__icon-box {
    width: 36px;
    height: 36px;
    border-radius: $radius-md;
    background: $color-gray-50;
    border: 1px solid $color-gray-200;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-gray-500;
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    font-family: $font-family-mono;
    color: $color-gray-900;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__pages {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  // ── Health bar ──
  &__bar-track {
    height: 3px;
    background: $color-gray-200;
    border-radius: $radius-full;
    overflow: hidden;
    margin-bottom: $spacing-4;
  }

  &__bar-fill {
    height: 100%;
    border-radius: $radius-full;
    transition: width 0.4s ease;
    background: $color-gray-500;
  }

  // ── Footer ──
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__tags {
    display: flex;
    gap: $spacing-2;
    flex-wrap: wrap;
  }

  &__tag {
    font-size: 11px;
    font-weight: $font-weight-medium;
    padding: 2px 8px;
    border-radius: $radius-full;

    &--regression {
      background: $color-danger-bg;
      color: $color-danger;
    }

    &--recommendation {
      background: $color-warning-bg;
      color: $color-warning;
    }

    &--clean {
      background: $color-gray-200;
      color: $color-gray-600;
    }
  }

  &__chevron {
    color: $color-gray-400;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity $transition-fast, transform $transition-fast;
  }
}
</style>

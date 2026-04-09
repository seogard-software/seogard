<template>
  <div :class="['tree-leaf-card', severityClass]" @click="$emit('select', data.id)">
    <div class="tree-leaf-card__row">
      <!-- Icon -->
      <div class="tree-leaf-card__icon-box">
        <AppIcon name="file" size="sm" />
      </div>

      <!-- Label + meta below -->
      <div class="tree-leaf-card__info">
        <span class="tree-leaf-card__label">{{ data.label }}</span>
        <div class="tree-leaf-card__meta">
          <span v-if="data.statusCode" class="tree-leaf-card__status">Status : {{ data.statusCode }}</span>
          <span v-if="data.regressionCount > 0" class="tree-leaf-card__tag tree-leaf-card__tag--reg">
            {{ data.regressionCount }} reg
          </span>
          <span v-if="data.recommendationCount > 0" class="tree-leaf-card__tag tree-leaf-card__tag--reco">
            {{ data.recommendationCount }} reco
          </span>
        </div>
      </div>

      <AppIcon name="chevron-right" size="sm" class="tree-leaf-card__chevron" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: TreeNode
}

defineEmits<{
  select: [id: string]
}>()

const props = defineProps<Props>()

const severityClass = computed(() => {
  if (!props.data.worstSeverity) return 'tree-leaf-card--ok'
  return `tree-leaf-card--${props.data.worstSeverity}`
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.tree-leaf-card {
  padding: $spacing-3 $spacing-4;
  background: $surface-card;
  border: 1px solid $color-gray-200;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: border-color $transition-fast, background-color $transition-fast;

  &:hover {
    border-color: $color-gray-300;
    background: $surface-elevated;

    .tree-leaf-card__chevron {
      opacity: 1;
    }
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $spacing-3;
  }

  // ── Icon ──
  &__icon-box {
    width: 28px;
    height: 28px;
    border-radius: $radius-sm;
    background: $color-gray-50;
    border: 1px solid $color-gray-200;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-gray-500;
    flex-shrink: 0;
  }

  // ── Info (label + status) ──
  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__label {
    font-size: $font-size-sm;
    font-family: $font-family-mono;
    color: $color-gray-700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // ── Meta row (status + tags inline) ──
  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 2px;
  }

  &__status {
    font-size: 10px;
    font-family: $font-family-mono;
    color: $color-gray-500;
    background: $color-gray-200;
    padding: 1px 5px;
    border-radius: $radius-sm;
    white-space: nowrap;
  }

  &__tag {
    font-size: 10px;
    font-weight: $font-weight-medium;
    padding: 1px 5px;
    border-radius: $radius-sm;
    white-space: nowrap;

    &--reg {
      background: $color-danger-bg;
      color: $color-danger;
    }

    &--reco {
      background: $color-warning-bg;
      color: $color-warning;
    }
  }

  // ── Chevron ──
  &__chevron {
    color: $color-gray-400;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity $transition-fast;
  }
}
</style>

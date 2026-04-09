<template>
  <span :class="['app-badge', `app-badge--${variant}`, `app-badge--${size}`]">
    <slot />
  </span>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'xs' | 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  variant: 'neutral',
  size: 'sm',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-badge {
  display: inline-flex;
  align-items: center;
  font-weight: $font-weight-semibold;
  border-radius: $radius-full;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  &--xs {
    padding: 0.125rem $spacing-2;
    font-size: 0.625rem;
  }

  &--sm {
    padding: $spacing-1 $spacing-2;
    font-size: $font-size-xs;
  }

  &--md {
    padding: $spacing-1 $spacing-3;
    font-size: $font-size-sm;
  }

  &--success {
    background-color: $color-success-bg;
    color: $color-success;
    border: 1px solid rgba($color-success, 0.1);
  }

  &--warning {
    background-color: $color-warning-bg;
    color: $color-warning;
    border: 1px solid rgba($color-warning, 0.1);
  }

  &--danger {
    background-color: $color-danger-bg;
    color: $color-danger;
    border: 1px solid rgba($color-danger, 0.1);
  }

  &--info {
    background-color: $color-info-bg;
    color: $color-info;
    border: 1px solid rgba($color-info, 0.1);
  }

  &--neutral {
    background-color: $surface-elevated;
    color: $color-gray-600;
    border: 1px solid $color-gray-200;
  }
}
</style>

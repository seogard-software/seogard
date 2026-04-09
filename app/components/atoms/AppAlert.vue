<template>
  <div :class="['app-alert', `app-alert--${variant}`]" role="alert">
    <svg
      class="app-alert__icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <template v-if="variant === 'danger'">
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
        <path d="M10 6v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="10" cy="14" r="0.75" fill="currentColor" />
      </template>
      <template v-else-if="variant === 'warning'">
        <path d="M10 2.5L1.5 17h17L10 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M10 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
      </template>
      <template v-else-if="variant === 'success'">
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
        <path d="M6.5 10.5l2.5 2.5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </template>
      <template v-else>
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
        <path d="M10 9v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="10" cy="6.5" r="0.75" fill="currentColor" />
      </template>
    </svg>
    <span class="app-alert__content">
      <slot />
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'success' | 'warning' | 'danger' | 'info'
}

withDefaults(defineProps<Props>(), {
  variant: 'info',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-alert {
  display: flex;
  align-items: flex-start;
  gap: $spacing-3;
  padding: $spacing-3 $spacing-4;
  border-radius: $radius-lg;
  font-size: $font-size-sm;

  &__icon {
    flex-shrink: 0;
    margin-top: 1px;
  }

  &__content {
    flex: 1;
    line-height: 1.5;
  }

  &--success {
    background-color: $color-success-bg;
    color: $color-success;
    border: 1px solid rgba($color-success, 0.15);
  }

  &--warning {
    background-color: $color-warning-bg;
    color: $color-warning;
    border: 1px solid rgba($color-warning, 0.15);
  }

  &--danger {
    background-color: $color-danger-bg;
    color: $color-danger;
    border: 1px solid rgba($color-danger, 0.15);
  }

  &--info {
    background-color: $color-info-bg;
    color: $color-info;
    border: 1px solid rgba($color-info, 0.15);
  }
}
</style>

<template>
  <button
    :class="['app-button', `app-button--${variant}`, `app-button--${size}`]"
    :disabled="disabled || loading"
    :type="type"
  >
    <span v-if="loading" class="app-button__loader" />
    <slot name="icon-left" />
    <slot />
    <slot name="icon-right" />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
  type: 'button',
})
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '~/assets/styles/variables' as *;

.app-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-2;
  width: fit-content;
  font-weight: $font-weight-medium;
  border: 1px solid transparent;
  border-radius: $radius-lg;
  cursor: pointer;
  transition: all $transition-fast;

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: $color-gray-900;
    color: $color-white;

    &:hover:not(:disabled) {
      background: $color-black;
      box-shadow: $shadow-md;
    }
  }

  &--accent {
    background: $color-gray-900;
    color: $color-white;

    &:hover:not(:disabled) {
      background: $color-black;
      box-shadow: $shadow-md;
    }
  }

  &--secondary {
    background-color: $surface-card;
    color: $color-gray-700;
    border-color: $color-gray-200;

    &:hover:not(:disabled) {
      background-color: $surface-elevated;
      border-color: $color-gray-300;
    }
  }

  &--danger {
    background-color: $color-danger;
    color: $color-white;

    &:hover:not(:disabled) {
      background-color: color.adjust($color-danger, $lightness: -8%);
    }
  }

  &--ghost {
    background-color: transparent;
    color: $color-gray-600;

    &:hover:not(:disabled) {
      background-color: $surface-elevated;
    }
  }

  &--sm {
    padding: $spacing-2 $spacing-4;
    font-size: $font-size-sm;
  }

  &--md {
    padding: $spacing-3 $spacing-5;
    font-size: $font-size-sm;
  }

  &--lg {
    padding: $spacing-3 $spacing-6;
    font-size: $font-size-base;
  }

  &__loader {
    width: 1em;
    height: 1em;
    border: 2px solid currentcolor;
    border-top-color: transparent;
    border-radius: $radius-full;
    animation: spin 0.6s linear infinite;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

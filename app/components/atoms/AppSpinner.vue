<template>
  <div class="app-spinner" :class="`app-spinner--${size}`">
    <div class="app-spinner__ring" />
    <span v-if="label" class="app-spinner__label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  label: undefined,
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-3;
  padding: $spacing-12;

  &__ring {
    border-radius: $radius-full;
    border: 3px solid rgba($color-accent, 0.15);
    border-top-color: $color-accent;
    animation: spin 0.8s linear infinite;
  }

  &--sm &__ring {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }

  &--md &__ring {
    width: 36px;
    height: 36px;
  }

  &--lg &__ring {
    width: 48px;
    height: 48px;
    border-width: 4px;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-gray-500;
    font-weight: $font-weight-medium;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

<template>
  <div :class="['app-toast', `app-toast--${toast.type}`]" role="alert">
    <div class="app-toast__border" />
    <svg
      class="app-toast__icon"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <template v-if="toast.type === 'success'">
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
        <path d="M6.5 10.5l2.5 2.5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </template>
      <template v-else-if="toast.type === 'warning'">
        <path d="M10 2.5L1.5 17h17L10 2.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M10 8v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="10" cy="14.5" r="0.75" fill="currentColor" />
      </template>
      <template v-else-if="toast.type === 'error'">
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
        <path d="M10 6v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="10" cy="14" r="0.75" fill="currentColor" />
      </template>
      <template v-else>
        <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5" />
        <path d="M10 9v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="10" cy="6.5" r="0.75" fill="currentColor" />
      </template>
    </svg>
    <span class="app-toast__message">{{ toast.message }}</span>
    <button class="app-toast__close" aria-label="Fermer" @click="emit('dismiss')">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  toast: {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration: number
  }
}

defineProps<Props>()

const emit = defineEmits<{
  dismiss: []
}>()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-toast {
  position: relative;
  display: flex;
  align-items: center;
  gap: $spacing-3;
  padding: $spacing-3 $spacing-4;
  padding-left: calc($spacing-4 + 4px);
  background: $surface-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-lg;
  min-width: 300px;
  max-width: 420px;
  overflow: hidden;

  &__border {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
  }

  &__icon {
    flex-shrink: 0;
  }

  &__message {
    flex: 1;
    font-size: $font-size-sm;
    color: $color-gray-700;
    line-height: 1.4;
  }

  &__close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: $color-gray-400;
    cursor: pointer;
    border-radius: $radius-sm;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-600;
      background: $surface-elevated;
    }
  }

  &--success {
    .app-toast__border { background: $color-success; }
    .app-toast__icon { color: $color-success; }
  }

  &--error {
    .app-toast__border { background: $color-danger; }
    .app-toast__icon { color: $color-danger; }
  }

  &--warning {
    .app-toast__border { background: $color-warning; }
    .app-toast__icon { color: $color-warning; }
  }

  &--info {
    .app-toast__border { background: $color-info; }
    .app-toast__icon { color: $color-info; }
  }
}
</style>

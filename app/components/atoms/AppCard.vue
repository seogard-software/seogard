<template>
  <div :class="['app-card', { 'app-card--bordered': bordered }]">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  bordered?: boolean
}>(), {
  bordered: true,
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-card {
  background: $surface-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;

  &--bordered {
    border: 1px solid $color-gray-200;
    overflow: hidden;
  }
}
</style>

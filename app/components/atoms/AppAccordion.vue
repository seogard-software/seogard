<template>
  <div :class="['app-accordion', `app-accordion--${size}`]">
    <details v-for="(item, i) in items" :key="i" class="app-accordion__item">
      <summary class="app-accordion__question">{{ item.q }}</summary>
      <p class="app-accordion__answer">{{ item.a }}</p>
    </details>
  </div>
</template>

<script setup lang="ts">
export interface AccordionItem {
  q: string
  a: string
}

withDefaults(defineProps<{
  items: AccordionItem[]
  size?: 'sm' | 'md'
}>(), {
  size: 'md',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-accordion {
  display: flex;
  flex-direction: column;
  gap: $spacing-2;

  &__item {
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;

    &[open] {
      border-color: $color-gray-300;
    }
  }

  &__question {
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &::after {
      content: '+';
      font-size: $font-size-lg;
      color: $color-gray-400;
      flex-shrink: 0;
      margin-left: $spacing-3;
    }

    [open] > &::after {
      content: '−';
    }

    &:hover {
      background: $color-gray-50;
    }

    &::-webkit-details-marker {
      display: none;
    }
  }

  &__answer {
    color: $color-gray-500;
    line-height: $line-height-normal;
    margin: 0;
    border-top: 1px solid $color-gray-100;
  }

  // ─── Size: md (default) ───
  &--md &__question {
    padding: $spacing-4 $spacing-5;
    font-size: $font-size-sm;
  }

  &--md &__answer {
    padding: $spacing-4 $spacing-5;
    font-size: $font-size-sm;
  }

  // ─── Size: sm (compact, footer) ───
  &--sm &__question {
    padding: $spacing-3 $spacing-4;
    font-size: $font-size-xs;
  }

  &--sm &__answer {
    padding: $spacing-3 $spacing-4;
    font-size: $font-size-xs;
  }

  &--sm {
    gap: $spacing-1;
  }
}
</style>

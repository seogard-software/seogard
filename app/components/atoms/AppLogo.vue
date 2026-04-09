<template>
  <div :class="['app-logo', `app-logo--${size}`]">
    <span v-if="showText" class="app-logo__text">
      <span class="app-logo__name">Seogard</span><span class="app-logo__dot">.io</span>
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  showText: true,
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-logo {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: $color-gray-900;

  &__text {
    font-family: $font-family-heading;
    font-weight: 600;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  &__name {
    color: inherit;
  }

  &__dot {
    color: inherit;
  }

  &--sm &__text {
    font-size: $font-size-2xl;
  }

  &--md &__text {
    font-size: $font-size-3xl;
  }

  &--lg &__text {
    font-size: $font-size-4xl;
  }
}
</style>

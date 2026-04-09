<template>
  <header class="dashboard-header">
    <div class="dashboard-header__left">
      <slot name="back" />
    </div>
    <div class="dashboard-header__center">
      <h1 v-if="title" class="dashboard-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="dashboard-header__subtitle">{{ subtitle }}</p>
    </div>
    <div class="dashboard-header__right">
      <slot />
    </div>
  </header>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.dashboard-header {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-6;

  &__left {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    min-width: 120px;
  }

  &__center {
    flex: 1;
    text-align: center;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__subtitle {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin-top: $spacing-1;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    min-width: 120px;
    justify-content: flex-end;
  }
}
</style>

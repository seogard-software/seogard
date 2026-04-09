<template>
  <div class="streak-card">
    <span class="streak-card__text">
      {{ days }}j sans alerte critique
      <span class="streak-card__separator">&middot;</span>
      {{ crawlsToday }} crawl(s)
      <span class="streak-card__separator">&middot;</span>
      {{ lastCrawlLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  days: number
  lastCrawlAt: string | null
  crawlsToday: number
}

const props = defineProps<Props>()

const { $dayjs } = useNuxtApp()

const lastCrawlLabel = computed(() => {
  if (!props.lastCrawlAt) return 'Aucun crawl'
  return `Dernier crawl ${$dayjs(props.lastCrawlAt).fromNow()}`
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.streak-card {
  padding: $spacing-3 $spacing-4;
  background: $surface-card;
  border: 1px solid $color-gray-200;
  border-radius: $radius-lg;

  &__text {
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  &__separator {
    color: $color-gray-300;
    margin: 0 $spacing-1;
  }
}
</style>

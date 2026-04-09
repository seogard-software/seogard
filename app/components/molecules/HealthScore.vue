<template>
  <div class="health-score">
    <span class="health-score__value">{{ score ?? '—' }}</span>
    <span class="health-score__label">{{ score != null ? 'Score santé' : 'Aucun crawl' }}</span>
    <div class="health-score__bar">
      <div
        class="health-score__bar-fill"
        :class="`health-score__bar-fill--${variant}`"
        :style="{ width: `${score ?? 0}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  score: number | null
}

const props = defineProps<Props>()

const variant = computed(() => {
  if (props.score == null) return 'neutral'
  if (props.score >= 80) return 'success'
  if (props.score >= 50) return 'warning'
  return 'danger'
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.health-score {
  display: flex;
  flex-direction: column;

  &__value {
    font-size: $font-size-4xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    line-height: $line-height-tight;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin-top: $spacing-1;
  }

  &__bar {
    height: 4px;
    background: $color-gray-200;
    border-radius: $radius-full;
    margin-top: $spacing-3;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: $radius-full;
    transition: width 0.6s ease;

    &--success,
    &--warning,
    &--danger {
      background: $color-gray-500;
    }

    &--neutral { background: $color-gray-300; }
  }
}
</style>

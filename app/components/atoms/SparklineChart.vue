<template>
  <div class="sparkline-chart">
    <span v-if="label" class="sparkline-chart__label">{{ label }}</span>
    <div class="sparkline-chart__bars">
      <div
        v-for="(value, i) in data"
        :key="i"
        class="sparkline-chart__bar-wrapper"
      >
        <div
          class="sparkline-chart__bar"
          :style="{ height: barHeight(value) }"
        />
        <span class="sparkline-chart__day">{{ days[i] }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: number[]
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
})

const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const maxValue = computed(() => Math.max(...props.data, 1))

function barHeight(value: number): string {
  const pct = (value / maxValue.value) * 100
  return `${Math.max(pct, 3)}%`
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.sparkline-chart {
  &__label {
    display: block;
    font-size: $font-size-sm;
    color: $color-gray-500;
    font-weight: $font-weight-medium;
    margin-bottom: $spacing-3;
  }

  &__bars {
    display: flex;
    align-items: flex-end;
    gap: $spacing-2;
    height: 80px;
  }

  &__bar-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
  }

  &__bar {
    width: 100%;
    min-height: 2px;
    background: $color-accent;
    border-radius: $radius-sm $radius-sm 0 0;
    transition: height $transition-slow;
  }

  &__day {
    font-size: $font-size-xs;
    color: $color-gray-400;
    margin-top: $spacing-1;
  }
}
</style>

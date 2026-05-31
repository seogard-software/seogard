<template>
  <div class="sparkline-chart">
    <span v-if="label" class="sparkline-chart__label">{{ label }}</span>
    <div class="sparkline-chart__bars">
      <div
        v-for="(value, i) in data"
        :key="i"
        class="sparkline-chart__bar-wrapper"
        :title="barTitles[i]"
      >
        <div
          class="sparkline-chart__bar"
          :style="{ height: barHeight(value) }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: number[]
  label?: string
  // Infobulle au survol de chaque barre (ex : "12 mai : 2,3 s").
  // Pas de libellé visible sous les barres : les points de données sont des crawls
  // irréguliers, pas des jours fixes — un libellé jour/semaine n'aurait pas de sens.
  barTitles?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  barTitles: () => [],
})

const barTitles = computed<string[]>(() => props.barTitles)

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
}
</style>

<template>
  <div class="sparkline-chart">
    <span v-if="label" class="sparkline-chart__label">{{ label }}</span>
    <div class="sparkline-chart__plot">
      <svg
        class="sparkline-chart__svg"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" class="sparkline-chart__gradient-top" />
            <stop offset="100%" class="sparkline-chart__gradient-bottom" />
          </linearGradient>
        </defs>
        <path :d="areaPath" :fill="`url(#${gradientId})`" stroke="none" />
        <path
          :d="linePath"
          class="sparkline-chart__line"
          fill="none"
          vector-effect="non-scaling-stroke"
        />
      </svg>

      <div
        v-for="(point, i) in points"
        :key="`dot-${i}`"
        class="sparkline-chart__dot"
        :class="{
          'sparkline-chart__dot--last': i === points.length - 1,
          'sparkline-chart__dot--active': i === hoveredIndex,
        }"
        :style="{ left: `${point.x}%`, top: `${point.y}%` }"
      />

      <!-- Zones de survol élargies (transparentes) : la cible de 7px est trop petite. -->
      <div
        v-for="(point, i) in points"
        :key="`hit-${i}`"
        class="sparkline-chart__hit"
        :style="{ left: `${point.x}%`, top: `${point.y}%` }"
        @mouseenter="hoveredIndex = i"
        @mouseleave="hoveredIndex = null"
      />

      <!-- Tooltip instantané (pas de title natif lent) -->
      <div
        v-if="hoveredPoint && hoveredTitle"
        class="sparkline-chart__tooltip"
        :style="{ left: `${hoveredPoint.x}%`, top: `${hoveredPoint.y}%` }"
      >
        {{ hoveredTitle }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  data: number[]
  label?: string
  // Infobulle au survol de chaque point (ex : "12 mai : 2,3 s").
  pointTitles?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  label: undefined,
  pointTitles: () => [],
})

const pointTitles = computed<string[]>(() => props.pointTitles)

const hoveredIndex = ref<number | null>(null)

// Identifiant de gradient unique par instance (évite les collisions si plusieurs
// graphiques sont montés en même temps). Dérivé des données, pas d'aléatoire.
const gradientId = computed(() => `spark-grad-${props.data.length}-${Math.round(props.data.reduce((a, b) => a + b, 0))}`)

// Coordonnées en pourcentage. Y mappé sur [10%, 90%] de la hauteur pour laisser une
// marge en haut/bas ; une série plate retombe au milieu (50%) plutôt que collée au bord.
const points = computed(() => {
  const data = props.data
  const n = data.length
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min

  return data.map((value, i) => {
    const x = n === 1 ? 50 : (i / (n - 1)) * 100
    const ratio = range === 0 ? 0.5 : (value - min) / range
    const y = 90 - ratio * 80 // top=valeur haute, bottom=valeur basse
    return { x, y }
  })
})

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' '),
)

const areaPath = computed(() => {
  if (points.value.length === 0) return ''
  const line = points.value.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  return `${line} L 100 100 L 0 100 Z`
})

// Point + libellé survolés (computeds → narrowing propre, évite l'accès indexé
// possiblement undefined dans le template).
const hoveredPoint = computed(() =>
  hoveredIndex.value !== null ? points.value[hoveredIndex.value] ?? null : null,
)
const hoveredTitle = computed(() =>
  hoveredIndex.value !== null ? pointTitles.value[hoveredIndex.value] ?? null : null,
)
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

  &__plot {
    position: relative;
    height: 96px;
    width: 100%;
  }

  &__svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  &__gradient-top {
    stop-color: $color-accent;
    stop-opacity: 0.22;
  }

  &__gradient-bottom {
    stop-color: $color-accent;
    stop-opacity: 0;
  }

  &__line {
    stroke: $color-accent;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &__dot {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: $radius-full;
    background: $surface-card;
    border: 2px solid $color-accent;
    transform: translate(-50%, -50%);
    transition: transform $transition-fast;
    pointer-events: none; // le survol est géré par __hit (cible élargie)

    &--last {
      background: $color-accent;
      box-shadow: 0 0 0 4px rgba($color-accent, 0.15);
    }

    &--active {
      background: $color-accent;
      transform: translate(-50%, -50%) scale(1.4);
    }
  }

  &__hit {
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: $radius-full;
    transform: translate(-50%, -50%);
    cursor: default;
  }

  &__tooltip {
    position: absolute;
    z-index: 5;
    transform: translate(-50%, calc(-100% - 10px));
    padding: $spacing-1 $spacing-2;
    white-space: nowrap;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-900;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-sm;
    box-shadow: $shadow-lg;
    pointer-events: none;
  }
}
</style>

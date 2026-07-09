<template>
  <div class="perf-chart">
    <div v-if="loading" class="perf-chart__state">{{ $t('dashboard.c.perfChart.loading') }}</div>
    <div v-else-if="error" class="perf-chart__state">{{ error }}</div>
    <div v-else-if="!current" class="perf-chart__state">{{ $t('dashboard.c.perfChart.empty') }}</div>

    <template v-else>
      <div class="perf-chart__badges">
        <PerfBadge
          v-if="lastLcp != null"
          :label="$t('dashboard.c.perfChart.lcpLabel')"
          abbr="LCP"
          synthetic
          :hint="$t('dashboard.c.perfChart.lcpHint')"
          :value="seconds(lastLcp)"
          :rating="rateLcp(lastLcp)"
        />
        <PerfBadge
          v-if="lastCls != null"
          :label="$t('dashboard.c.perfChart.clsLabel')"
          abbr="CLS"
          synthetic
          :hint="$t('dashboard.c.perfChart.clsHint')"
          :value="decimal(lastCls)"
          :rating="rateCls(lastCls)"
        />
        <PerfBadge
          v-if="lastTtfb != null"
          :label="$t('dashboard.c.perfChart.ttfbLabel')"
          abbr="TTFB"
          synthetic
          :hint="$t('dashboard.c.perfChart.ttfbHint')"
          :value="`${lastTtfb} ms`"
          :rating="rateTtfb(lastTtfb)"
        />
        <PerfBadge
          v-if="current.weightTotalKb != null"
          :label="$t('dashboard.c.perfChart.weightLabel')"
          :hint="$t('dashboard.c.perfChart.weightHint')"
          :value="weight(current.weightTotalKb)"
          :rating="ratePageWeight(current.weightTotalKb)"
        />
      </div>

      <div v-if="trend.length > 1" class="perf-chart__trend">
        <div class="perf-chart__trend-tabs">
          <button
            v-for="m in METRICS"
            :key="m.key"
            class="perf-chart__trend-tab"
            :class="{ 'perf-chart__trend-tab--active': metric === m.key }"
            @click="metric = m.key"
          >
            {{ $t(m.labelKey) }}
          </button>
        </div>
        <SparklineChart :data="trend" :point-titles="trendTitles" :label="$t('dashboard.c.perfChart.trendLabel', { label: activeMetricLabel })" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PerfMetrics } from '~~/shared/types/perf'
import { ratePageWeight, rateCls, rateLcp, rateTtfb } from '~~/shared/types/perf'

interface Props {
  siteId: string
  pageId: string
}
const props = defineProps<Props>()

interface HistoryPoint { date: string; perf: PerfMetrics }
type MetricKey = 'lcpMs' | 'ttfbMs' | 'weightTotalKb'

const METRICS: { key: MetricKey; labelKey: string }[] = [
  { key: 'lcpMs', labelKey: 'dashboard.c.perfChart.metricLcp' },
  { key: 'ttfbMs', labelKey: 'dashboard.c.perfChart.metricTtfb' },
  { key: 'weightTotalKb', labelKey: 'dashboard.c.perfChart.metricWeight' },
]

const { t, locale } = useI18n()

const loading = ref(true)
const error = ref<string | null>(null)
const current = ref<PerfMetrics | null>(null)
const history = ref<HistoryPoint[]>([])
const metric = ref<MetricKey>('lcpMs')

const activeMetricLabel = computed(() => {
  const labelKey = METRICS.find(m => m.key === metric.value)?.labelKey
  return labelKey ? t(labelKey) : ''
})
const trend = computed(() => history.value.map(p => p.perf[metric.value] ?? 0))

// Séparateur décimal selon la locale (2,1 s en FR, 2.1 s en EN).
const decimalSep = computed(() => (locale.value === 'en' ? '.' : ','))

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', decimalSep.value)} s`
}
function weight(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1).replace('.', decimalSep.value)} MB`
  return `${kb} KB`
}
function decimal(n: number): string {
  return String(n).replace('.', decimalSep.value)
}

// Dernière mesure (crawl le plus récent). Affichée telle quelle : le synthétique one-shot
// varie d'un crawl à l'autre, mais c'est la valeur la plus à jour — un correctif poussé après
// un déploiement est visible immédiatement. Le flag "Synthétique" assume la variance, le
// graphe 30j la montre. (Le vrai lissage fiable viendra des données terrain CrUX.)
const lastLcp = computed(() => { const v = current.value?.lcpMs; return v == null ? null : Math.round(v) })
const lastTtfb = computed(() => { const v = current.value?.ttfbMs; return v == null ? null : Math.round(v) })
const lastCls = computed(() => { const v = current.value?.cls; return v == null ? null : Math.round(v * 1000) / 1000 })

function formatMetric(key: MetricKey, val: number): string {
  if (key === 'lcpMs') return seconds(val)
  if (key === 'ttfbMs') return `${val} ms`
  return weight(val)
}

// Infobulle de chaque point : la date réelle du crawl + la valeur (les crawls sont
// irréguliers, la date est la seule info pertinente, pas un jour de semaine).
const trendTitles = computed(() => history.value.map((p) => {
  const date = new Date(p.date).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'short' })
  const val = p.perf[metric.value]
  return `${date} : ${val != null ? formatMetric(metric.value, val) : '—'}`
}))

async function loadHistory() {
  loading.value = true
  error.value = null
  try {
    const data = await $fetch<{ current: PerfMetrics | null; history: HistoryPoint[] }>(
      `/api/sites/${props.siteId}/pages/${props.pageId}/perf-history`,
    )
    current.value = data.current
    history.value = data.history
  }
  catch {
    error.value = t('dashboard.c.perfChart.loadError')
  }
  finally {
    loading.value = false
  }
}

if (import.meta.client) {
  loadHistory()
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.perf-chart {
  &__state {
    font-size: $font-size-sm;
    color: $color-gray-500;
    padding: $spacing-3 0;
  }

  &__badges {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: $spacing-3;
  }

  &__trend {
    margin-top: $spacing-5;
  }

  // Segmented control : conteneur gris, onglet actif "surélevé" en blanc.
  &__trend-tabs {
    display: inline-flex;
    gap: 2px;
    padding: 3px;
    margin-bottom: $spacing-4;
    background: $color-gray-100;
    border-radius: $radius-md;
  }

  &__trend-tab {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-500;
    background: none;
    border: none;
    border-radius: $radius-sm;
    padding: $spacing-1 $spacing-3;
    cursor: pointer;
    transition: color $transition-fast, background-color $transition-fast, box-shadow $transition-fast;

    &:hover:not(.perf-chart__trend-tab--active) { color: $color-gray-800; }

    &--active {
      color: $color-gray-900;
      background: $surface-card;
      box-shadow: $shadow-sm;
    }
  }
}
</style>

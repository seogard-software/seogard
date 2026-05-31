<template>
  <div class="perf-chart">
    <div v-if="loading" class="perf-chart__state">Chargement…</div>
    <div v-else-if="error" class="perf-chart__state">{{ error }}</div>
    <div v-else-if="!current" class="perf-chart__state">Pas encore de mesure de performance pour cette page.</div>

    <template v-else>
      <div class="perf-chart__badges">
        <PerfBadge
          v-if="current.lcpMs != null"
          label="Affichage du contenu"
          abbr="LCP"
          hint="Temps avant l'affichage du contenu principal de la page. Bon en dessous de 2,5 s, lent au-delà de 4 s. Facteur de classement Google."
          :value="seconds(current.lcpMs)"
          :rating="rateLcp(current.lcpMs)"
        />
        <PerfBadge
          v-if="current.cls != null"
          label="Stabilité visuelle"
          abbr="CLS"
          hint="Mesure si la page bouge pendant le chargement (le contenu qui saute). Bon en dessous de 0,1. Facteur de classement Google."
          :value="decimal(current.cls)"
          :rating="rateCls(current.cls)"
        />
        <PerfBadge
          label="Réponse serveur"
          abbr="TTFB"
          hint="Temps que met votre serveur à répondre. Bon en dessous de 800 ms ; un serveur lent ralentit toute la page."
          :value="`${current.ttfbMs} ms`"
          :rating="rateTtfb(current.ttfbMs)"
        />
        <PerfBadge
          v-if="current.weightTotalKb != null"
          label="Poids de la page"
          hint="Poids total téléchargé : HTML, JavaScript, CSS, images et polices. Bon en dessous de 1,6 MB, excessif au-delà de 5 MB (seuils Lighthouse). Une page lourde charge lentement, surtout sur mobile."
          :value="weight(current.weightTotalKb)"
          :rating="ratePageWeight(current.weightTotalKb)"
        />
      </div>

      <p class="perf-chart__note">
        INP non mesuré : cette métrique nécessite des données de vrais visiteurs (terrain).
      </p>

      <div v-if="trend.length > 1" class="perf-chart__trend">
        <div class="perf-chart__trend-tabs">
          <button
            v-for="m in METRICS"
            :key="m.key"
            class="perf-chart__trend-tab"
            :class="{ 'perf-chart__trend-tab--active': metric === m.key }"
            @click="metric = m.key"
          >
            {{ m.label }}
          </button>
        </div>
        <SparklineChart :data="trend" :bar-titles="trendTitles" :label="`${activeMetricLabel} — 30 derniers jours`" />
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

const METRICS: { key: MetricKey; label: string }[] = [
  { key: 'lcpMs', label: 'Affichage' },
  { key: 'ttfbMs', label: 'Réponse serveur' },
  { key: 'weightTotalKb', label: 'Poids' },
]

const loading = ref(true)
const error = ref<string | null>(null)
const current = ref<PerfMetrics | null>(null)
const history = ref<HistoryPoint[]>([])
const metric = ref<MetricKey>('lcpMs')

const activeMetricLabel = computed(() => METRICS.find(m => m.key === metric.value)?.label ?? '')
const trend = computed(() => history.value.map(p => p.perf[metric.value] ?? 0))

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`
}
function weight(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`
  return `${kb} KB`
}
function decimal(n: number): string {
  return String(n).replace('.', ',')
}

function formatMetric(key: MetricKey, val: number): string {
  if (key === 'lcpMs') return seconds(val)
  if (key === 'ttfbMs') return `${val} ms`
  return weight(val)
}

// Infobulle de chaque barre : la date réelle du crawl + la valeur (les crawls sont
// irréguliers, la date est la seule info pertinente, pas un jour de semaine).
const trendTitles = computed(() => history.value.map((p) => {
  const date = new Date(p.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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
    error.value = 'Impossible de charger les performances.'
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
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-2;
  }

  &__note {
    font-size: $font-size-xs;
    color: $color-gray-400;
    margin: $spacing-3 0 0;
  }

  &__trend {
    margin-top: $spacing-5;
  }

  &__trend-tabs {
    display: flex;
    gap: $spacing-1;
    margin-bottom: $spacing-3;
  }

  &__trend-tab {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-500;
    background: none;
    border: 1px solid transparent;
    border-radius: $radius-md;
    padding: $spacing-1 $spacing-3;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover { color: $color-gray-700; }

    &--active {
      color: $color-gray-900;
      border-color: $color-gray-200;
      background-color: $color-gray-100;
    }
  }
}
</style>

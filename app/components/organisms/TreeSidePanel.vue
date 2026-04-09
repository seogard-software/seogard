<template>
  <Transition name="slide">
    <div v-if="node" class="tree-side-panel" @keydown.escape="$emit('close')">
      <div class="tree-side-panel__overlay" @click="$emit('close')" />
      <div class="tree-side-panel__panel">
      <div class="tree-side-panel__header">
        <button class="tree-side-panel__close" @click="$emit('close')">
          <AppIcon name="x" size="sm" />
        </button>
        <div class="tree-side-panel__header-info">
          <div class="tree-side-panel__path-row">
            <h3 class="tree-side-panel__path" :title="node.path">{{ node.path }}</h3>
            <button class="tree-side-panel__copy" :title="copied ? 'Copié !' : 'Copier l\'URL'" @click.stop="copyPath">
              <AppIcon :name="copied ? 'check' : 'copy'" size="sm" />
            </button>
          </div>
          <div class="tree-side-panel__header-stats">
            <span :class="['tree-side-panel__health', `tree-side-panel__health--${healthLevel}`]">{{ node.healthScore }}%</span>
            <span class="tree-side-panel__header-sep" />
            <span class="tree-side-panel__header-meta">{{ node.totalPageCount }} page{{ node.totalPageCount > 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <div class="tree-side-panel__tabs">
        <button
          :class="['tree-side-panel__tab', activeTab === 'regressions' && 'tree-side-panel__tab--active']"
          @click="activeTab = 'regressions'"
        >
          Régressions
          <span v-if="node.regressionCount > 0" class="tree-side-panel__tab-count tree-side-panel__tab-count--danger">{{ node.regressionCount }}</span>
        </button>
        <button
          :class="['tree-side-panel__tab', activeTab === 'recommendations' && 'tree-side-panel__tab--active']"
          @click="activeTab = 'recommendations'"
        >
          Recommandations
          <span v-if="node.recommendationCount > 0" class="tree-side-panel__tab-count">{{ node.recommendationCount }}</span>
        </button>
      </div>

      <div class="tree-side-panel__content">
        <div v-if="alertsLoading" class="tree-side-panel__loading">
          <AppSpinner size="sm" />
        </div>
        <div v-else-if="groups.length === 0" class="tree-side-panel__empty">
          <AppIcon name="shield-check" size="sm" />
          <span>{{ activeTab === 'regressions' ? 'Aucune régression' : 'Aucune recommandation' }}</span>
        </div>
        <AlertGroupCard
          v-for="group in groups"
          :key="group.ruleId"
          :group="group"
          :loading="loadingRules.has(group.ruleId)"
          :can-resolve="props.canResolve"
          :can-ignore="props.canAdmin"
          @expand="loadAlertsForRule"
          @resolve-all="resolveAllByRule"
          @ignore-all="ignoreAllByRule"
          @resolve="resolveAlert"
        />
      </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface GroupedResult {
  ruleId: string
  severity: AlertSeverity
  category: string
  count: number
  sampleMessage: string
  samplePageUrl: string
}

interface Props {
  node: TreeNode | null
  siteId: string
  canResolve?: boolean
  canAdmin?: boolean
}

defineEmits<{
  close: []
}>()

const props = defineProps<Props>()

const activeTab = ref<'regressions' | 'recommendations'>('regressions')
const alertsLoading = ref(false)
const copied = ref(false)

async function copyPath() {
  if (!props.node) return
  try {
    await navigator.clipboard.writeText(props.node.path)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch {}
}

// Grouped data from server aggregation (real counts)
const groupedData = ref<GroupedResult[]>([])
// Individual alerts loaded per ruleId (lazy)
const alertsByRule = ref<Map<string, Alert[]>>(new Map())
const loadingRules = ref<Set<string>>(new Set())

const groups = computed(() => {
  const severityOrder: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }

  const tabCategory = activeTab.value === 'regressions' ? 'regression' : 'recommendation'
  const filtered = groupedData.value.filter(g =>
    tabCategory === 'recommendation' ? g.category === 'recommendation' : g.category !== 'recommendation',
  )

  return filtered
    .map(g => ({
      ruleId: g.ruleId as AlertType,
      severity: g.severity,
      label: ALERT_TYPE_LABELS[g.ruleId] ?? g.ruleId,
      count: g.count,
      sampleMessage: g.sampleMessage,
      alerts: alertsByRule.value.get(g.ruleId) ?? [],
    }))
    .sort((a, b) => {
      const diff = severityOrder[a.severity] - severityOrder[b.severity]
      return diff !== 0 ? diff : b.count - a.count
    })
})

const healthLevel = computed(() => {
  if (!props.node) return 'good'
  if (props.node.healthScore >= 80) return 'good'
  if (props.node.healthScore >= 50) return 'medium'
  return 'low'
})

function buildPathParams(): Record<string, string> {
  if (!props.node) return {}
  if (props.node.isLeaf) return { exactPath: props.node.path }
  return { pathPrefix: props.node.path }
}

async function fetchGroups() {
  if (!props.node) return
  alertsLoading.value = true
  alertsByRule.value = new Map()
  try {
    const params: Record<string, string> = {
      status: 'active',
      grouped: 'true',
      ...buildPathParams(),
    }

    const data = await $fetch<{ groups: GroupedResult[] }>(`/api/sites/${props.siteId}/alerts`, {
      query: params,
    })

    groupedData.value = data.groups
  }
  finally {
    alertsLoading.value = false
  }
}

async function loadAlertsForRule(ruleId: string) {
  if (alertsByRule.value.has(ruleId) || loadingRules.value.has(ruleId)) return
  loadingRules.value.add(ruleId)
  try {
    const group = groupedData.value.find(g => g.ruleId === ruleId)
    const params: Record<string, string | number> = {
      status: 'active',
      limit: 50,
      ruleId,
      ...buildPathParams(),
    }
    if (group?.category) params.category = group.category

    const data = await $fetch<{ alerts: Alert[] }>(`/api/sites/${props.siteId}/alerts`, {
      query: params,
    })

    const map = new Map(alertsByRule.value)
    map.set(ruleId, data.alerts)
    alertsByRule.value = map
  }
  finally {
    loadingRules.value.delete(ruleId)
  }
}

async function resolveAlert(id: string) {
  await $fetch(`/api/sites/${props.siteId}/alerts/${id}/resolve`, { method: 'POST' })
  for (const [, alerts] of alertsByRule.value) {
    const alert = alerts.find(a => a._id === id)
    if (alert) {
      alert.status = 'resolved'
      alert.resolvedAt = new Date().toISOString()
      alert.resolvedBy = 'user'
      break
    }
  }
}


async function resolveAllByRule(ruleId: string) {
  await $fetch(`/api/sites/${props.siteId}/alerts/resolve-all`, {
    method: 'POST',
    body: { ruleId },
  })
  resolveLocalAlerts(ruleId)
}

async function ignoreAllByRule(ruleId: string) {
  await muteRule(ruleId)
}

async function muteRule(ruleId: string) {
  await $fetch(`/api/sites/${props.siteId}/muted-rules`, {
    method: 'POST',
    body: { ruleId },
  })
  resolveLocalAlerts(ruleId)
}

function resolveLocalAlerts(ruleId: string) {
  const alerts = alertsByRule.value.get(ruleId)
  if (alerts) {
    for (const alert of alerts) {
      if (alert.status === 'open') {
        alert.status = 'resolved'
        alert.resolvedAt = new Date().toISOString()
        alert.resolvedBy = 'user'
      }
    }
  }
}

onMounted(() => {
  if (props.node) fetchGroups()
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.tree-side-panel {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  justify-content: flex-end;

  &__overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.15);
  }

  &__panel {
    position: relative;
    width: 480px;
    max-width: 100vw;
    height: 100vh;
    background: $surface-page;
    border-left: 1px solid $color-gray-200;
    box-shadow: $shadow-xl;
    display: flex;
    flex-direction: column;

    @media (max-width: $breakpoint-sm) {
      width: 100vw;
      border-left: none;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-4 $spacing-5;
    background: $surface-card;
    border-bottom: 1px solid $color-gray-100;
    flex-shrink: 0;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    border-radius: $radius-sm;
    cursor: pointer;
    color: $color-gray-400;
    flex-shrink: 0;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-600;
      background: $color-gray-100;
    }
  }

  &__header-info {
    flex: 1;
    min-width: 0;
  }

  &__path-row {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    min-width: 0;
  }

  &__path {
    font-size: $font-size-sm;
    font-family: $font-family-mono;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin: 0;
    min-width: 0;
  }

  &__copy {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    border-radius: $radius-sm;
    cursor: pointer;
    color: $color-gray-400;
    flex-shrink: 0;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-600;
      background: $color-gray-100;
    }
  }

  &__header-stats {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    margin-top: 2px;
  }

  &__health {
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    font-family: $font-family-mono;

    &--good { color: $color-success; }
    &--medium { color: $color-warning; }
    &--low { color: $color-danger; }
  }

  &__header-sep {
    width: 3px;
    height: 3px;
    border-radius: $radius-full;
    background: $color-gray-300;
  }

  &__header-meta {
    font-size: $font-size-xs;
    color: $color-gray-400;
  }

  &__tabs {
    display: flex;
    background: $surface-card;
    border-bottom: 1px solid $color-gray-200;
    flex-shrink: 0;
  }

  &__tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-2;
    padding: $spacing-3;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-400;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    transition: color $transition-fast, border-color $transition-fast;

    &:hover {
      color: $color-gray-600;
    }

    &--active {
      color: $color-gray-800;
      border-bottom-color: $color-accent;
    }
  }

  &__tab-count {
    font-size: 10px;
    font-weight: $font-weight-bold;
    background: $color-gray-100;
    color: $color-gray-500;
    padding: 1px 6px;
    border-radius: $radius-full;
    font-family: $font-family-mono;

    &--danger {
      background: $color-danger-bg;
      color: $color-danger;
    }
  }

  &__content {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
    padding: $spacing-3;
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: $spacing-8;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-10;
    color: $color-gray-400;
    font-size: $font-size-sm;

    .app-icon {
      color: $color-gray-300;
    }
  }
}

.slide-enter-active .tree-side-panel__panel,
.slide-leave-active .tree-side-panel__panel {
  transition: transform $transition-slow;
}

.slide-enter-from .tree-side-panel__panel,
.slide-leave-to .tree-side-panel__panel {
  transform: translateX(100%);
}

.slide-enter-active .tree-side-panel__overlay,
.slide-leave-active .tree-side-panel__overlay {
  transition: opacity $transition-slow;
}

.slide-enter-from .tree-side-panel__overlay,
.slide-leave-to .tree-side-panel__overlay {
  opacity: 0;
}
</style>

<template>
  <div :class="['alert-group-card', `alert-group-card--${group.severity}`]">
    <div class="alert-group-card__top" @click="toggleExpand">
      <div class="alert-group-card__indicator" />
      <div class="alert-group-card__main">
        <div class="alert-group-card__row">
          <span class="alert-group-card__label">{{ group.label }}</span>
          <AppIcon :name="expanded ? 'chevron-down' : 'chevron-right'" size="sm" class="alert-group-card__chevron" />
        </div>
        <div class="alert-group-card__meta">
          <span class="alert-group-card__count">
            <span :class="['alert-group-card__dot', `alert-group-card__dot--${group.severity}`]" />
            {{ group.count }} {{ group.count > 1 ? 'pages' : 'page' }}
          </span>
          <AppBadge :variant="severityVariant" size="xs">{{ severityLabel }}</AppBadge>
        </div>
        <p v-if="!expanded" class="alert-group-card__preview">{{ group.sampleMessage || group.alerts[0]?.message }}</p>
      </div>
    </div>

    <!-- Bulk actions -->
    <div v-if="expanded && hasOpenAlerts && (canResolve || canIgnore)" class="alert-group-card__actions">
      <button v-if="canResolve" class="alert-group-card__action alert-group-card__action--primary" @click="$emit('resolve-all', group.ruleId)">
        <AppIcon name="check" size="sm" />
        Tout marquer fixé
      </button>
      <button v-if="canIgnore" class="alert-group-card__action alert-group-card__action--danger" @click="confirmIgnoreAll">
        Désactiver cette règle
      </button>
    </div>

    <!-- Expanded alerts -->
    <div v-if="expanded" class="alert-group-card__details">
      <div v-if="loading" class="alert-group-card__loading">
        <AppSpinner size="sm" />
      </div>
      <AlertCard
        v-for="alert in group.alerts"
        :key="alert._id"
        :alert="alert"
        :can-resolve="canResolve"
        @resolve="$emit('resolve', $event)"
      />
      <span v-if="group.count > group.alerts.length" class="alert-group-card__more">
        ... et {{ group.count - group.alerts.length }} autres
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  group: AlertGroup
  loading?: boolean
  canResolve?: boolean
  canIgnore?: boolean
}

const emit = defineEmits<{
  'resolve-all': [ruleId: string]
  'ignore-all': [ruleId: string]
  resolve: [id: string]
  expand: [ruleId: string]
}>()

const props = defineProps<Props>()

const expanded = ref(false)

function toggleExpand() {
  if (!expanded.value && props.group.alerts.length === 0) {
    emit('expand', props.group.ruleId)
  }
  expanded.value = !expanded.value
}

const hasOpenAlerts = computed(() => props.group.alerts.some(a => a.status === 'open'))

function confirmIgnoreAll() {
  if (window.confirm('Cette règle ne générera plus d\'alertes sur ce site.\nVous pourrez la réactiver dans les paramètres du site.')) {
    emit('ignore-all', props.group.ruleId)
  }
}

const severityVariant = computed(() => {
  const map = { critical: 'danger', warning: 'warning', info: 'info' } as const
  return map[props.group.severity]
})

const severityLabel = computed(() => ALERT_SEVERITY_LABELS[props.group.severity] ?? props.group.severity)
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.alert-group-card {
  background: $surface-card;
  border: 1px solid $color-gray-200;
  border-radius: $radius-lg;
  transition: border-color $transition-fast;

  &:hover {
    border-color: $color-gray-300;
  }

  &__top {
    display: flex;
    gap: $spacing-3;
    padding: $spacing-4;
    cursor: pointer;
    user-select: none;
  }

  &__indicator {
    width: 3px;
    border-radius: $radius-full;
    flex-shrink: 0;
    background: $color-gray-200;

    .alert-group-card--critical & { background: $color-danger; }
    .alert-group-card--warning & { background: $color-warning; }
    .alert-group-card--info & { background: $color-info; }
  }

  &__main {
    flex: 1;
    min-width: 0;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-2;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
  }

  &__chevron {
    color: $color-gray-400;
    flex-shrink: 0;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    margin-top: $spacing-1;
  }

  &__count {
    display: flex;
    align-items: center;
    gap: $spacing-1;
    font-size: $font-size-xs;
    color: $color-gray-500;
    font-family: $font-family-mono;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-full;
    background: $color-gray-300;

    &--critical { background: $color-danger; }
    &--warning { background: $color-warning; }
    &--info { background: $color-info; }
  }

  &__preview {
    font-size: $font-size-xs;
    color: $color-gray-400;
    margin: $spacing-2 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // Bulk actions bar
  &__actions {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-4;
    border-top: 1px solid $color-gray-100;
    border-bottom: 1px solid $color-gray-100;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: $spacing-1;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    padding: $spacing-1 $spacing-3;
    border-radius: $radius-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &--primary {
      background: $surface-card;
      color: $color-gray-600;
      border: 1px solid $color-gray-200;

      .app-icon { color: $color-success; }

      &:hover, &:active {
        background: $color-success-bg;
        border-color: rgba($color-success, 0.3);
        color: $color-success;
      }
    }

    &--danger {
      background: none;
      color: $color-gray-400;
      border: 1px solid transparent;

      &:hover {
        color: $color-danger;
        border-color: rgba($color-danger, 0.2);
        background: $color-danger-bg;
      }
    }
  }

  // Expanded list
  &__details {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__loading {
    display: flex;
    justify-content: center;
    padding: $spacing-6;
  }

  &__more {
    font-size: $font-size-xs;
    color: $color-gray-400;
    font-style: italic;
    padding: $spacing-3 $spacing-4;
    text-align: center;
  }
}
</style>

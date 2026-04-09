<template>
  <div class="metric-card" :class="`metric-card--${tint}`">
    <div class="metric-card__header">
      <div v-if="icon" class="metric-card__icon" :class="`metric-card__icon--${tint}`">
        <AppIcon :name="icon" size="md" />
      </div>
      <div class="metric-card__meta">
        <span class="metric-card__label">{{ label }}</span>
        <AppBadge v-if="trend" :variant="trendVariant" size="xs">
          {{ trend }}
        </AppBadge>
      </div>
    </div>
    <div class="metric-card__value">{{ value }}</div>
    <div v-if="subtitle" class="metric-card__subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  subtitle?: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  icon?: IconName
  tint?: 'accent' | 'navy' | 'warning' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  trend: undefined,
  trendDirection: 'neutral',
  icon: undefined,
  tint: 'accent',
})

const trendVariant = computed(() => {
  if (props.trendDirection === 'up') return 'success'
  if (props.trendDirection === 'down') return 'danger'
  return 'neutral'
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.metric-card {
  padding: $spacing-4;
  background: $surface-card;
  border: 1px solid $color-gray-200;
  border-radius: $radius-lg;

  &--danger {
    border-color: rgba($color-danger, 0.12);
  }

  &--warning {
    border-color: rgba($color-warning, 0.12);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: $spacing-3;
    margin-bottom: $spacing-3;
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--accent {
      background-color: rgba($color-accent, 0.08);
      color: $color-accent;
    }

    &--navy {
      background-color: rgba($color-accent, 0.08);
      color: $color-accent;
    }

    &--warning {
      background-color: $color-warning-bg;
      color: $color-warning;
    }

    &--danger {
      background-color: $color-danger-bg;
      color: $color-danger;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-gray-500;
    font-weight: $font-weight-medium;
  }

  &__value {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    line-height: $line-height-tight;
  }

  &__subtitle {
    font-size: $font-size-sm;
    color: $color-gray-400;
    margin-top: $spacing-1;
  }
}
</style>

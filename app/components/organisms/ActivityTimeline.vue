<template>
  <div class="activity-timeline">
    <h2 class="activity-timeline__title">Activité récente</h2>

    <div v-if="events.length === 0" class="activity-timeline__empty">
      <AppIcon name="activity" size="lg" />
      <p>Aucune activité récente</p>
    </div>

    <div v-else class="activity-timeline__list">
      <div
        v-for="(event, i) in events"
        :key="i"
        class="activity-timeline__item"
      >
        <div class="activity-timeline__dot" :class="dotClass(event)" />
        <div class="activity-timeline__content">
          <div class="activity-timeline__row">
            <AppIcon :name="eventIcon(event)" size="sm" />
            <span class="activity-timeline__site">{{ event.siteName }}</span>
            <span class="activity-timeline__time">{{ formatTime(event.timestamp) }}</span>
          </div>
          <p class="activity-timeline__message">
            {{ event.message }}
            <span v-if="event.count && event.count > 1" class="activity-timeline__count">({{ event.count }})</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  events: ActivityEvent[]
}

defineProps<Props>()

const { $dayjs } = useNuxtApp()

function dotClass(event: ActivityEvent): string {
  if (event.type === 'crawl_completed') return 'activity-timeline__dot--accent'
  if (event.severity === 'critical') return 'activity-timeline__dot--danger'
  if (event.severity === 'warning') return 'activity-timeline__dot--warning'
  return 'activity-timeline__dot--info'
}

function eventIcon(event: ActivityEvent): IconName {
  if (event.type === 'crawl_completed') return 'radar'
  if (event.type === 'alert_resolved') return 'check'
  return 'alert-triangle'
}

function formatTime(timestamp: string): string {
  return $dayjs(timestamp).fromNow()
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.activity-timeline {
  padding: $spacing-4;
  background: $surface-card;
  border: 1px solid $color-gray-200;
  border-radius: $radius-lg;

  &__title {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-3;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-8;
    color: $color-gray-400;
    font-size: $font-size-sm;
  }

  &__list {
    max-height: 400px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    gap: $spacing-3;
    padding: $spacing-3 0;
    border-bottom: 1px solid $color-gray-200;

    &:last-child {
      border-bottom: none;
    }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-full;
    flex-shrink: 0;
    margin-top: 6px;

    &--accent { background-color: $color-gray-500; }
    &--danger { background-color: $color-gray-600; }
    &--warning { background-color: $color-gray-500; }
    &--info { background-color: $color-gray-400; }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    color: $color-gray-600;
  }

  &__site {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
  }

  &__time {
    margin-left: auto;
    font-size: $font-size-xs;
    color: $color-gray-400;
    white-space: nowrap;
  }

  &__message {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin-top: $spacing-1;
  }

  &__count {
    font-weight: $font-weight-semibold;
    color: $color-gray-700;
  }
}
</style>

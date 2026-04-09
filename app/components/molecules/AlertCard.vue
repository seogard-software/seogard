<template>
  <div :class="['alert-card', `alert-card--${alert.severity}`, alert.status === 'resolved' && 'alert-card--resolved']">
    <div class="alert-card__body">
      <p class="alert-card__message">{{ alert.message }}</p>

      <!-- Diff -->
      <div v-if="alert.previousValue || alert.currentValue" class="alert-card__diff">
        <div v-if="alert.previousValue" class="alert-card__diff-line alert-card__diff-line--removed">
          <template v-if="diff">{{ diff.oldLabel }}<template v-for="(seg, i) in diff.oldSegments" :key="i"><mark v-if="seg.highlight" class="alert-card__mark">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></template>
          <template v-else>{{ alert.previousValue }}</template>
        </div>
        <div v-if="alert.currentValue" class="alert-card__diff-line alert-card__diff-line--added">
          <template v-if="diff">{{ diff.newLabel }}<template v-for="(seg, i) in diff.newSegments" :key="i"><mark v-if="seg.highlight" class="alert-card__mark">{{ seg.text }}</mark><template v-else>{{ seg.text }}</template></template></template>
          <template v-else>{{ alert.currentValue }}</template>
        </div>
      </div>

      <!-- Footer: URL + meta -->
      <div class="alert-card__footer">
        <button class="alert-card__url-btn" :title="urlCopied ? 'Copié !' : alert.pageUrl" @click="copyUrl">
          <span class="alert-card__url">{{ displayUrl }}</span>
          <AppIcon :name="urlCopied ? 'check' : 'copy'" size="sm" class="alert-card__url-icon" />
        </button>
        <span class="alert-card__meta">
          <template v-if="alert.occurrences > 1">{{ alert.occurrences }}x · </template>
          {{ formattedDate }}
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div v-if="alert.status === 'open' && canResolve" class="alert-card__actions">
      <button v-if="canResolve" class="alert-card__btn alert-card__btn--primary" @click="$emit('resolve', alert._id)">
        <AppIcon name="check" size="sm" />
        C'est fixé
      </button>
      <button v-if="canResolve" class="alert-card__btn alert-card__btn--secondary" @click="$emit('resolve', alert._id)">
        C'est normal
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  alert: Alert
  canResolve?: boolean
}

defineEmits<{
  resolve: [id: string]
}>()

const props = defineProps<Props>()

const displayUrl = computed(() => {
  try {
    return new URL(props.alert.pageUrl).pathname
  }
  catch { return props.alert.pageUrl }
})

const formattedDate = computed(() => {
  return new Date(props.alert.lastDetectedAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short',
  })
})

const urlCopied = ref(false)

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(props.alert.pageUrl)
    urlCopied.value = true
    setTimeout(() => { urlCopied.value = false }, 2000)
  }
  catch {}
}

const { computeDiff } = useDiff()
const diff = computed(() => computeDiff(props.alert.previousValue, props.alert.currentValue))
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.alert-card {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid $color-gray-100;
  transition: background $transition-fast;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: $color-gray-50;
  }

  &--resolved {
    opacity: 0.5;
  }

  &__body {
    flex: 1;
    min-width: 0;
    padding: $spacing-3 $spacing-4;
  }

  &__message {
    font-size: $font-size-xs;
    color: $color-gray-600;
    line-height: $line-height-snug;
    margin: 0 0 $spacing-2;
  }

  // Diff
  &__diff {
    font-family: $font-family-mono;
    font-size: 11px;
    margin-bottom: $spacing-2;
    border-radius: $radius-sm;
    overflow: hidden;
  }

  &__diff-line {
    padding: 2px $spacing-2;

    &--removed {
      background-color: $color-danger-bg;
      color: $color-gray-700;

      &::before { content: '- '; color: $color-danger; font-weight: $font-weight-semibold; }
    }

    &--added {
      background-color: $color-success-bg;
      color: $color-gray-700;

      &::before { content: '+ '; color: $color-success; font-weight: $font-weight-semibold; }
    }
  }

  &__mark {
    border-radius: 2px;
    padding: 0 1px;
    color: inherit;

    .alert-card__diff-line--removed & {
      background-color: rgba($color-danger, 0.15);
    }

    .alert-card__diff-line--added & {
      background-color: rgba($color-success, 0.15);
    }
  }

  // Footer
  &__footer {
    display: flex;
    align-items: center;
    gap: $spacing-2;
  }

  &__url-btn {
    display: flex;
    align-items: center;
    gap: $spacing-1;
    min-width: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: color $transition-fast;

    &:hover {
      .alert-card__url { color: $color-gray-600; }
      .alert-card__url-icon { color: $color-gray-500; }
    }
  }

  &__url {
    font-size: 11px;
    color: $color-gray-400;
    font-family: $font-family-mono;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  &__url-icon {
    color: $color-gray-300;
    flex-shrink: 0;
  }

  &__meta {
    font-size: 11px;
    color: $color-gray-300;
    white-space: nowrap;
    flex-shrink: 0;
    margin-left: auto;
  }

  // Actions column
  &__actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: $spacing-1;
    padding: $spacing-2 $spacing-3;
    border-left: 1px solid $color-gray-100;
    flex-shrink: 0;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-1;
    font-size: 11px;
    font-weight: $font-weight-medium;
    padding: $spacing-1 $spacing-2;
    border-radius: $radius-sm;
    cursor: pointer;
    white-space: nowrap;
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

    &--secondary {
      background: $surface-card;
      color: $color-gray-600;
      border: 1px solid $color-gray-200;

      &:hover, &:active {
        background: $color-success-bg;
        border-color: rgba($color-success, 0.3);
        color: $color-success;
      }
    }

  }
}
</style>

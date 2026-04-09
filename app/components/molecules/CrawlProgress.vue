<template>
  <div class="crawl-progress">
    <div class="crawl-progress__header">
      <div class="crawl-progress__title">
        <AppSpinner size="sm" />
        <span>{{ statusLabel }}</span>
      </div>
      <AppBadge variant="info" size="sm">En cours</AppBadge>
    </div>

    <div class="crawl-progress__bar-container">
      <div class="crawl-progress__bar" :style="{ width: `${progress}%` }" />
    </div>
    <span class="crawl-progress__percent">{{ progress }}%</span>

    <div class="crawl-progress__stats">
      <span>{{ pagesLabel }}</span>
      <span class="crawl-progress__separator">&bull;</span>
      <span>{{ crawl.alertsGenerated }} alertes</span>
      <span class="crawl-progress__separator">&bull;</span>
      <span>{{ timeAgo }}</span>
    </div>

    <div v-if="crawl.sitemapBlocked" class="crawl-progress__blocked crawl-progress__blocked--critical">
      <AppIcon name="shield-check" size="sm" class="crawl-progress__blocked-icon" />
      <span>Pare-feu (WAF) détecté — impossible d'accéder au sitemap. Seule la homepage a été analysée.</span>
      <NuxtLink to="/bot" class="crawl-progress__blocked-link">Whitelister notre crawler</NuxtLink>
    </div>

    <div v-else-if="crawl.pagesBlocked > 0" class="crawl-progress__blocked">
      <AppIcon name="shield-check" size="sm" class="crawl-progress__blocked-icon" />
      {{ crawl.pagesBlocked.toLocaleString('fr-FR') }} pages bloquées par un pare-feu (WAF)
      <NuxtLink to="/bot" class="crawl-progress__blocked-cta">Débloquer l'accès</NuxtLink>
    </div>

    <div v-if="crawl.pagesSkipped > 0 && isCloud" class="crawl-progress__skipped">
      <span class="crawl-progress__skipped-text">
        {{ crawl.pagesSkipped.toLocaleString('fr-FR') }} pages ignorées — activez la facturation pour les inclure
      </span>
      <NuxtLink :to="billingUrl" class="crawl-progress__skipped-link">
        Activer
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  crawl: CrawlResult
  progress: number
}

const props = defineProps<Props>()
const { isCloud } = useDeployment()

const { $dayjs } = useNuxtApp()
const orgStore = useOrganizationStore()

const billingUrl = computed(() => {
  const id = orgStore.activeOrgId
  return id ? `/dashboard/organizations/${id}/billing` : '/dashboard/settings'
})

const statusLabel = computed(() => {
  if (props.crawl.status === 'pending') return 'Crawl en attente — découverte des pages...'
  return 'Crawl en cours'
})

const pagesLabel = computed(() => {
  const scanned = props.crawl.pagesScanned.toLocaleString('fr-FR')
  const total = props.crawl.pagesTotal
    ? props.crawl.pagesTotal.toLocaleString('fr-FR')
    : '?'
  return `${scanned} / ${total} pages`
})

const timeAgo = computed(() => {
  const date = props.crawl.startedAt ?? props.crawl._id
  return $dayjs(date).fromNow()
})
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '~/assets/styles/variables' as *;

.crawl-progress {
  padding: $spacing-5 $spacing-6;
  background: $surface-card;
  border: 1px solid rgba($color-accent, 0.2);
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-4;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;

    :deep(.app-spinner) {
      padding: 0;
    }

    :deep(.app-spinner__ring) {
      width: 18px;
      height: 18px;
      border-width: 2px;
    }
  }

  &__bar-container {
    height: 8px;
    background-color: $color-gray-300;
    border-radius: $radius-full;
    overflow: hidden;
    margin-bottom: $spacing-1;
  }

  &__bar {
    height: 100%;
    background: $color-accent;
    border-radius: $radius-full;
    transition: width 0.5s ease;
    min-width: 0;
  }

  &__percent {
    display: block;
    text-align: right;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-accent;
    margin-bottom: $spacing-3;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  &__separator {
    color: $color-gray-300;
  }

  &__blocked {
    margin-top: $spacing-3;
    padding: $spacing-3 $spacing-4;
    background: rgba($color-warning, 0.1);
    border: 1px solid rgba($color-warning, 0.3);
    border-radius: $radius-lg;
    font-size: $font-size-sm;
    color: $color-warning;
    font-weight: $font-weight-medium;
    display: flex;
    align-items: center;
    gap: $spacing-2;
    flex-wrap: wrap;

    &--critical {
      background: rgba($color-danger, 0.1);
      border-color: rgba($color-danger, 0.3);
      color: $color-danger;
    }
  }

  &__blocked-icon {
    flex-shrink: 0;
  }

  &__blocked-link {
    margin-left: auto;
    color: $color-accent;
    font-weight: $font-weight-semibold;
    text-decoration: none;
    font-size: $font-size-xs;

    &:hover {
      text-decoration: underline;
    }
  }

  &__blocked-cta {
    margin-left: auto;
    padding: $spacing-1 $spacing-4;
    background: $color-warning;
    color: $color-white;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    border-radius: $radius-full;
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: background $transition-fast;

    &:hover {
      background: color.adjust($color-warning, $lightness: -8%);
    }
  }

  &__skipped {
    margin-top: $spacing-3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    background: $surface-elevated;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  &__skipped-text {
    flex: 1;
  }

  &__skipped-link {
    flex-shrink: 0;
    padding: $spacing-1 $spacing-4;
    background: $color-accent;
    color: $color-white;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    border-radius: $radius-md;
    text-decoration: none;
    transition: box-shadow $transition-fast;

    &:hover {
      box-shadow: $shadow-md;
    }
  }
}
</style>

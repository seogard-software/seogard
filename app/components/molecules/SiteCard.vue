<template>
  <NuxtLink :to="`/dashboard/sites/${site._id}`" class="site-card">
    <img
      v-if="faviconUrl"
      :src="faviconUrl"
      class="site-card__favicon"
      @error="($event.target as HTMLImageElement).style.display = 'none'"
    >
    <div class="site-card__info">
      <span class="site-card__name">{{ site.name }}</span>
      <span class="site-card__url">{{ site.url }}</span>
    </div>
    <div class="site-card__meta">
      <span v-if="site.discovering !== 'idle'" class="site-card__discovering">
        <span class="site-card__discovering-dot" />
        Découverte du sitemap...
      </span>
      <template v-else>
        <span>{{ site.pagesCount }} pages</span>
        <span class="site-card__separator">&middot;</span>
        <span v-if="site.crawlStatus === 'running'">Crawl en cours...</span>
        <span v-else-if="site.lastCrawlAt">{{ formattedLastCrawl }}</span>
        <span v-else>Jamais crawlé</span>
      </template>
    </div>
    <AppIcon name="chevron-right" size="sm" class="site-card__chevron" />
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  site: Site
}

const props = defineProps<Props>()

const faviconUrl = computed(() => {
  try {
    const domain = new URL(props.site.url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  }
  catch {
    return null
  }
})

const formattedLastCrawl = computed(() => {
  if (!props.site.lastCrawlAt) return null
  return new Date(props.site.lastCrawlAt).toLocaleString('fr-FR')
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.site-card {
  display: flex;
  align-items: center;
  gap: $spacing-3;
  padding: $spacing-3 $spacing-4;
  background: $surface-card;
  border: 1px solid $color-gray-200;
  border-radius: $radius-lg;
  text-decoration: none;
  color: inherit;
  transition: background-color $transition-fast;

  &:hover {
    background-color: $surface-elevated;
    text-decoration: none;
  }

  &__favicon {
    width: 24px;
    height: 24px;
    border-radius: $radius-sm;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-900;
  }

  &__url {
    font-size: $font-size-xs;
    color: $color-gray-400;
    font-family: $font-family-mono;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: $spacing-1;
    font-size: $font-size-xs;
    color: $color-gray-500;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__separator {
    color: $color-gray-300;
  }

  &__discovering {
    display: flex;
    align-items: center;
    gap: $spacing-1;
    color: $color-info;
  }

  &__discovering-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: $color-info;
    border-radius: 50%;
    animation: site-card-pulse 1.2s ease-in-out infinite;
  }

  &__chevron {
    color: $color-gray-400;
    flex-shrink: 0;
  }
}
@keyframes site-card-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>

<template>
  <div class="layout-docs">
    <!-- Same header as landing -->
    <header :class="['layout-docs__header', { 'layout-docs__header--scrolled': isScrolled }]">
      <div class="layout-docs__header-inner">
        <NuxtLink :to="localePath({ name: 'index' })" class="layout-docs__logo">
          <AppLogo size="sm" />
        </NuxtLink>

        <!-- Source unique : PublicNav (partagée avec le layout landing) -->
        <PublicNav />

        <button class="layout-docs__burger" :aria-label="$t('docs.layout.menuAria')" @click="sidebarOpen = !sidebarOpen">
          <svg v-if="!sidebarOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </header>

    <div class="layout-docs__body">
      <aside :class="['layout-docs__sidebar', { 'layout-docs__sidebar--open': sidebarOpen }]">
        <nav class="layout-docs__sidebar-nav">
          <span class="layout-docs__sidebar-heading">{{ $t('docs.layout.rulesHeading') }}</span>
          <NuxtLink :to="localePath({ name: 'docs-rules' })" class="layout-docs__sidebar-link" active-class="layout-docs__sidebar-link--active" @click="sidebarOpen = false">
            {{ $t('docs.layout.allRules') }}
          </NuxtLink>

          <span class="layout-docs__sidebar-heading">{{ $t('docs.layout.selfHostedHeading') }}</span>
          <NuxtLink
            v-for="section in selfHostedSections"
            :key="section.id"
            :to="localePath({ name: 'docs-self-hosted', hash: `#${section.id}` })"
            class="layout-docs__sidebar-link layout-docs__sidebar-link--sub"
            @click="sidebarOpen = false"
          >
            {{ section.label }}
          </NuxtLink>

          <template v-if="isDev">
            <span class="layout-docs__sidebar-heading">
              {{ $t('docs.layout.emailsHeading') }}
              <span class="layout-docs__sidebar-badge">DEV</span>
            </span>
            <NuxtLink to="/docs/emails" class="layout-docs__sidebar-link" exact-active-class="layout-docs__sidebar-link--active" @click="sidebarOpen = false">
              {{ $t('docs.layout.allTemplates') }}
            </NuxtLink>
            <NuxtLink
              v-for="tpl in emailTemplates"
              :key="tpl.id"
              :to="`/docs/emails/${tpl.id}`"
              class="layout-docs__sidebar-link layout-docs__sidebar-link--sub"
              active-class="layout-docs__sidebar-link--active"
              @click="sidebarOpen = false"
            >
              {{ tpl.label }}
            </NuxtLink>
          </template>
        </nav>
      </aside>

      <main class="layout-docs__content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const isDev = import.meta.dev

const { t } = useI18n()
const localePath = useLocalePath()

useCanonicalHead()

// Les ids d'ancres sont techniques (stables toutes locales) ; seuls les labels se traduisent.
const selfHostedSections = computed(() => [
  { id: 'getting-started', label: t('docs.layout.sections.gettingStarted') },
  { id: 'architecture', label: t('docs.layout.sections.architecture') },
  { id: 'dimensionnement', label: t('docs.layout.sections.sizing') },
  { id: 'workers', label: t('docs.layout.sections.workers') },
  { id: 'email', label: t('docs.layout.sections.email') },
  { id: 'oauth', label: t('docs.layout.sections.oauth') },
  { id: 'whitelisting', label: t('docs.layout.sections.whitelisting') },
  { id: 'mise-a-jour', label: t('docs.layout.sections.update') },
  { id: 'sauvegarde', label: t('docs.layout.sections.backup') },
  { id: 'licence', label: t('docs.layout.sections.licence') },
])

const isScrolled = ref(false)
const sidebarOpen = ref(false)

const emailTemplates = computed(() => [
  { id: 'welcome', label: t('docs.layout.emailTemplates.welcome') },
  { id: 'crawl-report', label: t('docs.layout.emailTemplates.crawlReport') },
  { id: 'log-digest', label: t('docs.layout.emailTemplates.logDigest') },
  { id: 'sitemap-blocked', label: t('docs.layout.emailTemplates.sitemapBlocked') },
  { id: 'sitemap-invalid-hostname', label: t('docs.layout.emailTemplates.sitemapInvalidHostname') },
  { id: 'crawler-blocked', label: t('docs.layout.emailTemplates.crawlerBlocked') },
  { id: 'reset-password', label: t('docs.layout.emailTemplates.resetPassword') },
  { id: 'sitemap-estimate', label: t('docs.layout.emailTemplates.sitemapEstimate') },
  { id: 'sitemap-estimate-large', label: t('docs.layout.emailTemplates.sitemapEstimateLarge') },
  { id: 'payment-failed', label: t('docs.layout.emailTemplates.paymentFailed') },
  { id: 'invite', label: t('docs.layout.emailTemplates.invite') }
])

function onScroll() {
  isScrolled.value = window.scrollY > 40
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

$sidebar-width: 240px;
$header-height: 64px;

.layout-docs {
  min-height: 100vh;
  background: $surface-page;

  // ── Header (same as landing) ──
  &__header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    padding: $spacing-3 $spacing-4 0;

    &--scrolled .layout-docs__header-inner {
      background: $color-white;
      border-color: $color-gray-200;
    }
  }

  &__header-inner {
    max-width: $header-width;
    margin: 0 auto;
    padding: $spacing-3 $spacing-6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid transparent;
    border-radius: 16px;
    transition: background $transition-base, border-color $transition-base, box-shadow $transition-base;
  }

  &__logo {
    text-decoration: none;
    line-height: 1;
    display: inline-flex;
    align-items: center;

    :deep(.app-logo) {
      color: $color-gray-900;
    }
  }

  &__burger {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: none;
    color: $color-gray-600;
    cursor: pointer;
    border-radius: $radius-md;

    &:hover {
      background: $surface-elevated;
    }

    @media (max-width: $breakpoint-md) {
      display: flex;
    }
  }

  // ── Body ──
  &__body {
    display: flex;
    padding-top: $header-height;
    min-height: 100vh;
    max-width: $header-width;
    margin: 0 auto;
  }

  // ── Sidebar ──
  &__sidebar {
    width: $sidebar-width;
    flex-shrink: 0;
    position: sticky;
    top: $header-height;
    height: calc(100vh - #{$header-height});
    overflow-y: auto;
    border-right: 1px solid $color-gray-200;
    padding: $spacing-5 0;

    @media (max-width: $breakpoint-md) {
      position: fixed;
      top: $header-height;
      left: 0;
      bottom: 0;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform $transition-base;
      box-shadow: $shadow-xl;

      &--open {
        transform: translateX(0);
      }
    }
  }

  &__sidebar-nav {
    display: flex;
    flex-direction: column;
  }

  &__sidebar-heading {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-4 $spacing-5 $spacing-2;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-400;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    &:first-child {
      padding-top: 0;
    }
  }

  &__sidebar-badge {
    padding: 1px 6px;
    background: $color-warning-bg;
    color: $color-warning;
    border-radius: $radius-sm;
    font-size: 9px;
    font-weight: $font-weight-bold;
    letter-spacing: 0.05em;
  }

  &__sidebar-link {
    display: block;
    padding: $spacing-2 $spacing-5;
    font-size: $font-size-sm;
    color: $color-gray-600;
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: color $transition-fast, background $transition-fast, border-color $transition-fast;

    &:hover {
      color: $color-gray-900;
      background: $surface-elevated;
    }

    &--active {
      color: $color-gray-900;
      font-weight: $font-weight-medium;
      border-left-color: $color-gray-900;
      background: $surface-elevated;
    }

    &--sub {
      padding-left: $spacing-8;
      font-size: $font-size-xs;
      color: $color-gray-500;
    }
  }

  // ── Content ──
  &__content {
    flex: 1;
    min-width: 0;
    padding: $spacing-8;
    max-width: 960px;

    @media (max-width: $breakpoint-md) {
      padding: $spacing-6 $spacing-4;
    }
  }
}
</style>

<template>
  <div class="layout-docs">
    <!-- Same header as landing -->
    <header :class="['layout-docs__header', { 'layout-docs__header--scrolled': isScrolled }]">
      <div class="layout-docs__header-inner">
        <NuxtLink to="/" class="layout-docs__logo">
          <AppLogo size="sm" />
        </NuxtLink>

        <nav class="layout-docs__nav layout-docs__nav--desktop">
          <NuxtLink to="/#features" class="layout-docs__nav-link">Fonctionnalités</NuxtLink>
          <NuxtLink to="/#pricing" class="layout-docs__nav-link">Tarifs</NuxtLink>
          <NuxtLink to="/blog" class="layout-docs__nav-link">Blog</NuxtLink>
          <NuxtLink to="/docs" class="layout-docs__nav-link">Docs</NuxtLink>
          <template v-if="isLoggedIn">
            <NuxtLink to="/dashboard/sites" class="layout-docs__nav-cta">Dashboard</NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="layout-docs__nav-link">Connexion</NuxtLink>
            <NuxtLink to="/register" class="layout-docs__nav-cta">Tester gratuitement</NuxtLink>
          </template>
        </nav>

        <button class="layout-docs__burger" aria-label="Menu" @click="sidebarOpen = !sidebarOpen">
          <svg v-if="!sidebarOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </header>

    <div class="layout-docs__body">
      <aside :class="['layout-docs__sidebar', { 'layout-docs__sidebar--open': sidebarOpen }]">
        <nav class="layout-docs__sidebar-nav">
          <span class="layout-docs__sidebar-heading">Règles SEO</span>
          <NuxtLink to="/docs/rules" class="layout-docs__sidebar-link" active-class="layout-docs__sidebar-link--active" @click="sidebarOpen = false">
            Toutes les règles
          </NuxtLink>

          <span class="layout-docs__sidebar-heading">Self-Hosted</span>
          <NuxtLink
            v-for="section in selfHostedSections"
            :key="section.id"
            :to="`/docs/self-hosted#${section.id}`"
            class="layout-docs__sidebar-link layout-docs__sidebar-link--sub"
            @click="sidebarOpen = false"
          >
            {{ section.label }}
          </NuxtLink>

          <template v-if="isDev">
            <span class="layout-docs__sidebar-heading">
              Emails
              <span class="layout-docs__sidebar-badge">DEV</span>
            </span>
            <NuxtLink to="/docs/emails" class="layout-docs__sidebar-link" exact-active-class="layout-docs__sidebar-link--active" @click="sidebarOpen = false">
              Tous les templates
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
const authStore = useAuthStore()
const isLoggedIn = computed(() => !!authStore.currentUser)
const isDev = import.meta.dev

const selfHostedSections = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'dimensionnement', label: 'Dimensionnement' },
  { id: 'workers', label: 'Workers' },
  { id: 'email', label: 'Notifications email' },
  { id: 'oauth', label: 'Connexion OAuth' },
  { id: 'whitelisting', label: 'Whitelisting crawler' },
  { id: 'mise-a-jour', label: 'Mise à jour' },
  { id: 'sauvegarde', label: 'Sauvegarde' },
  { id: 'licence', label: 'Licence (BSL 1.1)' },
]

const isScrolled = ref(false)
const sidebarOpen = ref(false)

const emailTemplates = [
  { id: 'welcome', label: 'Bienvenue' },
  { id: 'alert-critical', label: 'Alertes critiques' },
  { id: 'daily-digest', label: 'Digest (régressions)' },
  { id: 'daily-digest-ok', label: 'Digest (tout OK)' },
  { id: 'log-digest', label: 'Digest logs workers' },
  { id: 'sitemap-blocked', label: 'Sitemap bloqué' },
  { id: 'crawler-blocked', label: 'Crawler bloqué' },
  { id: 'reset-password', label: 'Reset mot de passe' },
  { id: 'sitemap-estimate', label: 'Estimation sitemap' },
  { id: 'sitemap-estimate-large', label: 'Estimation (gros site)' },
  { id: 'payment-failed', label: 'Échec paiement' },
  { id: 'invite', label: 'Invitation organisation' },
]

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

  &__nav {
    display: flex;
    align-items: center;
    gap: $spacing-6;

    @media (max-width: $breakpoint-md) {
      &--desktop {
        display: none;
      }
    }
  }

  &__nav-link {
    color: $color-gray-600;
    text-decoration: none;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    transition: color $transition-fast;

    &:hover {
      color: $color-gray-900;
    }
  }

  &__nav-cta {
    display: inline-flex;
    align-items: center;
    padding: $spacing-2 $spacing-5;
    background: $color-accent;
    color: $color-white;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border-radius: $radius-lg;
    text-decoration: none;
    transition: all $transition-fast;

    &:hover {
      background: $color-accent-light;
      box-shadow: $shadow-md;
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

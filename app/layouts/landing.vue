<template>
  <div class="layout-landing">
    <header :class="['layout-landing__header', { 'layout-landing__header--scrolled': isScrolled }]">
      <div class="layout-landing__header-inner">
        <NuxtLink to="/" class="layout-landing__logo">
          <AppLogo size="sm" />
        </NuxtLink>

        <!-- Desktop nav -->
        <nav class="layout-landing__nav layout-landing__nav--desktop">
          <NuxtLink to="/#features" class="layout-landing__nav-link">Fonctionnalités</NuxtLink>
          <NuxtLink to="/#pricing" class="layout-landing__nav-link">Tarifs</NuxtLink>
          <NuxtLink to="/blog" class="layout-landing__nav-link">Blog</NuxtLink>
          <NuxtLink to="/docs" class="layout-landing__nav-link">Docs</NuxtLink>
          <NuxtLink to="/#download" class="layout-landing__nav-link">Télécharger</NuxtLink>
          <template v-if="isLoggedIn">
            <NuxtLink to="/dashboard/sites" class="layout-landing__nav-cta">Dashboard</NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="layout-landing__nav-link">Connexion</NuxtLink>
            <NuxtLink to="/register" class="layout-landing__nav-cta">Tester gratuitement</NuxtLink>
          </template>
        </nav>

        <!-- Mobile burger -->
        <button class="layout-landing__burger" aria-label="Menu" @click="mobileMenuOpen = !mobileMenuOpen">
          <svg v-if="!mobileMenuOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <!-- Mobile dropdown -->
      <nav v-if="mobileMenuOpen" class="layout-landing__mobile-nav">
        <NuxtLink to="/#features" class="layout-landing__mobile-link" @click="mobileMenuOpen = false">Fonctionnalités</NuxtLink>
        <NuxtLink to="/#pricing" class="layout-landing__mobile-link" @click="mobileMenuOpen = false">Tarifs</NuxtLink>
        <NuxtLink to="/blog" class="layout-landing__mobile-link" @click="mobileMenuOpen = false">Blog</NuxtLink>
        <NuxtLink to="/docs" class="layout-landing__mobile-link" @click="mobileMenuOpen = false">Docs</NuxtLink>
        <NuxtLink to="/#download" class="layout-landing__mobile-link" @click="mobileMenuOpen = false">Télécharger</NuxtLink>
        <template v-if="isLoggedIn">
          <NuxtLink to="/dashboard/sites" class="layout-landing__mobile-link" @click="mobileMenuOpen = false">Dashboard</NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="layout-landing__mobile-link" @click="mobileMenuOpen = false">Connexion</NuxtLink>
          <NuxtLink to="/register" class="layout-landing__nav-cta" @click="mobileMenuOpen = false">Tester gratuitement</NuxtLink>
        </template>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer class="layout-landing__footer">
      <div class="layout-landing__footer-inner">
        <div class="layout-landing__footer-grid">
          <div class="layout-landing__footer-brand">
            <AppLogo size="sm" />
            <p class="layout-landing__footer-tagline">
              <strong>Seogard</strong> est un logiciel open-source édité par SAVEPNP (SAS). Tous droits réservés.
            </p>
            <p class="layout-landing__footer-tagline">
              Notre mission est de protéger chaque page indexée contre les régressions SEO invisibles — avant que Google ne les découvre.<br>Objectif&nbsp;: 100&nbsp;000 sites monitorés d'ici 2028.
            </p>
            <p class="layout-landing__footer-tagline">
              Besoin d'aide ? <a href="mailto:support@seogard.io" class="layout-landing__footer-contact">support@seogard.io</a>
            </p>
          </div>
          <div class="layout-landing__footer-faq">
            <h4 class="layout-landing__footer-heading">Questions fréquentes</h4>
            <AppAccordion :items="FOOTER_FAQ" size="sm" />
          </div>
          <div class="layout-landing__footer-col">
            <h4 class="layout-landing__footer-heading">Liens</h4>
            <NuxtLink to="/#features" class="layout-landing__footer-link">Fonctionnalités</NuxtLink>
            <NuxtLink to="/#pricing" class="layout-landing__footer-link">Tarifs</NuxtLink>
            <NuxtLink to="/blog" class="layout-landing__footer-link">Blog</NuxtLink>
            <NuxtLink to="/bot" class="layout-landing__footer-link">Bot / Crawler</NuxtLink>
            <NuxtLink to="/llms.txt" class="layout-landing__footer-link" external>llms.txt</NuxtLink>
          </div>
          <div class="layout-landing__footer-col">
            <h4 class="layout-landing__footer-heading">Légal</h4>
            <NuxtLink to="/legal/cgu" class="layout-landing__footer-link">CGU</NuxtLink>
            <NuxtLink to="/legal/cgv" class="layout-landing__footer-link">CGV</NuxtLink>
            <NuxtLink to="/legal/privacy" class="layout-landing__footer-link">Confidentialité</NuxtLink>
            <NuxtLink to="/legal/cookies" class="layout-landing__footer-link">Cookies</NuxtLink>
            <NuxtLink to="/legal/mentions" class="layout-landing__footer-link">Mentions légales</NuxtLink>
            <a href="https://github.com/seogard-software/seogard/blob/main/LICENCE" target="_blank" rel="noopener" class="layout-landing__footer-link">Licence (BSL 1.1)</a>
          </div>
        </div>
      </div>
    </footer>

    <CookieBanner />
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const isLoggedIn = computed(() => !!authStore.currentUser)

const FOOTER_FAQ = [
  {
    q: 'Qu\'est-ce que Seogard surveille exactement ?',
    a: 'Plus d\'une centaine de règles : meta title et description, canonical, noindex accidentel, status codes (404, 500, redirections), SSR cassé, hreflang, Open Graph et bien plus. Chaque règle est classée par sévérité : critique, warning ou info.',
  },
  {
    q: 'Seogard est-il gratuit ?',
    a: 'La version self-hosted est gratuite, open-source et sans limite de pages. La version Cloud est facturée à l\'usage pour ceux qui préfèrent ne pas gérer l\'infrastructure.',
  },
  {
    q: 'En quoi Seogard est différent d\'un crawler classique ?',
    a: 'Seogard est le seul outil qui compare automatiquement le HTML brut (ce que Google indexe) et le rendu JavaScript (ce que vous voyez). Un SSR cassé passe inaperçu dans le navigateur — Seogard le détecte.',
  },
  {
    q: 'Comment fonctionnent les alertes ?',
    a: 'Chaque page est crawlée quotidiennement. Dès qu\'un changement est détecté (meta modifiée, status code anormal, SSR cassé), une alerte avec le diff avant/après est envoyée par email, Slack, Teams ou Jira.',
  },
]

const isScrolled = ref(false)
const mobileMenuOpen = ref(false)

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

.layout-landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    padding: $spacing-3 $spacing-4 0;

    &--scrolled .layout-landing__header-inner {
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
  }

  &__nav-link {
    color: $color-gray-600;
    text-decoration: none;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    transition: color $transition-fast;

    &:hover {
      color: $color-gray-900;
      text-decoration: none;
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
      text-decoration: none;
    }
  }

  // ─── FOOTER ───
  &__footer {
    margin-top: auto;
    padding: 0 $spacing-4;
  }

  &__footer-inner {
    max-width: $container-width;
    margin: 0 auto;
    padding: $spacing-12 $spacing-6 $spacing-8;
  }

  &__footer-grid {
    display: grid;
    grid-template-columns: 2fr 3fr 1fr 1fr;
    gap: $spacing-8;
    margin-bottom: $spacing-12;
  }

  &__footer-brand {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__footer-tagline {
    font-size: $font-size-sm;
    color: $color-gray-500;
    line-height: $line-height-normal;
    margin: 0;
  }

  &__footer-faq {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__footer-col {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__footer-heading {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin-bottom: $spacing-1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__footer-link {
    font-size: $font-size-sm;
    color: $color-gray-500;
    text-decoration: none;
    transition: color $transition-fast;

    &:hover {
      color: $color-gray-900;
    }

  }

  &__footer-contact {
    color: #09f;
    text-decoration: underline;

    &:hover {
      color: #07d;
    }
  }

  &__burger {
    display: none;
    background: none;
    border: none;
    color: $color-gray-700;
    cursor: pointer;
    padding: $spacing-1;
  }

  &__mobile-nav {
    display: none;
  }

  // ─── RESPONSIVE ───
  @media (max-width: $breakpoint-md) {
    &__nav--desktop {
      display: none;
    }

    &__burger {
      display: flex;
    }

    &__mobile-nav {
      display: flex;
      flex-direction: column;
      gap: $spacing-1;
      max-width: $header-width;
      margin: $spacing-2 auto 0;
      padding: $spacing-4 $spacing-6;
      background: $color-white;
      border: 1px solid $color-gray-200;
      border-radius: 16px;
    }

    &__mobile-link {
      display: block;
      padding: $spacing-3 $spacing-4;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      color: $color-gray-700;
      text-decoration: none;
      border-radius: $radius-md;

      &:hover {
        background: $color-gray-50;
        color: $color-gray-900;
        text-decoration: none;
      }
    }

    &__footer-grid {
      grid-template-columns: 1fr 1fr;
      gap: $spacing-8;
    }

    &__footer-brand,
    &__footer-faq {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: $breakpoint-sm) {
    &__footer-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

<template>
  <div class="layout-landing">
    <header :class="['layout-landing__header', { 'layout-landing__header--scrolled': isScrolled }]">
      <div class="layout-landing__header-inner">
        <NuxtLink :to="localePath({ name: 'index' })" class="layout-landing__logo">
          <AppLogo size="sm" />
        </NuxtLink>

        <!-- Desktop nav (source unique : PublicNav) -->
        <PublicNav />

        <!-- Mobile burger -->
        <button class="layout-landing__burger" :aria-label="$t('landing.layout.menuAria')" @click="mobileMenuOpen = !mobileMenuOpen">
          <svg v-if="!mobileMenuOpen" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <!-- Mobile dropdown (même source : PublicNav variant mobile) -->
      <PublicNav v-if="mobileMenuOpen" variant="mobile" @navigate="mobileMenuOpen = false" />
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
              <strong>Seogard</strong> {{ $t('landing.layout.footer.tagline1') }}
            </p>
            <p class="layout-landing__footer-tagline">
              {{ $t('landing.layout.footer.mission') }}<br>{{ $t('landing.layout.footer.objective') }}
            </p>
            <p class="layout-landing__footer-tagline">
              {{ $t('landing.layout.footer.needHelp') }} <a href="mailto:support@seogard.io" class="layout-landing__footer-contact">support@seogard.io</a>
            </p>
            <GithubLink label class="layout-landing__footer-github" />
          </div>
          <div class="layout-landing__footer-faq">
            <h4 class="layout-landing__footer-heading">{{ $t('landing.layout.footer.faqHeading') }}</h4>
            <AppAccordion :items="footerFaq" size="sm" />
          </div>
          <div class="layout-landing__footer-col">
            <h4 class="layout-landing__footer-heading">{{ $t('landing.layout.footer.linksHeading') }}</h4>
            <NuxtLink :to="localePath({ name: 'index', hash: '#features' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkFeatures') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'formations' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkFormations') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'outils-monitoring' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkMonitoring') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'outils-audit' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkAudit') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'scanner' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkScanner') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'tarifs' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkPricing') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'docs-rules' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkDocs') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'bot' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkBot') }}</NuxtLink>
            <NuxtLink to="/llms.txt" class="layout-landing__footer-link" external>llms.txt</NuxtLink>
          </div>
          <div class="layout-landing__footer-col">
            <h4 class="layout-landing__footer-heading">{{ $t('landing.layout.footer.legalHeading') }}</h4>
            <NuxtLink :to="localePath({ name: 'legal-cgu' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkCgu') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'legal-cgv' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkCgv') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'legal-privacy' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkPrivacy') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'legal-cookies' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkCookies') }}</NuxtLink>
            <NuxtLink :to="localePath({ name: 'legal-mentions' })" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkMentions') }}</NuxtLink>
            <a href="https://github.com/seogard-software/seogard/blob/main/LICENCE" target="_blank" rel="noopener" class="layout-landing__footer-link">{{ $t('landing.layout.footer.linkLicence') }}</a>
          </div>
        </div>
      </div>
    </footer>

    <CookieBanner />
  </div>
</template>

<script setup lang="ts">
import { RULES_COUNT } from '~~/shared/utils/rules-list'

const { t } = useI18n()
const localePath = useLocalePath()

useCanonicalHead()

const footerFaq = computed(() => [
  { q: t('landing.layout.faq.q1'), a: t('landing.layout.faq.a1', { count: RULES_COUNT }) },
  { q: t('landing.layout.faq.q2'), a: t('landing.layout.faq.a2') },
  { q: t('landing.layout.faq.q3'), a: t('landing.layout.faq.a3') },
  { q: t('landing.layout.faq.q4'), a: t('landing.layout.faq.a4') },
])

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

  // GithubLink (variante --labeled = padding interne) : on compense le padding gauche
  // pour aligner l'icône avec le texte de la colonne marque.
  &__footer-github {
    margin-top: $spacing-2;
    margin-left: -$spacing-4;
  }

  &__burger {
    display: none;
    background: none;
    border: none;
    color: $color-gray-700;
    cursor: pointer;
    padding: $spacing-1;
  }

  // ─── RESPONSIVE ───
  @media (max-width: $breakpoint-md) {
    &__burger {
      display: flex;
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

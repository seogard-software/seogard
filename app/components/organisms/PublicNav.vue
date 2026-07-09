<template>
  <!-- Desktop : menu scindé — pages à gauche (collées au logo), actions + langue à droite -->
  <nav v-if="variant === 'desktop'" class="public-nav public-nav--desktop">
    <div class="public-nav__group">
      <template v-for="link in links" :key="link.label">
        <NavDropdown
          v-if="link.children"
          :label="link.label"
          :items="link.children"
          @navigate="emit('navigate')"
        />
        <NuxtLink
          v-else
          :to="localePath({ name: link.name! })"
          class="public-nav__link"
          @click="emit('navigate')"
        >
          {{ link.label }}
        </NuxtLink>
      </template>
    </div>

    <div class="public-nav__group public-nav__group--actions">
      <LanguageSwitcher />
      <template v-if="isLoggedIn">
        <NuxtLink to="/dashboard/sites" class="public-nav__cta" @click="emit('navigate')">
          {{ $t('common.nav.dashboard') }}
        </NuxtLink>
      </template>
      <template v-else>
        <NuxtLink to="/login" class="public-nav__link" @click="emit('navigate')">
          {{ $t('common.nav.login') }}
        </NuxtLink>
        <NuxtLink to="/register" class="public-nav__link" @click="emit('navigate')">
          {{ $t('common.nav.tryFree') }}
        </NuxtLink>
        <a :href="demoUrl" target="_blank" rel="noopener" class="public-nav__cta" @click="emit('navigate')">
          {{ $t('common.nav.bookDemo') }}
        </a>
      </template>
    </div>
  </nav>

  <!-- Mobile : pages en haut (« Le produit »), réglage « Langue », actions en bas -->
  <nav v-else class="public-nav public-nav--mobile">
    <span class="public-nav__mobile-group">{{ $t('common.nav.productGroup') }}</span>
    <template v-for="link in links" :key="link.label">
      <NuxtLink
        v-if="!link.children"
        :to="localePath({ name: link.name! })"
        class="public-nav__mobile-link"
        @click="emit('navigate')"
      >
        {{ link.label }}
      </NuxtLink>
      <template v-else>
        <NuxtLink
          v-for="child in link.children"
          :key="child.name"
          :to="localePath({ name: child.name })"
          class="public-nav__mobile-item"
          @click="emit('navigate')"
        >
          <span v-if="child.emoji" class="public-nav__mobile-item-ic" aria-hidden="true">{{ child.emoji }}</span>
          <span class="public-nav__mobile-item-body">
            <span class="public-nav__mobile-item-label">{{ child.label }}</span>
            <span v-if="child.desc" class="public-nav__mobile-item-desc">{{ child.desc }}</span>
          </span>
        </NuxtLink>
      </template>
    </template>

    <div class="public-nav__mobile-rule" />
    <div class="public-nav__mobile-lang">
      <span class="public-nav__mobile-lang-label">{{ $t('common.nav.language') }}</span>
      <LanguageSwitcher variant="mobile" />
    </div>
    <div class="public-nav__mobile-rule" />

    <template v-if="isLoggedIn">
      <NuxtLink to="/dashboard/sites" class="public-nav__mobile-link" @click="emit('navigate')">
        {{ $t('common.nav.dashboard') }}
      </NuxtLink>
    </template>
    <template v-else>
      <NuxtLink to="/login" class="public-nav__mobile-link" @click="emit('navigate')">
        {{ $t('common.nav.login') }}
      </NuxtLink>
      <NuxtLink to="/register" class="public-nav__mobile-link" @click="emit('navigate')">
        {{ $t('common.nav.tryFree') }}
      </NuxtLink>
      <a :href="demoUrl" target="_blank" rel="noopener" class="public-nav__mobile-cta" @click="emit('navigate')">
        {{ $t('common.nav.bookDemo') }}
      </a>
    </template>
  </nav>
</template>

<script setup lang="ts">
// Nav publique partagée (landing + docs) — SOURCE UNIQUE des liens + CTA, pour éviter le drift.
// Menu scindé : à gauche les pages du produit (collées au logo), à droite les actions + le
// sélecteur de langue. Le comportement propre à chaque layout (scroll, burger) reste dans le layout.
const { variant = 'desktop' } = defineProps<{ variant?: 'desktop' | 'mobile' }>()
const emit = defineEmits<{ navigate: [] }>()

const authStore = useAuthStore()
const isLoggedIn = computed(() => !!authStore.currentUser)
const demoUrl = useRuntimeConfig().public.demoUrl

// Liens stables = base des sitelinks Google → uniquement de VRAIES pages indexables (zéro ancre #).
// Scanner et Tarifs vivent dans le footer (maillage) ; le header = Formations + Outils.
interface NavChild { name: string, label: string, desc?: string, emoji?: string }
interface NavLink {
  name?: string
  label: string
  children?: NavChild[]
}

const { t } = useI18n()
const localePath = useLocalePath()

// Liens par NOM de route (les chemins par locale sont résolus par localePath).
const links = computed<NavLink[]>(() => [
  { name: 'formations', label: t('common.nav.formations') },
  {
    label: t('common.nav.tools'),
    children: [
      { name: 'outils-monitoring', label: t('common.nav.toolMonitoring'), desc: t('common.nav.toolMonitoringDesc'), emoji: '📡' },
      { name: 'outils-audit', label: t('common.nav.toolAudit'), desc: t('common.nav.toolAuditDesc'), emoji: '🔍' },
    ],
  },
])
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.public-nav {
  &--desktop {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-left: $spacing-8;

    @media (max-width: $breakpoint-md) {
      display: none;
    }
  }

  &__group {
    display: flex;
    align-items: center;
    gap: $spacing-6;

    &--actions {
      gap: $spacing-5;
    }
  }

  &--mobile {
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

  &__link {
    color: $color-gray-600;
    text-decoration: none;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    white-space: nowrap;
    transition: color $transition-fast;

    &:hover {
      color: $color-gray-900;
      text-decoration: none;
    }
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

  &__mobile-item {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    border-radius: $radius-md;
    text-decoration: none;

    &:hover {
      background: $color-gray-50;
      text-decoration: none;
    }
  }

  &__mobile-item-ic {
    flex: none;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    background: $color-gray-100;
    font-size: 17px;
    line-height: 1;
  }

  &__mobile-item-body {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  &__mobile-item-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-900;
  }

  &__mobile-item-desc {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__mobile-group {
    display: block;
    padding: $spacing-3 $spacing-4 $spacing-1;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $color-gray-400;
  }

  &__mobile-rule {
    height: 1px;
    background: $color-gray-100;
    margin: $spacing-2 $spacing-2;
  }

  &__mobile-lang {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-2 $spacing-4;
  }

  &__mobile-lang-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    padding: $spacing-2 $spacing-5;
    background: $color-accent;
    color: $color-white;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border-radius: $radius-lg;
    text-decoration: none;
    white-space: nowrap;
    transition: all $transition-fast;

    &:hover {
      background: $color-accent-light;
      box-shadow: $shadow-md;
      text-decoration: none;
    }
  }

  &__mobile-cta {
    display: block;
    margin-top: $spacing-2;
    padding: $spacing-3 $spacing-4;
    background: $color-accent;
    color: $color-white;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    text-align: center;
    border-radius: $radius-lg;
    text-decoration: none;

    &:hover {
      background: $color-accent-light;
      text-decoration: none;
    }
  }
}
</style>

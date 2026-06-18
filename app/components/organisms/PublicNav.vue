<template>
  <nav :class="['public-nav', `public-nav--${variant}`]">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :class="variant === 'mobile' ? 'public-nav__mobile-link' : 'public-nav__link'"
      @click="emit('navigate')"
    >
      {{ link.label }}
    </NuxtLink>

    <template v-if="isLoggedIn">
      <NuxtLink
        to="/dashboard/sites"
        :class="variant === 'mobile' ? 'public-nav__mobile-link' : 'public-nav__cta'"
        @click="emit('navigate')"
      >
        Dashboard
      </NuxtLink>
    </template>
    <template v-else>
      <NuxtLink
        to="/login"
        :class="variant === 'mobile' ? 'public-nav__mobile-link' : 'public-nav__link'"
        @click="emit('navigate')"
      >
        Connexion
      </NuxtLink>
      <NuxtLink
        to="/register"
        :class="variant === 'mobile' ? 'public-nav__mobile-link' : 'public-nav__link'"
        @click="emit('navigate')"
      >
        Tester gratuitement
      </NuxtLink>
      <a :href="demoUrl" target="_blank" rel="noopener" class="public-nav__cta" @click="emit('navigate')">
        Réserver une démo
      </a>
    </template>
  </nav>
</template>

<script setup lang="ts">
// Nav publique partagée (landing + docs) — SOURCE UNIQUE des liens + CTA, pour éviter le drift
// (ex : « Réserver une démo » manquait sur /docs, lien Tarifs périmé). Le comportement propre à
// chaque layout (scroll, burger, sidebar docs, toggle mobile) reste dans le layout.
const { variant = 'desktop' } = defineProps<{ variant?: 'desktop' | 'mobile' }>()
const emit = defineEmits<{ navigate: [] }>()

const authStore = useAuthStore()
const isLoggedIn = computed(() => !!authStore.currentUser)
const demoUrl = useRuntimeConfig().public.demoUrl

// Liens stables = base des sitelinks Google → uniquement de VRAIES pages indexables (zéro ancre #).
const links = [
  { to: '/scanner', label: 'Scanner' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/docs', label: 'Docs' },
  { to: '/blog', label: 'Blog' },
]
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.public-nav {
  &--desktop {
    display: flex;
    align-items: center;
    gap: $spacing-6;

    @media (max-width: $breakpoint-md) {
      display: none;
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
    transition: all $transition-fast;

    &:hover {
      background: $color-accent-light;
      box-shadow: $shadow-md;
      text-decoration: none;
    }
  }
}
</style>

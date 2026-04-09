<template>
  <div class="page-settings">
    <DashboardHeader title="Paramètres du compte" />

    <!-- Profil -->
    <section class="page-settings__section">
      <div class="page-settings__section-header">
        <AppIcon name="user" size="sm" />
        <h2 class="page-settings__section-title">Profil</h2>
      </div>
      <div class="page-settings__section-body">
        <AppInput
          :model-value="email"
          label="Email"
          type="email"
          disabled
        />
        <p class="page-settings__hint">L'email ne peut pas être modifié.</p>
      </div>
    </section>

    <div class="page-settings__separator" />

    <!-- Sécurité -->
    <section class="page-settings__section">
      <div class="page-settings__section-header">
        <AppIcon name="shield-check" size="sm" />
        <h2 class="page-settings__section-title">Sécurité</h2>
        <AppBadge v-if="totpEnabled" variant="success">2FA activée</AppBadge>
        <span v-else class="page-settings__flag">Non configuré</span>
      </div>
      <div class="page-settings__section-body">
        <TwoFactorSetup />
      </div>
    </section>

    <div v-if="orgId" class="page-settings__separator" />

    <!-- Link to org settings -->
    <section v-if="orgId" class="page-settings__section page-settings__section--link">
      <NuxtLink :to="`/dashboard/organizations/${orgId}/settings`" class="page-settings__nav-link">
        <AppIcon name="building" size="sm" />
        <span>Paramètres de l'organisation</span>
        <AppIcon name="chevron-right" size="sm" class="page-settings__nav-chevron" />
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Paramètres' })
useSeoMeta({ robots: 'noindex, nofollow' })

const authStore = useAuthStore()
const orgStore = useOrganizationStore()

const email = computed(() => authStore.currentUser?.email ?? '')
const totpEnabled = computed(() => authStore.currentUser?.totpEnabled ?? false)
const orgId = computed(() => orgStore.activeOrgId)
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-settings {
  max-width: 480px;

  &__section {
    background: $color-white;
    border-radius: $radius-2xl;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.04);
    overflow: hidden;

    &--link {
      padding: 0;
      border: none;
      background: none;
    }
  }

  &__section-header {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-4 $spacing-6;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    color: $color-gray-400;
  }

  &__section-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__section-body {
    padding: $spacing-6;
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  // ── Dashed separator ──

  &__separator {
    height: 32px;
    position: relative;
    margin: 0 auto;
    width: 100%;

    &::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 0;
      border-left: 1px dashed $color-gray-300;
    }
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__flag {
    margin-left: auto;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    padding: 2px $spacing-2;
    border-radius: $radius-full;
    background-color: $color-warning-bg;
    color: $color-warning;
  }

  &__nav-link {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-4 $spacing-5;
    border-radius: $radius-2xl;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-600;
    text-decoration: none;
    background: $color-white;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-900;
      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 4px 12px rgba(0, 0, 0, 0.06);
      background: $color-white;
    }
  }

  &__nav-chevron {
    margin-left: auto;
    color: $color-gray-300;
  }
}
</style>

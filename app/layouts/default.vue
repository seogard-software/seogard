<template>
  <div class="layout-default">
    <AppSidebar />
    <main class="layout-default__content">
      <div v-if="showTrialBanner" class="trial-banner">
        <div class="trial-banner__inner">
          <div class="trial-banner__text">
            <span class="trial-banner__days">{{ trialDaysLeft }} jour{{ trialDaysLeft > 1 ? 's' : '' }}</span>
            restant{{ trialDaysLeft > 1 ? 's' : '' }} sur votre essai gratuit
            <span class="trial-banner__sep">·</span>
            Souscrivez maintenant, vos jours d'essai restants sont conservés
          </div>
          <NuxtLink :to="billingUrl" class="trial-banner__cta">
            Activer la facturation
          </NuxtLink>
        </div>
      </div>
      <div class="layout-default__page">
        <slot />
      </div>
    </main>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { getTrialDaysLeft } from '~~/shared/utils/pricing'

const authStore = useAuthStore()
const orgStore = useOrganizationStore()

const { isSelfHosted } = useDeployment()
const trialDaysLeft = computed(() => getTrialDaysLeft(authStore.trialEndsAt))

const showTrialBanner = computed(() => {
  if (isSelfHosted.value) return false
  const sub = authStore.subscription
  if (!sub) return false
  if (sub.stripeCustomerId) return false
  return sub.stripeStatus === 'trialing' && trialDaysLeft.value > 0
})

const billingUrl = computed(() => {
  const orgId = orgStore.activeOrgId
  return orgId ? `/dashboard/organizations/${orgId}/billing` : '/dashboard/sites'
})
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '~/assets/styles/variables' as *;

.layout-default {
  display: flex;
  min-height: 100vh;

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  &__page {
    flex: 1;
    padding: $spacing-6 $spacing-8;
  }
}

.trial-banner {
  background: $color-info-bg;
  border-bottom: 1px solid rgba($color-info, 0.12);

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-3 $spacing-8;
    gap: $spacing-4;
  }

  &__text {
    font-size: $font-size-sm;
    color: $color-gray-600;
    letter-spacing: 0.01em;
  }

  &__days {
    font-weight: $font-weight-semibold;
    color: $color-info;
  }

  &__sep {
    margin: 0 $spacing-1;
    color: $color-gray-400;
  }

  &__cta {
    flex-shrink: 0;
    padding: $spacing-1 $spacing-4;
    background: $color-info;
    color: $color-white;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    border-radius: $radius-full;
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: background $transition-fast;

    &:hover {
      background: color.adjust($color-info, $lightness: -8%);
    }
  }
}
</style>

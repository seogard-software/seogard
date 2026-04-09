<template>
  <div class="page-billing">
    <DashboardHeader title="Facturation">
      <template #back>
        <NuxtLink :to="`/dashboard/organizations/${orgId}/settings`" class="page-billing__back">
          <AppIcon name="arrow-left" size="sm" />
          Paramètres
        </NuxtLink>
      </template>
    </DashboardHeader>

    <div class="page-billing__grid">
      <!-- Subscription status -->
      <AppCard class="page-billing__card">
        <div class="page-billing__card-header">
          <div class="page-billing__card-icon page-billing__card-icon--accent">
            <AppIcon name="chart-bar" size="sm" />
          </div>
          <h3 class="page-billing__card-title">Abonnement</h3>
        </div>
        <div class="page-billing__card-body">
          <div class="page-billing__status-row">
            <AppBadge :variant="subscriptionBadgeVariant">{{ subscriptionLabel }}</AppBadge>
          </div>

          <p v-if="subscriptionMessage" class="page-billing__hint">{{ subscriptionMessage }}</p>

          <div v-if="showPaymentWarning" class="page-billing__warning">
            {{ paymentWarningMessage }}
          </div>

          <div class="page-billing__actions">
            <AppButton
              v-if="showActivateBilling"
              variant="primary"
              size="sm"
              :loading="subscribeLoading"
              @click="activateBilling"
            >
              Activer la facturation
            </AppButton>
            <AppButton
              v-if="showManagePayment"
              variant="secondary"
              size="sm"
              :loading="portalLoading"
              @click="goToPortal"
            >
              Gérer le paiement
            </AppButton>
          </div>
        </div>
      </AppCard>

      <!-- Pricing info -->
      <AppCard class="page-billing__card">
        <div class="page-billing__card-header">
          <div class="page-billing__card-icon page-billing__card-icon--accent">
            <AppIcon name="chart-bar" size="sm" />
          </div>
          <h3 class="page-billing__card-title">Tarification</h3>
        </div>
        <div class="page-billing__card-body">
          <p class="page-billing__pricing-line">{{ formattedPricePerPage }} € / mois / page monitorée — sans engagement</p>
          <p class="page-billing__hint">Seules les nouvelles pages découvertes sont facturées. <strong>Recrawler une page déjà connue ne coûte rien.</strong></p>
          <div v-if="pagesUsed > 0" class="page-billing__estimate">
            <div class="page-billing__estimate-left">
              <span class="page-billing__estimate-count">{{ pagesUsed.toLocaleString('fr-FR') }}</span>
              <span class="page-billing__estimate-label">pages ce mois</span>
            </div>
            <span class="page-billing__estimate-price">≈ {{ estimatedMonthlyPrice }} €</span>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- How it works -->
    <div class="page-billing__explainer">
      <h4 class="page-billing__explainer-title">Comment ça marche</h4>
      <ul class="page-billing__explainer-list">
        <li>Seules les pages <strong>réellement crawlées</strong> dans le mois sont facturées</li>
        <li>Relancer un crawl sur la même zone ne coûte rien de plus</li>
        <li>Les pages non crawlées ce mois-ci ne sont pas comptées</li>
      </ul>
      <p class="page-billing__explainer-example">
        Exemple : un site de 300k pages avec 3 zones de 10k → vous payez <strong>30k pages</strong>. Le mois suivant vous ne crawlez que 10k → vous payez <strong>10k pages</strong>.
      </p>
    </div>

    <!-- Invoices link -->
    <div class="page-billing__invoices-link">
      <NuxtLink :to="`/dashboard/organizations/${orgId}/billing/invoices`">Voir mes factures →</NuxtLink>
    </div>

  </div>
</template>

<script setup lang="ts">
import { getCloudPricePerPage, formatCloudPrice, getTrialDaysLeft } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'default' })

const { isSelfHosted } = useDeployment()
if (isSelfHosted.value) navigateTo('/dashboard/sites', { replace: true })

useHead({ title: 'Facturation' })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const orgId = computed(() => route.params.orgId as string)

onMounted(async () => {
  const checkout = route.query.checkout as string | undefined
  if (checkout === 'success') {
    await authStore.fetchMe()
    toast.success('Facturation activée avec succès.')
    router.replace({ query: {} })
  } else if (checkout === 'cancel') {
    toast.warning('Activation annulée. Vous pouvez réessayer à tout moment.')
    router.replace({ query: {} })
  }
})

const formattedPricePerPage = formatCloudPrice()

const pagesUsed = computed(() => authStore.subscription?.totalPagesUsed ?? 0)

const estimatedMonthlyPrice = computed(() => {
  return (pagesUsed.value * getCloudPricePerPage()).toLocaleString('fr-FR', { minimumFractionDigits: 0 })
})

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Essai gratuit',
  active: 'Actif',
  past_due: 'Impayé',
  canceled: 'Annulé',
  unpaid: 'Impayé',
  incomplete: 'Incomplet',
}

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  trialing: 'info',
  active: 'success',
  past_due: 'warning',
  canceled: 'danger',
  unpaid: 'danger',
  incomplete: 'neutral',
}

const subscriptionLabel = computed(() => {
  const sub = authStore.subscription
  if (!sub) return 'Essai gratuit'
  return STATUS_LABELS[sub.stripeStatus] ?? sub.stripeStatus
})

const subscriptionBadgeVariant = computed(() => {
  const status = authStore.subscription?.stripeStatus
  return status ? STATUS_VARIANTS[status] ?? 'neutral' : 'info'
})

const trialDaysLeft = computed(() => getTrialDaysLeft(authStore.trialEndsAt))

const subscriptionMessage = computed(() => {
  const sub = authStore.subscription
  if (!sub) return null

  if (sub.stripeStatus === 'trialing' && trialDaysLeft.value > 0) {
    return `Essai gratuit — ${trialDaysLeft.value} jour${trialDaysLeft.value > 1 ? 's' : ''} restant${trialDaysLeft.value > 1 ? 's' : ''}.`
  }
  if (sub.stripeStatus === 'trialing' && trialDaysLeft.value === 0) {
    return 'Votre essai de 14 jours est terminé. Activez la facturation pour continuer.'
  }
  if (sub.stripeStatus === 'active') {
    return `Facturation active — ${pagesUsed.value.toLocaleString('fr-FR')} pages monitorées ce mois-ci.`
  }
  if (sub.stripeStatus === 'canceled') {
    return 'Votre abonnement est annulé. Réactivez la facturation pour relancer vos crawls.'
  }
  return null
})

const showActivateBilling = computed(() => {
  const sub = authStore.subscription
  if (!sub) return false
  if (sub.stripeSubscriptionId) return false
  return sub.stripeStatus === 'trialing' || sub.stripeStatus === 'canceled'
})

const showManagePayment = computed(() => {
  return !!authStore.subscription?.stripeSubscriptionId
})

const showPaymentWarning = computed(() => {
  const status = authStore.subscription?.stripeStatus
  return status === 'past_due' || status === 'unpaid'
})

const paymentWarningMessage = computed(() => {
  if (authStore.subscription?.stripeStatus === 'past_due') {
    return 'Votre dernier paiement a échoué. Mettez à jour votre moyen de paiement pour éviter la suspension de vos crawls.'
  }
  return 'Votre abonnement est suspendu. Les crawls sont arrêtés.'
})

const subscribeLoading = ref(false)
const portalLoading = ref(false)

async function activateBilling() {
  subscribeLoading.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/subscribe', {
      method: 'POST',
    })
    if (url) navigateTo(url, { external: true })
  } catch {
    subscribeLoading.value = false
  }
}

async function goToPortal() {
  portalLoading.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/portal', {
      method: 'POST',
    })
    if (url) navigateTo(url, { external: true })
  } catch {
    portalLoading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-billing {
  &__back {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    color: $color-gray-500;
    font-size: $font-size-sm;
    text-decoration: none;
    transition: color $transition-fast;

    &:hover {
      color: $color-gray-800;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: $spacing-6;
  }

  &__card-header {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-5 $spacing-6;
    border-bottom: 1px solid $color-gray-200;
  }

  &__card-icon {
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--accent {
      background-color: rgba($color-accent, 0.1);
      color: $color-accent;
    }
  }

  &__card-title {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
  }

  &__card-body {
    padding: $spacing-6;
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__status-row {
    display: flex;
    align-items: center;
    gap: $spacing-3;
  }

  &__hint {
    font-size: $font-size-sm;
    color: $color-gray-500;

    strong {
      color: $color-gray-800;
      font-weight: $font-weight-semibold;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-3;
    flex-wrap: wrap;
  }

  &__warning {
    padding: $spacing-3 $spacing-4;
    background-color: $color-warning-bg;
    color: $color-warning;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
  }

  &__pricing-line {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__estimate {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-4 $spacing-5;
    background: $surface-elevated;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
  }

  &__estimate-left {
    display: flex;
    align-items: baseline;
    gap: $spacing-2;
  }

  &__estimate-count {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  &__estimate-label {
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  &__estimate-price {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    font-variant-numeric: tabular-nums;
  }

  &__explainer {
    margin-top: $spacing-6;
    padding: $spacing-5 $spacing-6;
    background: $surface-elevated;
    border: 1px solid $color-gray-200;
    border-radius: $radius-xl;
  }

  &__explainer-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    margin-bottom: $spacing-3;
  }

  &__explainer-list {
    list-style: none;
    padding: 0;
    margin: 0 0 $spacing-4 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-2;

    li {
      font-size: $font-size-sm;
      color: $color-gray-500;
      padding-left: $spacing-4;
      position: relative;

      &::before {
        content: '✓';
        position: absolute;
        left: 0;
        color: $color-success;
        font-weight: $font-weight-semibold;
      }

      strong {
        color: $color-gray-700;
      }
    }
  }

  &__explainer-example {
    font-size: $font-size-xs;
    color: $color-gray-400;
    padding: $spacing-3 $spacing-4;
    background: $surface-card;
    border-radius: $radius-md;

    strong {
      color: $color-gray-600;
    }
  }

  &__invoices-link {
    margin-top: $spacing-4;

    a {
      color: $color-accent;
      font-size: $font-size-sm;
      font-weight: $font-weight-medium;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

}
</style>

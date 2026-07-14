<template>
  <div class="page-billing">
    <DashboardHeader :title="$t('dashboard.billing.title')">
      <template #back>
        <NuxtLink :to="`/dashboard/organizations/${orgId}/settings`" class="page-billing__back">
          <AppIcon name="arrow-left" size="sm" />
          {{ $t('dashboard.billing.back') }}
        </NuxtLink>
      </template>
    </DashboardHeader>

    <!-- Hero : statut + activation -->
    <section class="page-billing__hero">
      <div class="page-billing__hero-main">
        <AppBadge :variant="subscriptionBadgeVariant">{{ subscriptionLabel }}</AppBadge>
        <h2 class="page-billing__hero-title">
          {{ subscriptionMessage ?? $t('dashboard.billing.heroDefault') }}
        </h2>

        <div v-if="showPaymentWarning" class="page-billing__warning">
          <AppIcon name="alert-triangle" size="sm" />
          {{ paymentWarningMessage }}
        </div>

        <div class="page-billing__actions">
          <AppButton
            v-if="showActivateBilling"
            variant="primary"
            size="lg"
            :loading="subscribeLoading"
            @click="activateBilling"
          >
            {{ $t('dashboard.billing.activate') }}
            <AppIcon name="chevron-right" size="sm" />
          </AppButton>
          <AppButton
            v-if="showManagePayment"
            variant="secondary"
            size="md"
            :loading="portalLoading"
            @click="goToPortal"
          >
            {{ $t('dashboard.billing.managePayment') }}
          </AppButton>
        </div>

        <ul class="page-billing__reassure">
          <li><AppIcon name="check" size="sm" /> {{ $t('dashboard.billing.reassure1') }}</li>
          <li><AppIcon name="check" size="sm" /> {{ $t('dashboard.billing.reassure2') }}</li>
          <li><AppIcon name="check" size="sm" /> {{ $t('dashboard.billing.reassure3') }}</li>
        </ul>
      </div>

      <!-- Prix, façon pricing card -->
      <div class="page-billing__price">
        <span class="page-billing__price-amount">{{ formattedPricePerPage }} €</span>
        <span class="page-billing__price-unit">{{ $t('dashboard.billing.priceUnit') }}</span>
        <div v-if="pagesUsed > 0" class="page-billing__usage">
          <div class="page-billing__usage-row">
            <span class="page-billing__usage-count">{{ pagesUsed.toLocaleString(numberLocale) }}</span>
            <span class="page-billing__usage-label">{{ $t('dashboard.billing.pagesThisMonth') }}</span>
          </div>
          <span class="page-billing__usage-price">{{ $t('dashboard.billing.usageEstimate', { price: estimatedMonthlyPrice }) }}</span>
        </div>
        <p v-else class="page-billing__usage-empty">{{ $t('dashboard.billing.usageEmpty') }}</p>
      </div>
    </section>

    <!-- Comment ça marche : 3 tuiles -->
    <section class="page-billing__how">
      <h4 class="page-billing__how-title">{{ $t('dashboard.billing.howTitle') }}</h4>
      <div class="page-billing__how-grid">
        <div class="page-billing__how-item">
          <div class="page-billing__how-icon"><AppIcon name="pages" size="sm" /></div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="$t('dashboard.billing.how1')" />
        </div>
        <div class="page-billing__how-item">
          <div class="page-billing__how-icon"><AppIcon name="refresh-cw" size="sm" /></div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="$t('dashboard.billing.how2')" />
        </div>
        <div class="page-billing__how-item">
          <div class="page-billing__how-icon"><AppIcon name="zap" size="sm" /></div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="$t('dashboard.billing.how3')" />
        </div>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p class="page-billing__how-example" v-html="$t('dashboard.billing.howExample', { price30k: examplePrice30k, price10k: examplePrice10k })" />
    </section>

    <!-- Factures -->
    <NuxtLink :to="`/dashboard/organizations/${orgId}/billing/invoices`" class="page-billing__invoices">
      <span class="page-billing__invoices-left">
        <span class="page-billing__invoices-icon"><AppIcon name="file" size="sm" /></span>
        <span class="page-billing__invoices-text">
          {{ $t('dashboard.billing.invoices') }}
          <span class="page-billing__invoices-sub">{{ $t('dashboard.billing.invoicesSub') }}</span>
        </span>
      </span>
      <span class="page-billing__invoices-cta">
        {{ $t('dashboard.billing.invoicesCta') }}
        <AppIcon name="chevron-right" size="sm" />
      </span>
    </NuxtLink>

  </div>
</template>

<script setup lang="ts">
import { getCloudPricePerPage, formatCloudPrice, getTrialDaysLeft } from '~~/shared/utils/pricing'
defineI18nRoute(false)

definePageMeta({ layout: 'default' })

const { isSelfHosted } = useDeployment()
if (isSelfHosted.value) navigateTo('/dashboard/sites', { replace: true })

const { t, locale } = useI18n()
useHead({ title: t('dashboard.billing.tabTitle') })
useSeoMeta({ robots: 'noindex, nofollow' })

const numberLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'fr-FR'))

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const analytics = useAnalytics()

const orgId = computed(() => route.params.orgId as string)

onMounted(async () => {
  const checkout = route.query.checkout as string | undefined
  if (checkout === 'success') {
    await authStore.fetchMe()
    analytics.capture('checkout_completed')
    toast.success(t('dashboard.billing.checkoutSuccess'))
    router.replace({ query: {} })
  } else if (checkout === 'cancel') {
    toast.warning(t('dashboard.billing.checkoutCancel'))
    router.replace({ query: {} })
  }
})

const formattedPricePerPage = formatCloudPrice(locale.value)

const pagesUsed = computed(() => authStore.subscription?.totalPagesUsed ?? 0)

const estimatedMonthlyPrice = computed(() => {
  return (pagesUsed.value * getCloudPricePerPage()).toLocaleString(numberLocale.value, { minimumFractionDigits: 0 })
})

// Exemples chiffrés en € (dynamiques : suivent le prix par page) — « 30k pages » seul se lit comme un montant.
const examplePrice30k = computed(() => (30_000 * getCloudPricePerPage()).toLocaleString(numberLocale.value, { maximumFractionDigits: 0 }))
const examplePrice10k = computed(() => (10_000 * getCloudPricePerPage()).toLocaleString(numberLocale.value, { maximumFractionDigits: 0 }))

const KNOWN_STATUSES = ['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete']

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  trialing: 'info',
  active: 'success',
  past_due: 'warning',
  canceled: 'danger',
  unpaid: 'danger',
  incomplete: 'neutral',
}

const trialDaysLeft = computed(() => getTrialDaysLeft(authStore.trialEndsAt))

// Un trial Stripe « trialing » mais expiré côté produit doit s'afficher « Essai terminé »,
// pas « Essai gratuit » (incohérent avec le message à côté).
const isTrialExpired = computed(() => authStore.subscription?.stripeStatus === 'trialing' && trialDaysLeft.value === 0)

const subscriptionLabel = computed(() => {
  const sub = authStore.subscription
  if (!sub) return t('dashboard.billing.status.trialing')
  if (isTrialExpired.value) return t('dashboard.billing.status.trialExpired')
  return KNOWN_STATUSES.includes(sub.stripeStatus) ? t(`dashboard.billing.status.${sub.stripeStatus}`) : sub.stripeStatus
})

const subscriptionBadgeVariant = computed(() => {
  if (isTrialExpired.value) return 'warning'
  const status = authStore.subscription?.stripeStatus
  return status ? STATUS_VARIANTS[status] ?? 'neutral' : 'info'
})

const subscriptionMessage = computed(() => {
  const sub = authStore.subscription
  if (!sub) return null

  if (sub.stripeStatus === 'trialing' && trialDaysLeft.value > 0) {
    return t('dashboard.billing.trialDaysLeft', trialDaysLeft.value)
  }
  if (sub.stripeStatus === 'trialing' && trialDaysLeft.value === 0) {
    return t('dashboard.billing.trialEnded')
  }
  if (sub.stripeStatus === 'active') {
    return t('dashboard.billing.billingActive', { pages: pagesUsed.value.toLocaleString(numberLocale.value) })
  }
  if (sub.stripeStatus === 'canceled') {
    return t('dashboard.billing.subscriptionCanceled')
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
    return t('dashboard.billing.paymentFailed')
  }
  return t('dashboard.billing.subscriptionSuspended')
})

const subscribeLoading = ref(false)
const portalLoading = ref(false)

async function activateBilling() {
  analytics.capture('subscribe_clicked')
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

  // ── Hero : statut + CTA + prix ──────────────────────────────
  &__hero {
    display: grid;
    grid-template-columns: 1fr 320px;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-2xl;
    box-shadow: $shadow-sm;
    overflow: hidden;

    @media (max-width: $breakpoint-md) {
      grid-template-columns: 1fr;
    }
  }

  &__hero-main {
    padding: $spacing-8;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $spacing-4;
  }

  &__hero-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    letter-spacing: -0.02em;
    line-height: $line-height-snug;
  }

  &__warning {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-3 $spacing-4;
    background-color: $color-warning-bg;
    color: $color-warning;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
  }

  &__actions {
    display: flex;
    gap: $spacing-3;
    flex-wrap: wrap;
    align-items: center;
  }

  &__reassure {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-2 $spacing-5;

    li {
      display: inline-flex;
      align-items: center;
      gap: $spacing-2;
      font-size: $font-size-sm;
      color: $color-gray-500;

      svg {
        color: $color-success;
      }
    }
  }

  // ── Carte prix (colonne droite du hero) ─────────────────────
  &__price {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-2;
    padding: $spacing-8 $spacing-6;
    background: $surface-elevated;
    border-left: 1px solid $color-gray-200;
    text-align: center;

    @media (max-width: $breakpoint-md) {
      border-left: none;
      border-top: 1px solid $color-gray-200;
    }
  }

  &__price-amount {
    font-size: $font-size-5xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    letter-spacing: -0.03em;
    line-height: $line-height-tight;
    font-variant-numeric: tabular-nums;
  }

  &__price-unit {
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  &__usage {
    margin-top: $spacing-4;
    width: 100%;
    padding: $spacing-4;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__usage-row {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: $spacing-2;
  }

  &__usage-count {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    font-variant-numeric: tabular-nums;
  }

  &__usage-label {
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  &__usage-price {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    font-variant-numeric: tabular-nums;
  }

  &__usage-empty {
    margin-top: $spacing-3;
    font-size: $font-size-xs;
    color: $color-gray-400;
  }

  // ── Comment ça marche : 3 tuiles ────────────────────────────
  &__how {
    margin-top: $spacing-6;
  }

  &__how-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    margin-bottom: $spacing-4;
  }

  &__how-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: $spacing-4;
  }

  &__how-item {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
    padding: $spacing-5;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-xl;
    transition: border-color $transition-fast, box-shadow $transition-fast;

    &:hover {
      border-color: $color-gray-300;
      box-shadow: $shadow-sm;
    }

    p {
      font-size: $font-size-sm;
      color: $color-gray-500;
      line-height: $line-height-normal;

      strong {
        color: $color-gray-800;
      }
    }
  }

  &__how-icon {
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba($color-accent, 0.06);
    color: $color-accent;
    flex-shrink: 0;
  }

  &__how-example {
    margin-top: $spacing-4;
    font-size: $font-size-xs;
    color: $color-gray-400;
    padding: $spacing-3 $spacing-4;
    background: $surface-elevated;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;

    strong {
      color: $color-gray-600;
    }
  }

  // ── Factures : ligne cliquable ──────────────────────────────
  &__invoices {
    margin-top: $spacing-6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-4 $spacing-5;
    background: $surface-card;
    border: 1px solid $color-gray-300;
    border-radius: $radius-xl;
    color: $color-gray-900;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    text-decoration: none;
    cursor: pointer;
    transition: border-color $transition-fast, background-color $transition-fast, box-shadow $transition-fast;

    &:hover {
      border-color: $color-accent;
      box-shadow: $shadow-md;
      text-decoration: none;

      .page-billing__invoices-cta {
        background: $color-accent;
        border-color: $color-accent;
        color: $color-white;

        svg {
          transform: translateX(3px);
        }
      }
    }
  }

  &__invoices-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__invoices-sub {
    font-size: $font-size-xs;
    font-weight: $font-weight-normal;
    color: $color-gray-500;
  }

  &__invoices-cta {
    display: inline-flex;
    align-items: center;
    gap: $spacing-1;
    padding: $spacing-2 $spacing-4;
    border: 1px solid $color-gray-300;
    border-radius: $radius-md;
    background: $surface-card;
    color: $color-gray-800;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    transition: background-color $transition-fast, border-color $transition-fast, color $transition-fast;

    svg {
      transition: transform $transition-fast;
    }
  }

  &__invoices-left {
    display: inline-flex;
    align-items: center;
    gap: $spacing-3;
  }

  &__invoices-icon {
    width: 32px;
    height: 32px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba($color-accent, 0.06);
    color: $color-accent;
  }
}
</style>

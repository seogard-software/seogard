<template>
  <div class="page-invoices">
    <DashboardHeader :title="$t('dashboard.invoices.title')">
      <template #back>
        <NuxtLink :to="`/dashboard/organizations/${orgId}/billing`" class="page-invoices__back">
          <AppIcon name="arrow-left" size="sm" />
          {{ $t('dashboard.invoices.back') }}
        </NuxtLink>
      </template>
    </DashboardHeader>

    <div v-if="loading" class="page-invoices__loading">
      {{ $t('dashboard.invoices.loading') }}
    </div>

    <div v-else-if="invoices.length === 0" class="page-invoices__empty">
      {{ $t('dashboard.invoices.empty') }}
    </div>

    <table v-else class="page-invoices__table">
      <thead>
        <tr>
          <th>{{ $t('dashboard.invoices.thDate') }}</th>
          <th>{{ $t('dashboard.invoices.thPages') }}</th>
          <th>{{ $t('dashboard.invoices.thAmount') }}</th>
          <th>{{ $t('dashboard.invoices.thStatus') }}</th>
          <th>{{ $t('dashboard.invoices.thPdf') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="inv in invoices" :key="inv._id">
          <td>{{ formatDate(inv.createdAt) }}</td>
          <td>{{ inv.pagesCount != null ? inv.pagesCount.toLocaleString(numberLocale) : '—' }}</td>
          <td>{{ formatAmount(inv.amount, inv.currency) }}</td>
          <td>
            <AppBadge :variant="inv.status === 'succeeded' ? 'success' : 'danger'">
              {{ inv.status === 'succeeded' ? $t('dashboard.invoices.statusPaid') : $t('dashboard.invoices.statusFailed') }}
            </AppBadge>
          </td>
          <td>
            <a v-if="inv.invoicePdfUrl" :href="inv.invoicePdfUrl" target="_blank" rel="noopener" class="page-invoices__pdf">
              <AppIcon name="download" size="sm" />
            </a>
            <span v-else class="page-invoices__no-pdf">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
useHead({ title: t('dashboard.invoices.tabTitle') })
useSeoMeta({ robots: 'noindex, nofollow' })

const numberLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'fr-FR'))

const route = useRoute()
const orgStore = useOrganizationStore()

const orgId = computed(() => route.params.orgId as string)

interface Invoice {
  _id: string
  amount: number
  currency: string
  status: string
  pagesCount: number | null
  invoicePdfUrl: string | null
  periodStart: string
  periodEnd: string
  createdAt: string
}

const invoices = ref<Invoice[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const headers: Record<string, string> = {}
    if (orgStore.activeOrgId) {
      headers['x-org-id'] = orgStore.activeOrgId
    }
    const data = await $fetch<{ invoices: Invoice[] }>('/api/billing/invoices', { headers })
    invoices.value = data.invoices
  } catch {
    // silently fail
  } finally {
    loading.value = false
  }
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(numberLocale.value, { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString(numberLocale.value, { style: 'currency', currency: currency.toUpperCase() })
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-invoices {
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

  &__loading,
  &__empty {
    text-align: center;
    padding: $spacing-12;
    color: $color-gray-500;
    font-size: $font-size-sm;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;

    th {
      padding: $spacing-3 $spacing-4;
      text-align: left;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      color: $color-gray-500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: $surface-elevated;
      border-bottom: 1px solid $color-gray-200;
    }

    td {
      padding: $spacing-3 $spacing-4;
      font-size: $font-size-sm;
      color: $color-gray-700;
      border-bottom: 1px solid $color-gray-100;
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  &__pdf {
    color: $color-accent;
    transition: color $transition-fast;

    &:hover {
      color: $color-gray-800;
    }
  }

  &__no-pdf {
    color: $color-gray-300;
  }
}
</style>

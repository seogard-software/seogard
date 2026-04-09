<template>
  <div class="page-invoices">
    <DashboardHeader title="Factures">
      <template #back>
        <NuxtLink :to="`/dashboard/organizations/${orgId}/billing`" class="page-invoices__back">
          <AppIcon name="arrow-left" size="sm" />
          Facturation
        </NuxtLink>
      </template>
    </DashboardHeader>

    <div v-if="loading" class="page-invoices__loading">
      Chargement...
    </div>

    <div v-else-if="invoices.length === 0" class="page-invoices__empty">
      Aucune facture pour le moment.
    </div>

    <table v-else class="page-invoices__table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Pages</th>
          <th>Montant</th>
          <th>Statut</th>
          <th>PDF</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="inv in invoices" :key="inv._id">
          <td>{{ formatDate(inv.createdAt) }}</td>
          <td>{{ inv.pagesCount != null ? inv.pagesCount.toLocaleString('fr-FR') : '—' }}</td>
          <td>{{ formatAmount(inv.amount, inv.currency) }}</td>
          <td>
            <AppBadge :variant="inv.status === 'succeeded' ? 'success' : 'danger'">
              {{ inv.status === 'succeeded' ? 'Payé' : 'Échoué' }}
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
definePageMeta({ layout: 'default' })

useHead({ title: 'Factures' })
useSeoMeta({ robots: 'noindex, nofollow' })

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
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatAmount(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: currency.toUpperCase() })
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

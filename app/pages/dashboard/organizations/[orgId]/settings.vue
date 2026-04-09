<template>
  <div class="page-org-settings">
    <DashboardHeader title="Paramètres de l'organisation" />

    <!-- Organisation -->
    <section class="page-org-settings__section">
      <div class="page-org-settings__section-header">
        <AppIcon name="building" size="sm" />
        <h2 class="page-org-settings__section-title">Organisation</h2>
      </div>
      <div class="page-org-settings__section-body">
        <form class="page-org-settings__form" @submit.prevent="handleSave">
          <AppInput v-model="name" label="Nom" :error="errors.name" />
          <div class="page-org-settings__field">
            <label class="page-org-settings__label">Domaines autorisés (auto-provisioning)</label>
            <div class="page-org-settings__tags">
              <span v-for="(domain, i) in domains" :key="i" class="page-org-settings__tag">
                {{ domain }}
                <button type="button" class="page-org-settings__tag-remove" @click="domains.splice(i, 1)">x</button>
              </span>
              <input
                v-model="newDomain"
                class="page-org-settings__tag-input"
                placeholder="laposte.fr"
                @keydown.enter.prevent="addDomain"
              >
            </div>
          </div>
          <AppAlert v-if="errors.general" variant="danger">{{ errors.general }}</AppAlert>
          <AppAlert v-if="saved" variant="success">Sauvegardé</AppAlert>
          <AppButton type="submit" :loading="loading" size="sm">
            Enregistrer
            <template #icon-right><AppIcon name="chevron-right" size="sm" /></template>
          </AppButton>
        </form>
      </div>
    </section>

    <div v-if="isOwner && isCloud" class="page-org-settings__separator" />

    <!-- Billing (owner only, cloud only) -->
    <section v-if="isOwner && isCloud" class="page-org-settings__section">
      <div class="page-org-settings__section-header">
        <AppIcon name="chart-bar" size="sm" />
        <h2 class="page-org-settings__section-title">Facturation</h2>
        <AppBadge :variant="subscriptionBadgeVariant">{{ subscriptionLabel }}</AppBadge>
        <span v-if="needsBillingAction" class="page-org-settings__flag page-org-settings__flag--warning">Action requise</span>
      </div>
      <div class="page-org-settings__section-body">
        <!-- Trial bar -->
        <div v-if="isTrialing && trialDaysLeft > 0" class="page-org-settings__trial-bar">
          <div class="page-org-settings__trial-info">
            <span class="page-org-settings__trial-label">Essai gratuit</span>
            <span class="page-org-settings__trial-days">{{ trialDaysLeft }} jour{{ trialDaysLeft > 1 ? 's' : '' }} restant{{ trialDaysLeft > 1 ? 's' : '' }}</span>
          </div>
          <div class="page-org-settings__trial-progress">
            <div class="page-org-settings__trial-progress-bar" :style="{ width: `${trialProgress}%` }" />
          </div>
        </div>

        <div v-else-if="isTrialing && trialDaysLeft === 0" class="page-org-settings__trial-expired">
          <AppIcon name="alert-triangle" size="sm" />
          <span>Votre essai de 14 jours est terminé. Activez la facturation pour continuer vos crawls.</span>
        </div>

        <p v-else-if="subscriptionStatus === 'active'" class="page-org-settings__billing-active">
          Facturation active — {{ pagesUsed.toLocaleString('fr-FR') }} pages monitorées ce mois-ci.
        </p>

        <NuxtLink :to="`/dashboard/organizations/${orgId}/billing`" :class="['page-org-settings__nav-link', needsBillingAction && 'page-org-settings__nav-link--accent']">
          <span>{{ needsBillingAction ? 'Activer la facturation' : 'Gérer la facturation' }}</span>
          <AppIcon name="chevron-right" size="sm" />
        </NuxtLink>
      </div>
    </section>

    <div v-if="isOwner" class="page-org-settings__separator" />

    <!-- SAML (owner only) -->
    <section v-if="isOwner" class="page-org-settings__section">
      <div class="page-org-settings__section-header">
        <AppIcon name="shield-check" size="sm" />
        <h2 class="page-org-settings__section-title">SSO SAML</h2>
        <AppBadge v-if="samlConfigured" variant="success">Configuré</AppBadge>
        <span v-else class="page-org-settings__flag page-org-settings__flag--neutral">Non configuré</span>
      </div>
      <div class="page-org-settings__section-body">
        <form class="page-org-settings__form" @submit.prevent="handleSamlSave">
          <AppInput v-model="samlEntryPoint" label="Entry Point URL (IdP SSO URL)" />
          <div class="page-org-settings__field">
            <label class="page-org-settings__label">Certificat X.509</label>
            <textarea v-model="samlCertificate" rows="4" class="page-org-settings__textarea" placeholder="Collez le certificat ici..." />
          </div>
          <AppInput v-model="samlIssuer" label="Issuer / Entity ID" />
          <div class="page-org-settings__toggle">
            <label>
              <input v-model="enforceSSO" type="checkbox">
              Forcer le SSO pour tous les membres
            </label>
          </div>
          <div class="page-org-settings__urls">
            <p class="page-org-settings__url-label">URLs à donner à votre admin IT :</p>
            <code>Metadata : {{ appUrl }}/api/auth/saml/{{ orgSlug }}/metadata</code>
            <code>ACS : {{ appUrl }}/api/auth/saml/{{ orgSlug }}/callback</code>
          </div>
          <AppAlert v-if="samlError" variant="danger">{{ samlError }}</AppAlert>
          <AppAlert v-if="samlSaved" variant="success">Configuration SAML sauvegardée</AppAlert>
          <AppButton type="submit" :loading="samlLoading" size="sm">
            Enregistrer
            <template #icon-right><AppIcon name="chevron-right" size="sm" /></template>
          </AppButton>
        </form>
      </div>
    </section>

    <div v-if="isOwner" class="page-org-settings__separator" />

    <!-- Danger zone (owner only) -->
    <section v-if="isOwner" class="page-org-settings__section page-org-settings__section--danger">
      <div class="page-org-settings__section-header">
        <AppIcon name="alert-triangle" size="sm" />
        <h2 class="page-org-settings__section-title page-org-settings__section-title--danger">Zone de danger</h2>
      </div>
      <div class="page-org-settings__section-body">
        <div class="page-org-settings__danger-row">
          <div class="page-org-settings__danger-info">
            <span class="page-org-settings__danger-label">Transférer la propriété</span>
            <span class="page-org-settings__danger-desc">Promouvoir un membre au rôle owner.</span>
          </div>
          <div class="page-org-settings__danger-action">
            <select v-model="promoteTarget" class="page-org-settings__select">
              <option value="">Membre...</option>
              <option v-for="m in promotableMembers" :key="m._id" :value="m._id">
                {{ m.user?.name || m.user?.email || m._id }}
              </option>
            </select>
            <AppButton size="sm" :disabled="!promoteTarget" :loading="promoteLoading" @click="handlePromote">
              Transférer
              <template #icon-right><AppIcon name="chevron-right" size="sm" /></template>
            </AppButton>
          </div>
        </div>

        <div class="page-org-settings__danger-row">
          <div class="page-org-settings__danger-info">
            <span class="page-org-settings__danger-label">Quitter l'organisation</span>
            <span class="page-org-settings__danger-desc">Possible uniquement s'il y a un autre owner.</span>
          </div>
          <AppButton size="sm" variant="danger" :loading="leaveLoading" @click="handleLeave">
            Quitter
            <template #icon-right><AppIcon name="chevron-right" size="sm" /></template>
          </AppButton>
        </div>

        <div class="page-org-settings__danger-row page-org-settings__danger-row--last">
          <div class="page-org-settings__danger-info">
            <span class="page-org-settings__danger-label">Supprimer l'organisation</span>
            <span class="page-org-settings__danger-desc">Irréversible. Tous les sites et données seront supprimés.</span>
          </div>
          <AppButton size="sm" variant="danger" :loading="deleteLoading" @click="confirmDeleteOrg = true">
            Supprimer
            <template #icon-right><AppIcon name="chevron-right" size="sm" /></template>
          </AppButton>
        </div>

        <AppAlert v-if="mgmtError" variant="danger">{{ mgmtError }}</AppAlert>
      </div>
    </section>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div v-if="confirmDeleteOrg" class="page-org-settings__modal-overlay" @click.self="confirmDeleteOrg = false">
        <div class="page-org-settings__modal">
          <h2 class="page-org-settings__modal-title">Supprimer l'organisation</h2>
          <p class="page-org-settings__modal-desc">
            Tapez <strong>{{ orgStore.activeOrg?.name }}</strong> pour confirmer la suppression.
          </p>
          <AppInput v-model="deleteConfirmText" label="" placeholder="Nom de l'organisation" />
          <div class="page-org-settings__modal-actions">
            <AppButton size="sm" variant="ghost" @click="confirmDeleteOrg = false">Annuler</AppButton>
            <AppButton
              size="sm"
              variant="danger"
              :disabled="deleteConfirmText !== orgStore.activeOrg?.name"
              :loading="deleteLoading"
              @click="handleDeleteOrg"
            >
              Supprimer définitivement
            </AppButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { getTrialDaysLeft } from '~~/shared/utils/pricing'

definePageMeta({ layout: 'default' })
useHead({ title: 'Paramètres organisation' })

const route = useRoute()
const config = useRuntimeConfig()
const orgStore = useOrganizationStore()
const toast = useToast()

const authStore = useAuthStore()
const orgId = computed(() => route.params.orgId as string)
const isOwner = computed(() => orgStore.activeOrgRole === 'owner')
const { isCloud } = useDeployment()
const appUrl = computed(() => config.public.appUrl || 'http://localhost:3000')

// ── Billing ──

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

const subscriptionStatus = computed(() => authStore.subscription?.stripeStatus)
const isTrialing = computed(() => subscriptionStatus.value === 'trialing')
const trialDaysLeft = computed(() => getTrialDaysLeft(authStore.trialEndsAt))
const trialProgress = computed(() => Math.max(0, Math.min(100, ((14 - trialDaysLeft.value) / 14) * 100)))
const pagesUsed = computed(() => authStore.subscription?.totalPagesUsed ?? 0)

const needsBillingAction = computed(() => {
  const status = subscriptionStatus.value
  if (status === 'trialing' && trialDaysLeft.value === 0) return true
  if (status === 'canceled' || status === 'past_due' || status === 'unpaid') return true
  return false
})

const subscriptionLabel = computed(() => {
  const sub = authStore.subscription
  if (!sub) return 'Essai gratuit'
  return STATUS_LABELS[sub.stripeStatus] ?? sub.stripeStatus
})

const subscriptionBadgeVariant = computed(() => {
  const status = authStore.subscription?.stripeStatus
  return status ? STATUS_VARIANTS[status] ?? 'neutral' : 'info'
})

// ── SAML ──

const samlConfigured = computed(() => !!samlEntryPoint.value)

// ── Org form ──

const name = ref('')
const domains = ref<string[]>([])
const newDomain = ref('')
const orgSlug = ref('')
const loading = ref(false)
const saved = ref(false)
const errors = ref<Record<string, string>>({})

// SAML
const samlEntryPoint = ref('')
const samlCertificate = ref('')
const samlIssuer = ref('')
const enforceSSO = ref(false)
const samlLoading = ref(false)

// Owner management
const orgMembers = ref<any[]>([])
const promoteTarget = ref('')
const promoteLoading = ref(false)
const leaveLoading = ref(false)
const deleteLoading = ref(false)
const confirmDeleteOrg = ref(false)
const deleteConfirmText = ref('')
const mgmtError = ref('')

const promotableMembers = computed(() =>
  orgMembers.value.filter(m => m.role !== 'owner'),
)

function addDomain() {
  const d = newDomain.value.trim().toLowerCase()
  if (d && !domains.value.includes(d)) {
    domains.value.push(d)
  }
  newDomain.value = ''
}

async function handleSave() {
  errors.value = {}
  saved.value = false
  if (!name.value.trim()) { errors.value.name = 'Requis'; return }

  loading.value = true
  try {
    await $fetch(`/api/organizations/${orgId.value}`, {
      method: 'PUT' as const,
      body: { name: name.value.trim(), allowedDomains: domains.value },
      headers: { 'x-org-id': orgId.value },
    })
    saved.value = true
    await authStore.fetchMe()
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    errors.value.general = fetchError?.data?.message || 'Erreur'
  } finally {
    loading.value = false
  }
}

const samlSaved = ref(false)
const samlError = ref('')

async function handleSamlSave() {
  samlLoading.value = true
  samlSaved.value = false
  samlError.value = ''
  try {
    await $fetch(`/api/organizations/${orgId.value}`, {
      method: 'PUT' as const,
      body: {
        ssoProvider: samlEntryPoint.value ? 'saml' : null,
        samlEntryPoint: samlEntryPoint.value,
        samlCertificate: samlCertificate.value,
        samlIssuer: samlIssuer.value,
        enforceSSO: enforceSSO.value,
      },
      headers: { 'x-org-id': orgId.value },
    })
    samlSaved.value = true
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    samlError.value = fetchError?.data?.message || 'Erreur lors de la sauvegarde SAML'
  } finally {
    samlLoading.value = false
  }
}

async function handlePromote() {
  if (!promoteTarget.value) return
  mgmtError.value = ''
  promoteLoading.value = true
  try {
    await $fetch(`/api/organizations/${orgId.value}/transfer-ownership`, {
      method: 'POST',
      body: { memberId: promoteTarget.value },
      headers: { 'x-org-id': orgId.value },
    })
    toast.success('Membre promu owner')
    promoteTarget.value = ''
    await fetchOrgMembers()
  } catch (error: unknown) {
    mgmtError.value = (error as any)?.data?.message || 'Erreur'
  } finally {
    promoteLoading.value = false
  }
}

async function handleLeave() {
  mgmtError.value = ''
  leaveLoading.value = true
  try {
    await $fetch(`/api/organizations/${orgId.value}/leave`, {
      method: 'POST',
      headers: { 'x-org-id': orgId.value },
    })
    toast.success('Vous avez quitté l\'organisation')
    const sitesStore = useSitesStore()
    const { resetZones } = useZones()
    await authStore.fetchMe()
    sitesStore.setActiveSiteId(null)
    resetZones()
    await sitesStore.fetchSites()
    navigateTo('/dashboard/sites')
  } catch (error: unknown) {
    mgmtError.value = (error as any)?.data?.message || 'Erreur'
  } finally {
    leaveLoading.value = false
  }
}

async function handleDeleteOrg() {
  mgmtError.value = ''
  deleteLoading.value = true
  try {
    await $fetch(`/api/organizations/${orgId.value}`, {
      method: 'DELETE' as const,
      headers: { 'x-org-id': orgId.value },
    })
    confirmDeleteOrg.value = false
    toast.success('Organisation supprimée')
    const sitesStore = useSitesStore()
    const { resetZones } = useZones()
    await authStore.fetchMe()
    sitesStore.setActiveSiteId(null)
    resetZones()
    await sitesStore.fetchSites()
    navigateTo('/dashboard/sites')
  } catch (error: unknown) {
    mgmtError.value = (error as any)?.data?.message || 'Erreur'
  } finally {
    deleteLoading.value = false
  }
}

async function fetchOrgMembers() {
  try {
    const data = await $fetch<{ members: any[] }>(`/api/organizations/${orgId.value}/members`, {
      headers: { 'x-org-id': orgId.value },
    })
    orgMembers.value = data.members
  } catch {
    orgMembers.value = []
  }
}

onMounted(async () => {
  try {
    const org = await $fetch(`/api/organizations/${orgId.value}`, {
      headers: { 'x-org-id': orgId.value },
    }) as any
    name.value = org.name
    orgSlug.value = org.slug
    domains.value = org.allowedDomains || []
    samlEntryPoint.value = org.samlEntryPoint || ''
    samlCertificate.value = org.samlCertificate || ''
    samlIssuer.value = org.samlIssuer || ''
    enforceSSO.value = org.enforceSSO || false
  } catch {
    // Navigation guard will handle 403/404
  }

  if (isOwner.value) {
    await fetchOrgMembers()
  }
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-org-settings {
  max-width: 640px;

  // ── Sections (landing-page style) ──

  &__section {
    background: $color-white;
    border-radius: $radius-2xl;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.04);
    overflow: hidden;

    &--danger {
      box-shadow: 0 0 0 1px rgba($color-danger, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04);
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

    &--danger {
      color: $color-danger;
    }
  }

  &__section-body {
    padding: $spacing-6;
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  // ── Dashed separator (landing-page style) ──

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

  // ── Flags ──

  &__flag {
    margin-left: auto;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    padding: 2px $spacing-2;
    border-radius: $radius-full;

    &--warning {
      background-color: $color-warning-bg;
      color: $color-warning;
    }

    &--neutral {
      background-color: $color-gray-100;
      color: $color-gray-400;
    }
  }

  // ── Trial ──

  &__trial-bar {
    padding: $spacing-3 $spacing-4;
    background: $color-info-bg;
    border: 1px solid rgba($color-info, 0.12);
    border-radius: $radius-lg;
  }

  &__trial-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-2;
  }

  &__trial-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-info;
  }

  &__trial-days {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-info;
  }

  &__trial-progress {
    height: 4px;
    background: rgba($color-info, 0.12);
    border-radius: $radius-full;
    overflow: hidden;
  }

  &__trial-progress-bar {
    height: 100%;
    background: $color-info;
    border-radius: $radius-full;
    transition: width 0.3s ease;
  }

  &__trial-expired {
    padding: $spacing-3 $spacing-4;
    background: $color-warning-bg;
    border: 1px solid rgba($color-warning, 0.2);
    border-radius: $radius-lg;
    font-size: $font-size-sm;
    color: $color-warning;
    font-weight: $font-weight-medium;
    display: flex;
    align-items: flex-start;
    gap: $spacing-2;
  }

  &__billing-active {
    font-size: $font-size-sm;
    color: $color-success;
    font-weight: $font-weight-medium;
  }

  // ── Nav link ──

  &__nav-link {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-3;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-600;
    text-decoration: none;
    background: $surface-elevated;
    border: 1px solid $color-gray-200;
    transition: all $transition-fast;
    width: fit-content;

    &:hover {
      color: $color-gray-900;
      border-color: $color-gray-300;
      background: $color-gray-100;
    }

    &--accent {
      color: $color-accent;
      background: rgba($color-accent, 0.05);
      border-color: rgba($color-accent, 0.2);

      &:hover {
        background: rgba($color-accent, 0.1);
        border-color: rgba($color-accent, 0.3);
        color: $color-accent-dark;
      }
    }
  }

  // ── Danger rows ──

  &__danger-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-4;
    padding-bottom: $spacing-4;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    &--last {
      padding-bottom: 0;
      border-bottom: none;
    }
  }

  &__danger-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__danger-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-800;
  }

  &__danger-desc {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__danger-action {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    flex-shrink: 0;
  }

  // ── Form ──

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-600;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-1;
    padding: $spacing-2;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $surface-card;
  }

  &__tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px $spacing-2;
    background: $color-gray-100;
    border-radius: $radius-sm;
    font-size: $font-size-xs;
    color: $color-gray-700;
  }

  &__tag-remove {
    background: none;
    border: none;
    color: $color-gray-400;
    cursor: pointer;
    font-size: $font-size-xs;
    padding: 0 2px;

    &:hover { color: $color-danger; }
  }

  &__tag-input {
    flex: 1;
    min-width: 100px;
    border: none;
    background: none;
    color: $color-gray-700;
    font-size: $font-size-sm;
    outline: none;
  }

  &__textarea {
    width: 100%;
    padding: $spacing-2;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $surface-card;
    color: $color-gray-700;
    font-size: $font-size-xs;
    font-family: monospace;
    resize: vertical;
  }

  &__toggle {
    font-size: $font-size-sm;
    color: $color-gray-600;

    label {
      display: flex;
      align-items: center;
      gap: $spacing-2;
      cursor: pointer;
    }
  }

  &__urls {
    font-size: $font-size-xs;
    color: $color-gray-500;

    code {
      display: block;
      padding: $spacing-1 $spacing-2;
      background: $color-gray-100;
      border-radius: $radius-sm;
      margin-top: $spacing-1;
      word-break: break-all;
    }
  }

  &__url-label {
    margin-bottom: $spacing-1;
    font-weight: $font-weight-medium;
  }

  &__select {
    width: fit-content;
    max-width: 200px;
    font-size: $font-size-sm;
    padding: $spacing-2 $spacing-3;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $surface-card;
    color: $color-gray-700;
  }

  // ── Modal ──

  &__modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  &__modal {
    background: $surface-card;
    border-radius: $radius-lg;
    padding: $spacing-6;
    width: 440px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__modal-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-danger;
  }

  &__modal-desc {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
  }

  &__modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-3;
  }
}
</style>

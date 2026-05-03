<template>
  <div class="zone-pages">
    <DashboardHeader :title="zoneName" :subtitle="isDefaultZone ? '' : patternsLabel">
      <button v-if="canAdmin && isDefaultZone" class="zone-pages__gear" @click="openSiteSettings">
        <AppIcon name="settings" size="sm" />
      </button>
      <AppButton v-if="canAdmin && !isDefaultZone" variant="secondary" size="sm" @click="openEditModal">
        <template #icon-left>
          <AppIcon name="settings" size="sm" />
        </template>
        Modifier
      </AppButton>
      <span v-if="canCrawl" :title="crawlDisabledReason ?? undefined">
        <AppButton data-testid="crawl-button" variant="accent" :loading="crawlLoading" :disabled="!!activeCrawl || !!crawlDisabledReason" @click="launchCrawl">
          <template #icon-left>
            <AppIcon name="radar" size="sm" />
          </template>
          Lancer un crawl
        </AppButton>
      </span>
    </DashboardHeader>

    <!-- Billing activation banner (default zone only) -->
    <div v-if="billingRequired" class="zone-pages__limit-banner">
      <AppIcon name="alert-triangle" size="sm" />
      <span>Votre essai de 14 jours est terminé. <NuxtLink :to="billingUrl">Activez la facturation</NuxtLink> pour continuer.</span>
    </div>

    <!-- Sitemap discovery banner -->
    <div v-if="isDiscovering" class="zone-pages__discovering">
      <div class="zone-pages__discovering-scan" />
      <div class="zone-pages__discovering-content">
        <div class="zone-pages__discovering-left">
          <span class="zone-pages__discovering-indicator">
            <span class="zone-pages__discovering-ring" />
            <span class="zone-pages__discovering-ring zone-pages__discovering-ring--delay" />
            <span class="zone-pages__discovering-core" />
          </span>
          <div class="zone-pages__discovering-text">
            <span class="zone-pages__discovering-title">Analyse du sitemap</span>
            <span class="zone-pages__discovering-sub">Les pages apparaîtront automatiquement</span>
          </div>
        </div>
        <span v-if="centerNode" class="zone-pages__discovering-count">
          {{ centerNode.totalPageCount.toLocaleString('fr-FR') }} pages
        </span>
      </div>
    </div>

    <!-- WAF blocked banner -->
    <div v-if="!isDiscovering && sitesStore.currentSite?.sitemapBlocked" class="zone-pages__waf-banner">
      <AppIcon name="shield-check" size="sm" />
      <div class="zone-pages__waf-text">
        <span class="zone-pages__waf-title">Sitemap bloqué par un pare-feu (WAF)</span>
        <span class="zone-pages__waf-sub">Notre crawler n'a pas pu accéder au sitemap. Seule la homepage a été analysée.</span>
      </div>
      <NuxtLink to="/bot" class="zone-pages__waf-link">
        Whitelister le crawler
        <AppIcon name="chevron-right" size="sm" />
      </NuxtLink>
    </div>

    <!-- Sitemap invalid hostname banner -->
    <div v-if="!isDiscovering && sitesStore.currentSite?.sitemapInvalidHostname" class="zone-pages__waf-banner">
      <AppIcon name="alert-triangle" size="sm" />
      <div class="zone-pages__waf-text">
        <span class="zone-pages__waf-title">Sitemap pointe vers le mauvais hostname</span>
        <span class="zone-pages__waf-sub">Certaines URLs du sitemap ont un hostname différent du site monitoré et sont ignorées par le crawl.</span>
      </div>
    </div>

    <!-- Muted rules info banner (viewers only) -->
    <div v-if="mutedRulesCount > 0" class="zone-pages__muted-banner">
      <AppIcon name="bell" size="sm" />
      <span>{{ mutedRulesCount }} règle{{ mutedRulesCount > 1 ? 's' : '' }} désactivée{{ mutedRulesCount > 1 ? 's' : '' }} sur ce site.</span>
      <button v-if="canAdmin" class="zone-pages__muted-link" @click="openSiteSettings">Gérer</button>
    </div>

    <CrawlProgress v-if="activeCrawl" :crawl="activeCrawl" :progress="crawlProgress" />

    <!-- Breadcrumb navigation -->
    <div v-if="navigationStack.length > 0" :class="['zone-pages__breadcrumb', treeLoading && 'zone-pages__breadcrumb--loading']">
      <button class="zone-pages__breadcrumb-btn" :disabled="treeLoading" @click="goBack">
        <AppIcon name="arrow-left" size="sm" />
      </button>
      <button class="zone-pages__breadcrumb-item" :disabled="treeLoading" @click="goToRoot">
        {{ zoneName }}
      </button>
      <template v-for="segment in breadcrumbSegments" :key="segment.path">
        <span class="zone-pages__breadcrumb-sep">/</span>
        <button class="zone-pages__breadcrumb-item" :disabled="treeLoading" @click="goToPath(segment.path)">
          {{ segment.label }}
        </button>
      </template>
    </div>

    <!-- Tree directory view -->
    <div class="zone-pages__tree">
      <div v-if="treeLoading && !centerNode" class="zone-pages__tree-loading">
        <AppSpinner label="Chargement..." />
      </div>
      <div v-else-if="treeError" class="zone-pages__tree-error">
        <AppIcon name="alert-triangle" size="sm" />
        <span>{{ treeError }}</span>
        <AppButton variant="secondary" size="sm" @click="fetchTree()">Réessayer</AppButton>
      </div>
      <template v-else-if="centerNode">
        <TreeDirectoryHeader :node="centerNode" :loading="treeLoading && !loadingMore" :never-crawled="neverCrawled" @select="selectNode" />

        <TreeToolbar
          :search-query="searchQuery"
          :sort-key="sortKey"
          :sort-dir="sortDir"
          :children-count="filteredChildren.length"
          :total-count="totalChildren"
          @update:search-query="searchQuery = $event"
          @update:sort-key="sortKey = $event"
          @update:sort-dir="sortDir = $event"
        />

        <div v-if="sortedChildren.length === 0 && !treeLoading && !isDiscovering" class="zone-pages__tree-empty">
          <AppIcon name="folder" size="sm" />
          <span v-if="searchQuery">Aucun résultat pour "{{ searchQuery }}"</span>
          <span v-else>Aucune page dans cette zone. Lancez un crawl pour commencer.</span>
        </div>

        <div v-else class="zone-pages__grid-wrapper">
          <Transition name="fade">
            <div v-if="treeLoading && !loadingMore" class="zone-pages__grid-overlay">
              <AppSpinner />
            </div>
          </Transition>
          <div :class="['zone-pages__grid', treeLoading && !loadingMore && 'zone-pages__grid--loading']">
            <template v-for="child in sortedChildren" :key="child.id">
              <TreeLeafCard
                v-if="child.isLeaf"
                :data="child"
                @select="(id: string) => selectNode(id, true)"
              />
              <TreeSegmentCard
                v-else
                :data="child"
                :never-crawled="neverCrawled"
                @drill="drillInto"
                @select="selectNode"
              />
            </template>
            <button
              v-if="totalChildren > sortedChildren.length"
              class="zone-pages__load-more"
              :disabled="loadingMore"
              @click="loadMore"
            >
              <AppSpinner v-if="loadingMore" size="sm" />
              <template v-else>Charger plus ({{ sortedChildren.length }} / {{ totalChildren }})</template>
            </button>
          </div>
        </div>
      </template>
    </div>

    <TreeSidePanel
      :key="selectedNode?.id"
      :node="selectedNode"
      :site-id="siteId"
      :can-resolve="canCrawl"
      :can-admin="canAdmin"
      @close="clearSelection"
    />

    <AddZoneModal ref="zoneModalRef" v-model="showEditModal" :site-id="siteId" :zone="zone" @success="handleZoneUpdated" @deleted="handleZoneDeleted" />

    <!-- Site settings modal (default zone only) -->
    <AppModal v-model="showSiteSettings" title="Paramètres du site">
      <form class="zone-pages__settings-form" @submit.prevent="handleSaveSite">
        <AppInput
          v-model="siteName"
          label="Nom du site"
          placeholder="Mon site"
        />
        <AppInput
          v-model="siteUrl"
          label="URL du site"
          placeholder="https://example.com"
          disabled
        />
      </form>
      <MutedRulesList :site-id="siteId" />
      <template #footer>
        <AppButton v-if="isOrgOwner" variant="danger" size="sm" @click="showSiteSettings = false; deleteConfirmation = ''; showDeleteModal = true">
          Supprimer le site
        </AppButton>
        <AppButton :loading="savingSite" @click="handleSaveSite">
          Enregistrer
        </AppButton>
      </template>
    </AppModal>

    <!-- Delete site confirmation modal -->
    <AppModal v-model="showDeleteModal" title="Supprimer le site" :close-on-backdrop="!deletingSite">
      <p class="zone-pages__modal-text">
        Cette action est <strong>irréversible</strong>. Toutes les données associées seront supprimées.
      </p>
      <p class="zone-pages__modal-text">
        Tapez <strong>{{ currentSite?.name }}</strong> pour confirmer :
      </p>
      <AppInput
        v-model="deleteConfirmation"
        :placeholder="currentSite?.name"
        :disabled="deletingSite"
      />
      <template #footer>
        <AppButton variant="secondary" :disabled="deletingSite" @click="showDeleteModal = false">
          Annuler
        </AppButton>
        <AppButton
          variant="danger"
          :disabled="deleteConfirmation !== currentSite?.name"
          :loading="deletingSite"
          @click="handleDeleteSite"
        >
          Supprimer définitivement
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { Zone } from '~~/shared/types/zone'

definePageMeta({ layout: 'default' })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const siteId = computed(() => route.params.id as string)
const zoneId = computed(() => route.params.zoneId as string)
const authStore = useAuthStore()
const orgStore = useOrganizationStore()
const toast = useToast()
const sitesStore = useSitesStore()
const currentSite = computed(() => sitesStore.activeSite)
const { deleteSite } = useSites()

// Zone info from shared state
const { zones, updateZone, hasMinZoneRole } = useZones()
const canAdmin = computed(() => hasMinZoneRole(zoneId.value, 'admin'))
const canCrawl = computed(() => hasMinZoneRole(zoneId.value, 'member'))
const isOrgOwner = computed(() => orgStore.activeOrgRole === 'owner')
const zone = computed(() => zones.value.find(z => z._id === zoneId.value) ?? null)
const isDefaultZone = computed(() => zone.value?.isDefault ?? false)
const zoneName = computed(() => isDefaultZone.value ? 'Toutes les pages' : (zone.value?.name ?? 'Zone'))
const patternsLabel = computed(() => zone.value?.patterns.join(', ') ?? '')

useHead({ title: computed(() => zoneName.value) })

const neverCrawled = computed(() => !currentSite.value?.lastCrawlAt)

const { isSelfHosted } = useDeployment()

const billingRequired = computed(() => {
  if (isSelfHosted.value) return false
  const sub = authStore.subscription
  if (sub?.stripeStatus !== 'trialing') return false
  if (!authStore.trialEndsAt) return true
  return new Date(authStore.trialEndsAt).getTime() <= Date.now()
})

const billingUrl = computed(() => {
  const id = orgStore.activeOrgId
  return id ? `/dashboard/organizations/${id}/billing` : '/dashboard/settings'
})

const crawlDisabledReason = computed(() => {
  if (isDiscovering.value) return 'Découverte du sitemap en cours...'
  if (billingRequired.value) return 'Activez la facturation pour continuer'
  return null
})

const {
  loading: treeLoading,
  loadingMore,
  error: treeError,
  selectedNode,
  currentPath,
  navigationStack,
  breadcrumbSegments,
  searchQuery,
  sortKey,
  sortDir,
  centerNode,
  filteredChildren,
  sortedChildren,
  totalChildren,
  fetchTree,
  loadMore,
  drillInto,
  goBack,
  goToPath,
  goToRoot,
  selectNode,
  clearSelection,
} = useTreeFlow({ siteId, zoneId })

const {
  loading: crawlLoading,
  activeCrawl,
  progress: crawlProgress,
  triggerCrawl,
  checkAndPoll,
  stopPolling,
  setOnCrawlCompleted,
} = useCrawl()

// Muted rules count (for viewer banner)
const mutedRulesCount = ref(0)
if (import.meta.client) {
  $fetch<{ rules: unknown[] }>(`/api/sites/${siteId.value}/muted-rules`)
    .then(data => { mutedRulesCount.value = data.rules.length })
    .catch(() => {})
}

const userTriggeredCrawl = ref(false)

async function launchCrawl() {
  try {
    await triggerCrawl(siteId.value, zoneId.value)
    userTriggeredCrawl.value = true
    toast.info('Crawl lancé...')
  }
  catch (err: unknown) {
    const fetchErr = err as { statusCode?: number; data?: { statusCode?: number; message?: string } }
    const status = fetchErr?.statusCode ?? fetchErr?.data?.statusCode
    const message = fetchErr?.data?.message ?? ''

    if (status === 403 && message.includes('Permissions')) {
      toast.error('Vous n\'avez pas la permission de lancer un crawl.')
    } else if (status === 403) {
      toast.error('Abonnement requis pour lancer un crawl.')
    } else {
      toast.error('Erreur lors du lancement du crawl.')
    }
  }
}

setOnCrawlCompleted(async () => {
  await Promise.all([
    fetchTree(),
    authStore.fetchMe(),
  ])
  if (userTriggeredCrawl.value) {
    toast.success('Crawl terminé !')
    userTriggeredCrawl.value = false
  }
})

// Edit modal
const showEditModal = ref(false)
const zoneModalRef = ref<{ populateFromZone: () => void } | null>(null)

function openEditModal() {
  zoneModalRef.value?.populateFromZone()
  showEditModal.value = true
}

async function handleZoneUpdated(updatedZone: Zone) {
  updateZone(updatedZone)
  await fetchTree()
}

async function handleZoneDeleted() {
  const { fetchZones, defaultZoneId } = useZones()
  await fetchZones(siteId.value)
  const targetZone = defaultZoneId.value
  if (targetZone) {
    navigateTo(`/dashboard/sites/${siteId.value}/zones/${targetZone}/pages`)
  } else {
    navigateTo(`/dashboard/sites/${siteId.value}`)
  }
}

// Site settings (default zone only)
const showSiteSettings = ref(false)
const siteName = ref('')
const siteUrl = ref('')

function openSiteSettings() {
  siteName.value = currentSite.value?.name ?? ''
  siteUrl.value = currentSite.value?.url ?? ''
  showSiteSettings.value = true
}
const savingSite = ref(false)
const showDeleteModal = ref(false)
const deleteConfirmation = ref('')
const deletingSite = ref(false)

async function handleSaveSite() {
  savingSite.value = true
  try {
    await $fetch(`/api/sites/${siteId.value}` as string, {
      method: 'PUT',
      body: { name: siteName.value },
    })
    showSiteSettings.value = false
    toast.success('Site mis à jour')
    // Refresh site data in store
    await sitesStore.fetchSites()
  }
  finally {
    savingSite.value = false
  }
}

async function handleDeleteSite() {
  if (deleteConfirmation.value !== currentSite.value?.name) return
  deletingSite.value = true
  try {
    await deleteSite(siteId.value)
    navigateTo('/dashboard/sites')
  }
  finally {
    deletingSite.value = false
  }
}

// Sitemap discovery polling
const isDiscovering = ref(false)
let discoveryInterval: ReturnType<typeof setInterval> | null = null

function startDiscoveryPolling() {
  if (discoveryInterval) return
  discoveryInterval = setInterval(async () => {
    await sitesStore.fetchSite(siteId.value)
    await fetchTree(undefined, { silent: true })
    if (sitesStore.currentSite?.discovering === 'idle') {
      clearInterval(discoveryInterval!)
      discoveryInterval = null
      // Final fetch to get sitemapBlocked and full tree
      await sitesStore.fetchSite(siteId.value)
      await fetchTree(undefined, { silent: true })
      isDiscovering.value = false
    }
  }, 5000)
}

if (import.meta.client) {
  checkAndPoll(siteId.value, zoneId.value)
  fetchTree()

  sitesStore.fetchSite(siteId.value).then(() => {
    const status = sitesStore.currentSite?.discovering
    if (status === 'pending' || status === 'running') {
      isDiscovering.value = true
      startDiscoveryPolling()
    } else {
      isDiscovering.value = false
    }
  })

  onUnmounted(() => {
    stopPolling()
    if (discoveryInterval) {
      clearInterval(discoveryInterval)
      discoveryInterval = null
    }
  })
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.zone-pages {
  &__limit-banner {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-4 $spacing-5;
    background: $color-warning-bg;
    border: 1px solid rgba($color-warning, 0.2);
    border-radius: $radius-lg;
    margin-bottom: $spacing-4;
    font-size: $font-size-sm;
    color: $color-warning;

    span {
      flex: 1;
    }

    a {
      color: $color-accent;
      font-weight: $font-weight-semibold;
    }
  }

  &__muted-banner {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-5;
    margin-bottom: $spacing-4;
    background: $color-gray-50;
    border-radius: $radius-lg;
    border: 1px solid $color-gray-200;
    font-size: $font-size-sm;
    color: $color-gray-500;

    .app-icon { color: $color-gray-400; flex-shrink: 0; }
  }

  &__muted-link {
    margin-left: auto;
    background: none;
    border: none;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-accent;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;

    &:hover { text-decoration: underline; }
  }

  &__waf-banner {
    display: flex;
    align-items: center;
    gap: $spacing-4;
    padding: $spacing-4 $spacing-5;
    margin-bottom: $spacing-4;
    background: $color-white;
    border-radius: $radius-lg;
    box-shadow: 0 0 0 1px rgba($color-warning, 0.15), 0 2px 8px rgba(0, 0, 0, 0.04);
    color: $color-warning;
  }

  &__waf-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  &__waf-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__waf-sub {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__waf-link {
    display: flex;
    align-items: center;
    gap: $spacing-1;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
    text-decoration: none;
    white-space: nowrap;
    padding: $spacing-2 $spacing-3;
    border-radius: $radius-md;
    background: $surface-elevated;
    border: 1px solid $color-gray-200;
    transition: all $transition-fast;

    &:hover {
      background: $color-white;
      border-color: $color-gray-300;
      color: $color-gray-900;
    }
  }

  &__discovering {
    position: relative;
    overflow: hidden;
    border-radius: $radius-lg;
    margin-bottom: $spacing-4;
    background: $color-white;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &__discovering-scan {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      $color-gray-300 40%,
      $color-gray-900 50%,
      $color-gray-300 60%,
      transparent 100%
    );
    animation: discovering-scan 2s ease-in-out infinite;
  }

  &__discovering-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-4 $spacing-5;
  }

  &__discovering-left {
    display: flex;
    align-items: center;
    gap: $spacing-3;
  }

  &__discovering-indicator {
    position: relative;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  &__discovering-ring {
    position: absolute;
    inset: 0;
    border: 1.5px solid $color-gray-300;
    border-radius: 50%;
    animation: discovering-ring 2s ease-out infinite;

    &--delay {
      animation-delay: 1s;
    }
  }

  &__discovering-core {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    margin: -4px 0 0 -4px;
    background: $color-gray-900;
    border-radius: 50%;
  }

  &__discovering-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__discovering-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__discovering-sub {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__discovering-count {
    font-family: $font-family-mono;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    letter-spacing: 0.02em;
  }

  &__gear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: $radius-md;
    border: none;
    background: none;
    color: $color-gray-400;
    cursor: pointer;
    transition: background $transition-fast, color $transition-fast;

    &:hover {
      background: $surface-elevated;
      color: $color-gray-700;
    }
  }

  &__settings-form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__modal-text {
    font-size: $font-size-sm;
    color: $color-gray-600;
    margin-bottom: $spacing-3;

    strong {
      color: $color-gray-800;
    }
  }

  :deep(.crawl-progress) {
    margin-bottom: $spacing-4;
  }

  &__breadcrumb {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-4;
    margin-bottom: $spacing-3;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    font-size: $font-size-sm;
    overflow-x: auto;
    transition: opacity $transition-fast;

    &--loading {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  &__breadcrumb-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $surface-elevated;
    color: $color-gray-600;
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
      color: $color-gray-800;
    }
  }

  &__breadcrumb-item {
    border: none;
    background: none;
    color: $color-gray-600;
    font-family: $font-family-mono;
    font-size: $font-size-sm;
    cursor: pointer;
    padding: $spacing-1 $spacing-2;
    border-radius: $radius-sm;
    white-space: nowrap;

    &:hover {
      background: $surface-elevated;
      color: $color-gray-800;
    }

    &:last-child {
      color: $color-gray-800;
      font-weight: $font-weight-semibold;
    }
  }

  &__breadcrumb-sep {
    color: $color-gray-300;
    flex-shrink: 0;
  }

  &__tree {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__tree-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }

  &__tree-error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-3;
    min-height: 200px;
    color: $color-gray-500;
    font-size: $font-size-sm;
  }

  &__tree-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-2;
    min-height: 200px;
    color: $color-gray-400;
    font-size: $font-size-sm;
  }

  &__grid-wrapper {
    position: relative;
  }

  &__grid-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($color-gray-50, 0.85);
    border-radius: $radius-lg;
    z-index: 5;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: $spacing-4;
    max-height: calc(100vh - 340px);
    overflow-y: auto;
    padding: $spacing-1;

    &--loading {
      opacity: 0.4;
      pointer-events: none;
    }
  }

  &__load-more {
    display: block;
    width: 100%;
    grid-column: 1 / -1;
    padding: $spacing-3;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    color: $color-gray-600;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    cursor: pointer;

    &:hover {
      background: $surface-elevated;
      color: $color-gray-800;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes discovering-scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes discovering-ring {
  0% { transform: scale(0.3); opacity: 1; }
  100% { transform: scale(1.2); opacity: 0; }
}
</style>

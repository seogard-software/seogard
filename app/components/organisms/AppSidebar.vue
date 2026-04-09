<template>
  <aside class="app-sidebar">
    <!-- Org switcher -->
    <div class="app-sidebar__org-switcher">
      <button class="app-sidebar__org-btn" @click="orgDropdownOpen = !orgDropdownOpen">
        <span class="app-sidebar__org-initial">{{ activeOrgInitial }}</span>
        <span class="app-sidebar__org-name">{{ orgStore.activeOrg?.name ?? 'Organisation' }}</span>
        <AppIcon name="chevron-down" size="sm" class="app-sidebar__switcher-chevron" />
      </button>

      <Transition name="dropdown">
        <div v-if="orgDropdownOpen" class="app-sidebar__dropdown app-sidebar__org-dropdown">
          <div class="app-sidebar__dropdown-section">
            <span class="app-sidebar__dropdown-label">Organisations</span>
            <button
              v-for="org in orgStore.organizations"
              :key="org._id"
              class="app-sidebar__dropdown-item"
              :class="{ 'app-sidebar__dropdown-item--active': org._id === orgStore.activeOrgId }"
              @click="switchOrg(org._id)"
            >
              <span class="app-sidebar__org-dot" />
              {{ org.name }}
            </button>
          </div>
          <div class="app-sidebar__dropdown-divider" />
          <div class="app-sidebar__dropdown-section">
            <NuxtLink to="/dashboard/organizations/new" class="app-sidebar__dropdown-item" @click="orgDropdownOpen = false">
              <AppIcon name="plus" size="sm" />
              Créer une organisation
            </NuxtLink>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Site switcher -->
    <div class="app-sidebar__switcher">
      <button class="app-sidebar__switcher-btn" @click="toggleDropdown">
        <img
          v-if="activeSiteFavicon"
          :src="activeSiteFavicon"
          class="app-sidebar__favicon"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        >
        <span class="app-sidebar__switcher-name">{{ currentSiteLabel }}</span>
        <AppIcon name="chevron-down" size="sm" class="app-sidebar__switcher-chevron" />
      </button>

      <Transition name="dropdown">
        <div v-if="dropdownOpen" class="app-sidebar__dropdown">
          <div class="app-sidebar__dropdown-section">
            <span class="app-sidebar__dropdown-label">Sites</span>
            <button
              v-for="site in sites"
              :key="site._id"
              class="app-sidebar__dropdown-item"
              :class="{ 'app-sidebar__dropdown-item--active': site._id === activeSiteId }"
              @click="switchSite(site._id)"
            >
              <img
                v-if="getFaviconUrl(site.url)"
                :src="getFaviconUrl(site.url)!"
                class="app-sidebar__dropdown-favicon"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              >
              {{ site.name }}
            </button>
            <div v-if="sites.length === 0" class="app-sidebar__dropdown-empty">
              Aucun site
            </div>
          </div>
          <div class="app-sidebar__dropdown-divider" />
          <div class="app-sidebar__dropdown-section">
            <button class="app-sidebar__dropdown-item" @click="handleAddSite">
              <AppIcon name="plus" size="sm" />
              Ajouter un site
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Navigation -->
    <nav v-if="activeSiteId" class="app-sidebar__nav">
      <span class="app-sidebar__zone-label">Zones</span>

      <!-- Default zone (Toutes les pages) — same accordion as custom zones -->
      <div v-if="defaultZoneId" class="app-sidebar__zone">
        <button
          class="app-sidebar__zone-btn"
          :class="{ 'app-sidebar__zone-btn--active': expandedZoneId === defaultZoneId }"
          @click="toggleZone(defaultZoneId!)"
        >
          <AppIcon name="folder" size="sm" />
          <span class="app-sidebar__zone-name">Toutes les pages</span>
          <AppIcon
            name="chevron-down"
            size="sm"
            class="app-sidebar__zone-chevron"
            :class="{ 'app-sidebar__zone-chevron--open': expandedZoneId === defaultZoneId }"
          />
        </button>
        <div v-if="expandedZoneId === defaultZoneId" class="app-sidebar__zone-sub">
          <NuxtLink
            :to="`/dashboard/sites/${activeSiteId}/zones/${defaultZoneId}/pages`"
            class="app-sidebar__link app-sidebar__zone-sub-link"
            active-class="app-sidebar__link--active"
          >
            <AppIcon name="radar" size="sm" />
            Overview
          </NuxtLink>
          <NuxtLink
            v-if="hasMinZoneRole(defaultZoneId!, 'admin')"
            :to="`/dashboard/sites/${activeSiteId}/zones/${defaultZoneId}/webhook`"
            class="app-sidebar__link app-sidebar__zone-sub-link"
            active-class="app-sidebar__link--active"
          >
            <AppIcon name="code" size="sm" />
            Webhook
          </NuxtLink>
          <NuxtLink
            v-if="hasMinZoneRole(defaultZoneId!, 'admin')"
            :to="`/dashboard/sites/${activeSiteId}/zones/${defaultZoneId}/members`"
            class="app-sidebar__link app-sidebar__zone-sub-link"
            active-class="app-sidebar__link--active"
          >
            <AppIcon name="users" size="sm" />
            Membres
          </NuxtLink>
        </div>
      </div>

      <!-- Custom zones -->
      <div v-for="zone in customZones" :key="zone._id" class="app-sidebar__zone">
        <button
          class="app-sidebar__zone-btn"
          :class="{ 'app-sidebar__zone-btn--active': expandedZoneId === zone._id }"
          @click="toggleZone(zone._id)"
        >
          <AppIcon name="folder" size="sm" />
          <span class="app-sidebar__zone-name">{{ zone.name }}</span>
          <span v-if="zoneAlertCount(zone._id)" class="app-sidebar__zone-badge">
            {{ zoneAlertCount(zone._id) }}
          </span>
          <AppIcon
            name="chevron-down"
            size="sm"
            class="app-sidebar__zone-chevron"
            :class="{ 'app-sidebar__zone-chevron--open': expandedZoneId === zone._id }"
          />
        </button>
        <div v-if="expandedZoneId === zone._id" class="app-sidebar__zone-sub">
          <NuxtLink
            :to="`/dashboard/sites/${activeSiteId}/zones/${zone._id}/pages`"
            class="app-sidebar__link app-sidebar__zone-sub-link"
            active-class="app-sidebar__link--active"
          >
            <AppIcon name="radar" size="sm" />
            Overview
          </NuxtLink>
          <NuxtLink
            v-if="hasMinZoneRole(zone._id, 'admin')"
            :to="`/dashboard/sites/${activeSiteId}/zones/${zone._id}/webhook`"
            class="app-sidebar__link app-sidebar__zone-sub-link"
            active-class="app-sidebar__link--active"
          >
            <AppIcon name="code" size="sm" />
            Webhook
          </NuxtLink>
          <NuxtLink
            v-if="hasMinZoneRole(zone._id, 'admin')"
            :to="`/dashboard/sites/${activeSiteId}/zones/${zone._id}/members`"
            class="app-sidebar__link app-sidebar__zone-sub-link"
            active-class="app-sidebar__link--active"
          >
            <AppIcon name="users" size="sm" />
            Membres
          </NuxtLink>
        </div>
      </div>

      <button v-if="canCreateZone" class="app-sidebar__zone-add" @click="showZoneModal = true">
        <AppIcon name="plus" size="sm" />
        Nouvelle zone
      </button>
    </nav>
    <div v-else class="app-sidebar__empty">
      <span class="app-sidebar__empty-text">Sélectionnez un site</span>
    </div>

    <!-- Org navigation -->
    <nav v-if="orgStore.activeOrgId && isOwner" class="app-sidebar__org-nav">
      <span class="app-sidebar__org-nav-label">Organisation</span>
      <NuxtLink
        :to="`/dashboard/organizations/${orgStore.activeOrgId}/settings`"
        class="app-sidebar__link"
        active-class="app-sidebar__link--active"
      >
        <AppIcon name="settings" size="sm" />
        Paramètres
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="app-sidebar__footer">
      <div v-if="authStore.currentUser" class="app-sidebar__user">
        <NuxtLink to="/dashboard/settings" class="app-sidebar__user-link">
          <div class="app-sidebar__user-avatar">
            {{ authStore.currentUser.email.charAt(0).toUpperCase() }}
          </div>
          <span class="app-sidebar__email">{{ authStore.currentUser.email }}</span>
          <AppIcon name="settings" size="sm" class="app-sidebar__user-icon" />
        </NuxtLink>
      </div>
      <button class="app-sidebar__link app-sidebar__logout" @click="handleLogout">
        <AppIcon name="logout" size="sm" />
        Déconnexion
      </button>
    </div>

    <AddSiteModal v-model="showAddModal" @success="handleSiteAdded" />
    <AddZoneModal v-if="activeSiteId" v-model="showZoneModal" :site-id="activeSiteId" @success="handleZoneSaved" />
  </aside>
</template>

<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const sitesStore = useSitesStore()
const orgStore = useOrganizationStore()
const { sites, fetchSites } = useSites()

const dropdownOpen = ref(false)
const orgDropdownOpen = ref(false)
const showAddModal = ref(false)
const showZoneModal = ref(false)
const manualExpandedZoneId = ref<string | null>(null)
const expandedZoneId = computed(() => manualExpandedZoneId.value ?? routeZoneId.value)

const isOwner = computed(() => orgStore.activeOrgRole === 'owner')

// ── Zones ──
const { zones, customZones, defaultZoneId, zoneAlertCount, hasMinZoneRole, fetchZones, resetZones } = useZones()

const canCreateZone = computed(() => {
  if (!defaultZoneId.value) return false
  return hasMinZoneRole(defaultZoneId.value, 'admin')
})

function toggleZone(zoneId: string) {
  manualExpandedZoneId.value = expandedZoneId.value === zoneId ? null : zoneId
}

function handleZoneSaved(zone: { _id: string }) {
  if (activeSiteId.value) {
    fetchZones(activeSiteId.value)
    navigateTo(`/dashboard/sites/${activeSiteId.value}/zones/${zone._id}/pages`)
  }
}

const activeOrgInitial = computed(() => {
  const name = orgStore.activeOrg?.name
  return name ? name.charAt(0).toUpperCase() : 'O'
})

function onSiteChanged(siteId: string | null) {
  resetZones()
  manualExpandedZoneId.value = null
  if (siteId) fetchZones(siteId)
}

function switchSite(siteId: string) {
  dropdownOpen.value = false
  sitesStore.setActiveSiteId(siteId)
  onSiteChanged(siteId)
  navigateTo(`/dashboard/sites/${siteId}`)
}

async function switchOrg(orgId: string) {
  orgDropdownOpen.value = false
  orgStore.setActiveOrg(orgId)
  sitesStore.setActiveSiteId(null)
  onSiteChanged(null)
  await fetchSites()
  await navigateTo('/dashboard/sites')
}

const routeSiteId = computed(() => {
  const match = route.path.match(/^\/dashboard\/sites\/([^/]+)/)
  return match ? match[1] : null
})

const routeZoneId = computed(() => {
  const match = route.path.match(/\/zones\/([^/]+)/)
  return match ? match[1] : null
})

const activeSiteId = computed(() =>
  routeSiteId.value ?? sitesStore.activeSiteId,
)

const activeSite = computed(() =>
  sites.value.find(s => s._id === activeSiteId.value) ?? null,
)

const currentSiteLabel = computed(() =>
  activeSite.value?.name ?? 'Tous les sites',
)

function getFaviconUrl(siteUrl: string): string | null {
  try {
    const domain = new URL(siteUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  }
  catch {
    return null
  }
}

const activeSiteFavicon = computed(() =>
  activeSite.value ? getFaviconUrl(activeSite.value.url) : null,
)

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function handleAddSite() {
  dropdownOpen.value = false
  showAddModal.value = true
}

async function handleSiteAdded(site: Site) {
  showAddModal.value = false
  // Fetch zones for the new site to get the default zone ID
  await fetchZones(site._id)
  const zoneId = defaultZoneId.value
  if (zoneId) {
    manualExpandedZoneId.value = zoneId
    navigateTo(`/dashboard/sites/${site._id}/zones/${zoneId}/pages`)
  } else {
    navigateTo(`/dashboard/sites/${site._id}`)
  }
}

async function handleLogout() {
  await authStore.logout()
  navigateTo('/login')
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.app-sidebar__switcher')) {
    dropdownOpen.value = false
  }
  if (!target.closest('.app-sidebar__org-switcher')) {
    orgDropdownOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onClickOutside)
  if (sites.value.length === 0) fetchSites()
  if (routeSiteId.value) {
    sitesStore.setActiveSiteId(routeSiteId.value)
  }
  if (activeSiteId.value && zones.value.length === 0) {
    await fetchZones(activeSiteId.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.app-sidebar {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-height: 100vh;
  background: $color-white;
  color: $color-gray-500;
  border-right: 1px solid $color-gray-200;

  // ── Org switcher ──
  &__org-switcher {
    position: relative;
    border-bottom: 1px solid $color-gray-200;
  }

  &__org-btn {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    width: 100%;
    padding: $spacing-2 $spacing-4;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    text-align: left;
    transition: background-color $transition-fast;

    &:hover {
      background-color: $color-gray-50;
    }
  }

  &__org-initial {
    width: 22px;
    height: 22px;
    border-radius: $radius-sm;
    background: $color-gray-200;
    color: $color-gray-800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: $font-weight-bold;
    flex-shrink: 0;
  }

  &__org-name {
    flex: 1;
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__org-dropdown {
    top: calc(100% + 4px);
  }

  &__org-dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-full;
    background: $color-gray-400;
    flex-shrink: 0;
  }

  // ── Switcher ──
  &__switcher {
    position: relative;
    border-bottom: 1px solid $color-gray-200;
  }

  &__switcher-btn {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    width: 100%;
    padding: $spacing-3 $spacing-4;
    border: none;
    background: none;
    color: inherit;
    cursor: pointer;
    text-align: left;
    transition: background-color $transition-fast;

    &:hover {
      background-color: $color-gray-50;
    }
  }

  &__favicon {
    width: 20px;
    height: 20px;
    border-radius: $radius-sm;
    flex-shrink: 0;
  }

  &__switcher-name {
    flex: 1;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__switcher-chevron {
    color: $color-gray-400;
    flex-shrink: 0;
  }

  // ── Dropdown ──
  &__dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: $spacing-3;
    right: $spacing-3;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    box-shadow: $shadow-xl;
    z-index: 50;
    padding: $spacing-2 0;
    max-height: 320px;
    overflow-y: auto;
  }

  &__dropdown-section {
    padding: 0 $spacing-2;
  }

  &__dropdown-label {
    display: block;
    padding: $spacing-2 $spacing-3;
    font-size: 10px;
    color: $color-gray-500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: $font-weight-semibold;
  }

  &__dropdown-item {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    width: 100%;
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-sm;
    color: $color-gray-600;
    text-decoration: none;
    border: none;
    background: none;
    border-radius: $radius-md;
    cursor: pointer;
    text-align: left;
    transition: all $transition-fast;

    &:hover {
      background-color: $color-gray-100;
      color: $color-gray-900;
      text-decoration: none;
    }

    &--active {
      color: $color-gray-900;
      background-color: $color-gray-100;
    }
  }

  &__dropdown-favicon {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__dropdown-empty {
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__dropdown-divider {
    height: 1px;
    background: $color-gray-200;
    margin: $spacing-2 0;
  }

  // ── Nav ──
  &__nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: $spacing-3 $spacing-3;
    gap: $spacing-1;
  }

  &__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-6;
  }

  &__empty-text {
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-400;
    text-decoration: none;
    border-radius: $radius-md;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-800;
      background-color: $color-gray-100;
      text-decoration: none;
    }

    &--active {
      color: $color-gray-900;
      background-color: $color-gray-100;
    }
  }

  // ── Zones ──
  &__zone-divider {
    height: 1px;
    background: $color-gray-200;
    margin: $spacing-2 0;
  }

  &__zone-label {
    display: block;
    padding: 0 $spacing-3 $spacing-1;
    font-size: 10px;
    color: $color-gray-500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: $font-weight-semibold;
  }

  &__zone-btn {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    width: 100%;
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-500;
    text-decoration: none;
    border: none;
    background: none;
    border-radius: $radius-md;
    cursor: pointer;
    text-align: left;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-800;
      background-color: $color-gray-100;
      text-decoration: none;
    }

    &--active {
      color: $color-gray-900;
      background-color: $color-gray-100;
    }
  }

  &__zone-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__zone-badge {
    font-size: 10px;
    font-weight: $font-weight-semibold;
    color: $color-danger;
    background: rgba($color-danger, 0.1);
    padding: 1px 6px;
    border-radius: $radius-full;
    flex-shrink: 0;
  }

  &__zone-chevron {
    color: $color-gray-400;
    flex-shrink: 0;
    transition: transform $transition-fast;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__zone-sub {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
    padding-left: $spacing-4;
    padding-top: $spacing-1;
  }

  &__zone-sub-link {
    font-size: $font-size-xs;
  }

  &__zone-add {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    width: 100%;
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-xs;
    color: $color-gray-400;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    border-radius: $radius-md;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-700;
      background: $color-gray-100;
    }
  }

  // ── Org nav ──
  &__org-nav {
    display: flex;
    flex-direction: column;
    padding: $spacing-3;
    gap: $spacing-1;
    border-top: 1px solid $color-gray-200;
  }

  &__org-nav-label {
    display: block;
    padding: 0 $spacing-3 $spacing-1;
    font-size: 10px;
    color: $color-gray-500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: $font-weight-semibold;
  }

  // ── Footer ──
  &__footer {
    padding: $spacing-3;
    border-top: 1px solid $color-gray-200;
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__user {
    display: flex;
    flex-direction: column;
  }

  &__user-link {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-3;
    border-radius: $radius-md;
    text-decoration: none;
    transition: background $transition-fast;
    cursor: pointer;

    &:hover {
      background: $surface-elevated;

      .app-sidebar__user-icon {
        color: $color-gray-700;
      }
    }
  }

  &__user-avatar {
    width: 22px;
    height: 22px;
    border-radius: $radius-full;
    background: $color-gray-200;
    color: $color-gray-800;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: $font-weight-bold;
    flex-shrink: 0;
  }

  &__email {
    flex: 1;
    font-size: $font-size-xs;
    color: $color-gray-500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__user-icon {
    color: $color-gray-400;
    flex-shrink: 0;
    transition: color $transition-fast;

    &:hover {
      color: $color-gray-800;
      background: $color-gray-100;
    }
  }

  &__logout {
    color: $color-gray-500;

    &:hover {
      color: $color-danger;
    }
  }
}

// ── Dropdown transition ──
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>

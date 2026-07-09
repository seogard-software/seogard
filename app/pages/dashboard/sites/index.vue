<template>
  <!-- Pendant la résolution (reprise scan éventuelle) : loader -->
  <div v-if="loading" class="page-sites__loading">
    <AppSpinner :label="$t('dashboard.sites.loading')" />
  </div>

  <!-- Aucun site : onboarding création -->
  <div v-else-if="sites.length === 0" class="page-sites__empty">
    <div class="page-sites__empty-icon">
      <AppIcon name="globe" size="lg" />
    </div>
    <h3 class="page-sites__empty-title">{{ $t('dashboard.sites.emptyTitle') }}</h3>
    <p class="page-sites__empty-text">
      <template v-if="isOwner">{{ $t('dashboard.sites.emptyTextOwner') }}</template>
      <template v-else>{{ $t('dashboard.sites.emptyTextMember') }}</template>
    </p>
    <AppButton v-if="isOwner" variant="accent" @click="showAddModal = true">
      <template #icon-left>
        <AppIcon name="plus" size="sm" />
      </template>
      {{ $t('dashboard.sites.addFirstSite') }}
    </AppButton>
  </div>

  <!-- Liste de tous les sites de l'orga -->
  <div v-else class="page-sites">
    <header class="page-sites__header">
      <div>
        <h1 class="page-sites__heading">{{ $t('dashboard.sites.heading') }}</h1>
        <p class="page-sites__subheading">{{ $t('dashboard.sites.countMonitored', sites.length) }}</p>
      </div>
      <AppButton variant="accent" @click="showAddModal = true">
        <template #icon-left>
          <AppIcon name="plus" size="sm" />
        </template>
        {{ $t('dashboard.sites.createSite') }}
      </AppButton>
    </header>

    <div class="page-sites__grid">
      <button
        v-for="site in sites"
        :key="site._id"
        type="button"
        class="site-card"
        @click="goToSite(site._id)"
      >
        <div class="site-card__top">
          <span class="site-card__favicon">
            <img v-if="faviconUrl(site.url)" :src="faviconUrl(site.url)!" alt="" loading="lazy">
            <AppIcon v-else name="globe" size="sm" />
          </span>
          <span
            class="site-card__status"
            :class="{ 'site-card__status--active': site.status === 'active' }"
            :title="site.status === 'active' ? $t('dashboard.sites.statusActive') : $t('dashboard.sites.statusPaused')"
          />
        </div>

        <span class="site-card__name">{{ site.name }}</span>
        <span class="site-card__host">{{ displayHost(site.url) }}</span>

        <span class="site-card__footer">
          {{ site.lastCrawlAt ? $t('dashboard.sites.lastCrawl', { date: formatDate(site.lastCrawlAt) }) : $t('dashboard.sites.neverCrawled') }}
        </span>
      </button>
    </div>
  </div>

  <AddSiteModal v-model="showAddModal" @success="handleSiteAdded" />
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'default' })

const { t, locale } = useI18n()
useHead({ title: t('dashboard.sites.tabTitle') })
useSeoMeta({ robots: 'noindex, nofollow' })

const authStore = useAuthStore()
const orgStore = useOrganizationStore()
const sitesStore = useSitesStore()
const { sites, fetchSites } = useSites()
const { readPending, clearPending, scanPath } = useScanOnboarding()

const router = useRouter()

// Créer un site = owner de l'orga uniquement (cf. §10 + requireOrgRole('owner') côté API).
// Sans ce garde, un membre verrait le bouton puis se prendrait un 403 → action qu'il ne peut pas faire.
const isOwner = computed(() => orgStore.activeOrgRole === 'owner')

const loading = ref(true)
const showAddModal = ref(false)

function faviconUrl(url: string): string | null {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
  }
  catch {
    return null
  }
}

function displayHost(url: string): string {
  try {
    return new URL(url).hostname
  }
  catch {
    return url
  }
}

function formatDate(date: string | Date): string {
  try {
    return new Date(date).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long' })
  }
  catch {
    return ''
  }
}

async function goToSite(id: string) {
  sitesStore.setActiveSiteId(id)
  await router.push(`/dashboard/sites/${id}`)
}

async function resolve() {
  // Increvable : on finit TOUJOURS sur la liste (ou l'état vide), jamais bloqué. La seule
  // redirection est la reprise d'un scan en attente (barre Analyser).
  try {
    // Restaurer l'orga active si le persist localStorage l'a écrasée (null après logout) — sinon
    // fetchSites lève « aucune organisation active ».
    if (!orgStore.activeOrgId) {
      await authStore.fetchMe()
    }

    if (orgStore.activeOrgId) {
      await fetchSites()
    }

    // Scan en attente (retour OAuth/SAML/inscription) → on le rejoue et on quitte la liste.
    const pending = readPending()
    if (pending) {
      clearPending()
      try {
        await router.replace(await scanPath(pending))
        return
      }
      catch { /* /api/scan KO → on retombe sur la liste ci-dessous */ }
    }
  }
  catch { /* on affiche la liste avec ce qu'on a (vide → onboarding création) */ }
  finally {
    loading.value = false
  }
}

function handleSiteAdded(site: Site) {
  showAddModal.value = false
  sitesStore.setActiveSiteId(site._id)
  router.push(`/dashboard/sites/${site._id}`)
}

// Client uniquement : la reprise du scan dépend de localStorage, invisible en SSR.
if (import.meta.client) resolve()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-sites {
  max-width: $container-width;
  margin: 0 auto;
  padding: $spacing-10 $spacing-6;

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
  }

  &__header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: $spacing-4;
    margin-bottom: $spacing-8;
  }

  &__heading {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    letter-spacing: -0.02em;
    color: $color-gray-900;
  }

  &__subheading {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin-top: $spacing-1;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: $spacing-5;
  }

  // ── État vide (aucun site) ──
  &__empty {
    text-align: center;
    padding: $spacing-16 $spacing-8;
  }

  &__empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto $spacing-5;
    border-radius: $radius-full;
    background-color: rgba($color-accent, 0.08);
    color: $color-accent;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__empty-title {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    margin-bottom: $spacing-2;
  }

  &__empty-text {
    font-size: $font-size-sm;
    color: $color-gray-500;
    max-width: 360px;
    margin: 0 auto $spacing-6;
  }
}

.site-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  width: 100%;
  padding: $spacing-5;
  background: $color-white;
  border: 1px solid $color-gray-200;
  border-radius: $radius-xl;
  cursor: pointer;
  transition: border-color $transition-fast, box-shadow $transition-fast, transform $transition-fast;

  &:hover {
    border-color: rgba($color-accent, 0.4);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
    transform: translateY(-2px);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: $spacing-4;
  }

  &__favicon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: $radius-lg;
    background: $color-gray-50;
    border: 1px solid $color-gray-100;
    color: $color-gray-400;
    overflow: hidden;

    img {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
  }

  &__status {
    width: 8px;
    height: 8px;
    border-radius: $radius-full;
    background: $color-gray-300;
    flex-shrink: 0;

    &--active {
      background: $color-success;
      box-shadow: 0 0 0 3px rgba($color-success, 0.15);
    }
  }

  &__name {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__host {
    font-size: $font-size-sm;
    color: $color-gray-500;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__footer {
    margin-top: $spacing-4;
    padding-top: $spacing-3;
    border-top: 1px solid $color-gray-100;
    width: 100%;
    font-size: $font-size-xs;
    color: $color-gray-400;
  }
}
</style>

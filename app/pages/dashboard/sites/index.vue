<template>
  <div v-if="showEmpty" class="page-sites__empty">
    <div class="page-sites__empty-icon">
      <AppIcon name="globe" size="lg" />
    </div>
    <h3 class="page-sites__empty-title">Commencez à surveiller vos sites</h3>
    <p class="page-sites__empty-text">
      Ajoutez votre premier site et Seogard veillera sur son SEO technique 24h/24.
    </p>
    <AppButton variant="accent" @click="showAddModal = true">
      <template #icon-left>
        <AppIcon name="plus" size="sm" />
      </template>
      Ajouter votre premier site
    </AppButton>

    <AddSiteModal v-model="showAddModal" @success="handleSiteAdded" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

useHead({ title: 'Sites' })
useSeoMeta({ robots: 'noindex, nofollow' })

const sitesStore = useSitesStore()
const { sites, fetchSites } = useSites()

const showEmpty = ref(false)
const showAddModal = ref(false)

async function resolve() {
  // 1. Site persisté dans le store → redirect direct
  if (sitesStore.activeSiteId) {
    return navigateTo(`/dashboard/sites/${sitesStore.activeSiteId}`, { replace: true })
  }

  // 2. Charger les sites si pas encore fait
  if (sites.value.length === 0) {
    await fetchSites()
  }

  // 3. Premier site dispo → redirect + persister
  if (sites.value.length > 0) {
    const first = sites.value[0]!
    sitesStore.setActiveSiteId(first._id)
    return navigateTo(`/dashboard/sites/${first._id}`, { replace: true })
  }

  // 4. Aucun site → afficher l'état vide
  showEmpty.value = true
}

function handleSiteAdded(site: Site) {
  showAddModal.value = false
  sitesStore.setActiveSiteId(site._id)
  navigateTo(`/dashboard/sites/${site._id}`)
}

resolve()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-sites {
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
</style>

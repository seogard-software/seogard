<template>
  <div class="page-site-redirect">
    <AppSpinner :label="$t('dashboard.siteRedirect.loading')" />
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const siteId = computed(() => route.params.id as string)

const { defaultZoneId, fetchZones } = useZones()

if (import.meta.client) {
  // router pré-capturé : navigateTo perd le contexte Nuxt après le await fetchZones.
  const redirect = async () => {
    await fetchZones(siteId.value)
    if (defaultZoneId.value) {
      router.replace(`/dashboard/sites/${siteId.value}/zones/${defaultZoneId.value}/pages`)
    }
  }
  redirect()
}
</script>

<style scoped lang="scss">
.page-site-redirect {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
</style>

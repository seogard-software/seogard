<template>
  <div class="page-site-redirect">
    <AppSpinner label="Chargement..." />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const siteId = computed(() => route.params.id as string)

const { defaultZoneId, fetchZones } = useZones()

if (import.meta.client) {
  const redirect = async () => {
    await fetchZones(siteId.value)
    if (defaultZoneId.value) {
      navigateTo(`/dashboard/sites/${siteId.value}/zones/${defaultZoneId.value}/pages`, { replace: true })
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

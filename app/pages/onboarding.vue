<template>
  <div class="page-onboarding">
    <form class="page-onboarding__form" @submit.prevent="handleCreate">
      <h1 class="page-onboarding__title">Créez votre organisation</h1>
      <p class="page-onboarding__desc">Choisissez un nom pour votre espace de travail.</p>

      <AppInput
        v-model="orgName"
        label="Nom de l'organisation"
        placeholder="Mon entreprise"
        :error="error"
      />

      <AppButton type="submit" :loading="loading" size="lg">
        Continuer
      </AppButton>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })
useHead({ title: 'Créer une organisation' })

const authStore = useAuthStore()
const orgStore = useOrganizationStore()

const orgName = ref('')
const loading = ref(false)
const error = ref('')

// If user already has an org, skip onboarding
onMounted(() => {
  if (orgStore.organizations.length > 0) {
    navigateTo('/dashboard/sites')
  }
})

async function handleCreate() {
  error.value = ''

  if (!orgName.value.trim()) {
    error.value = 'Nom requis'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/organizations', {
      method: 'POST',
      body: { name: orgName.value.trim() },
    })
    await authStore.fetchMe()
    const sitesStore = useSitesStore()
    const { resetZones } = useZones()
    sitesStore.setActiveSiteId(null)
    resetZones()
    await sitesStore.fetchSites()
    navigateTo('/dashboard/sites')
  } catch (err: unknown) {
    error.value = (err as any)?.data?.message || 'Erreur lors de la création'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-onboarding {
  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
  }

  &__desc {
    font-size: $font-size-sm;
    color: $color-gray-500;
  }
}
</style>

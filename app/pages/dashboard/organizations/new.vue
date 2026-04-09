<template>
  <div class="page-org-new">
    <h1 class="page-org-new__title">Créer une organisation</h1>
    <p class="page-org-new__subtitle">
      Créez une organisation pour collaborer avec votre équipe.
    </p>

    <form class="page-org-new__form" @submit.prevent="handleCreate">
      <AppInput
        v-model="name"
        label="Nom de l'organisation"
        placeholder="Ex: La Poste"
        :error="errors.name"
      />

      <AppAlert v-if="errors.general" variant="danger">
        {{ errors.general }}
      </AppAlert>

      <AppButton type="submit" :loading="loading" size="lg">
        Créer l'organisation
      </AppButton>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
useHead({ title: 'Nouvelle organisation' })

const orgStore = useOrganizationStore()

const name = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})

async function handleCreate() {
  errors.value = {}

  if (!name.value.trim()) {
    errors.value.name = 'Nom requis'
    return
  }

  loading.value = true
  try {
    const org = await $fetch('/api/organizations', {
      method: 'POST',
      body: { name: name.value.trim() },
    })

    // Refresh orgs, switch to new org, reload sites
    const authStore = useAuthStore()
    await authStore.fetchMe()

    orgStore.setActiveOrg((org as any)._id)
    const sitesStore = useSitesStore()
    sitesStore.setActiveSiteId(null)
    await sitesStore.fetchSites()
    await navigateTo('/dashboard/sites')
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    errors.value.general = fetchError?.data?.message || 'Erreur lors de la création'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-org-new {
  max-width: 480px;
  margin: 0 auto;
  padding: $spacing-8;

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin-bottom: $spacing-2;
  }

  &__subtitle {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin-bottom: $spacing-6;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }
}
</style>

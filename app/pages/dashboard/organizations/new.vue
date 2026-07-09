<template>
  <div class="page-org-new">
    <h1 class="page-org-new__title">{{ $t('dashboard.orgNew.title') }}</h1>
    <p class="page-org-new__subtitle">
      {{ $t('dashboard.orgNew.subtitle') }}
    </p>

    <form class="page-org-new__form" @submit.prevent="handleCreate">
      <AppInput
        v-model="name"
        :label="$t('dashboard.orgNew.nameLabel')"
        :placeholder="$t('dashboard.orgNew.namePlaceholder')"
        :error="errors.name"
      />

      <AppAlert v-if="errors.general" variant="danger">
        {{ errors.general }}
      </AppAlert>

      <AppButton type="submit" :loading="loading" size="lg">
        {{ $t('dashboard.orgNew.submit') }}
      </AppButton>
    </form>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'default' })

const { t } = useI18n()
const apiError = useApiError()
useHead({ title: t('dashboard.orgNew.tabTitle') })

const orgStore = useOrganizationStore()

const name = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})

async function handleCreate() {
  errors.value = {}

  if (!name.value.trim()) {
    errors.value.name = t('dashboard.orgNew.errorNameRequired')
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
    errors.value.general = apiError(fetchError, t('dashboard.orgNew.errorGeneric'))
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

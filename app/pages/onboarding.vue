<template>
  <div class="page-onboarding">
    <form class="page-onboarding__form" @submit.prevent="handleCreate">
      <h1 class="page-onboarding__title">{{ $t('auth.onboarding.title') }}</h1>
      <p class="page-onboarding__desc">{{ $t('auth.onboarding.desc') }}</p>

      <AppInput
        v-model="orgName"
        :label="$t('auth.onboarding.nameLabel')"
        :placeholder="$t('auth.onboarding.namePlaceholder')"
        :error="error"
      />

      <AppButton type="submit" :loading="loading" size="lg">
        {{ $t('auth.common.continue') }}
      </AppButton>
    </form>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const apiError = useApiError()

useHead({ title: t('seo.onboarding.title') })

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
    error.value = t('validation.nameRequired')
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
    error.value = apiError(err, t('auth.onboarding.errorGeneric'))
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

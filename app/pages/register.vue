<template>
  <div class="page-register">
    <AuthRegisterForm @success="navigateTo('/dashboard/sites')" />

    <p class="page-register__link">
      {{ $t('auth.common.alreadyAccount') }}
      <NuxtLink to="/login">{{ $t('auth.common.signIn') }}</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'auth', auth: false, redirectIfAuth: true })

// Self-hosted: block registration if a user already exists
const { isSelfHosted } = useDeployment()
if (isSelfHosted.value && import.meta.client) {
  $fetch<{ needsSetup: boolean }>('/api/setup/status')
    .then(data => { if (!data.needsSetup) navigateTo('/login', { replace: true }) })
    .catch(() => {})
}

const { t } = useI18n()

useHead({ title: t('seo.register.title') })
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-register {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  &__link {
    text-align: center;
    font-size: $font-size-sm;
    color: $color-gray-500;
  }
}
</style>

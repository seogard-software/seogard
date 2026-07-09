<template>
  <div class="page-reset">
    <!-- Success state -->
    <template v-if="success">
      <h1 class="page-reset__title">{{ $t('auth.reset.successTitle') }}</h1>
      <p class="page-reset__text">{{ $t('auth.reset.successText') }}</p>
      <NuxtLink to="/login" class="page-reset__link">
        <AppButton size="lg">{{ $t('auth.common.signIn') }}</AppButton>
      </NuxtLink>
    </template>

    <!-- Invalid/expired token -->
    <template v-else-if="invalidToken">
      <h1 class="page-reset__title">{{ $t('auth.reset.expiredTitle') }}</h1>
      <p class="page-reset__text">{{ $t('auth.reset.expiredText') }}</p>
      <NuxtLink to="/login" class="page-reset__link">
        <AppButton variant="secondary" size="lg">{{ $t('auth.common.backToLogin') }}</AppButton>
      </NuxtLink>
    </template>

    <!-- Form -->
    <template v-else>
      <h1 class="page-reset__title">{{ $t('auth.reset.title') }}</h1>
      <p class="page-reset__text">{{ $t('auth.reset.text') }}</p>

      <form class="page-reset__form" @submit.prevent="handleReset">
        <AppInput
          v-model="password"
          :label="$t('auth.reset.passwordLabel')"
          type="password"
          :placeholder="$t('auth.reset.passwordPlaceholder')"
          :error="errors.password"
        />
        <AppInput
          v-model="confirmPassword"
          :label="$t('auth.reset.confirmLabel')"
          type="password"
          :placeholder="$t('auth.reset.confirmPlaceholder')"
          :error="errors.confirm"
        />

        <AppAlert v-if="errors.general" variant="danger">
          {{ errors.general }}
        </AppAlert>

        <AppButton type="submit" :loading="loading" size="lg">
          {{ $t('auth.reset.submit') }}
        </AppButton>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'auth', auth: false })

const { t } = useI18n()
const apiError = useApiError()

useHead({ title: t('seo.reset.title') })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const token = computed(() => route.query.token as string || '')

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const invalidToken = ref(!token.value)
const errors = ref<Record<string, string>>({})

async function handleReset() {
  errors.value = {}

  if (!password.value || password.value.length < 8) {
    errors.value.password = t('validation.passwordTooShort')
    return
  }
  if (password.value !== confirmPassword.value) {
    errors.value.confirm = t('validation.passwordMismatch')
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, password: password.value },
    })
    success.value = true
  }
  catch (err: any) {
    const code = getApiErrorCode(err)
    if (code === 'RESET_TOKEN_EXPIRED' || code === 'RESET_TOKEN_INVALID' || code === 'TOKEN_REQUIRED') {
      invalidToken.value = true
    }
    else {
      errors.value.general = apiError(err, t('auth.reset.errorGeneric'))
    }
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-reset {
  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 $spacing-2;
    letter-spacing: -0.03em;
  }

  &__text {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin: 0 0 $spacing-6;
    line-height: $line-height-normal;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__link {
    text-decoration: none;
  }
}
</style>

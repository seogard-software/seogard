<template>
  <div class="page-login">
    <!-- Step 1: Email -->
    <form v-if="step === 'email'" class="page-login__form" @submit.prevent="handleCheckEmail">
      <template v-if="oauthProviders.length > 0">
        <div class="page-login__oauth">
          <a v-for="p in oauthProviders" :key="p" :href="`/api/auth/oauth/${p}/authorize`" class="page-login__oauth-btn">
            <OAuthIcon :provider="p" />
            {{ $t('auth.common.continueWith', { provider: oauthLabels[p] }) }}
          </a>
        </div>

        <div class="page-login__divider">
          <span>{{ $t('auth.common.orWithEmail') }}</span>
        </div>
      </template>

      <AppInput
        v-model="email"
        :label="$t('auth.common.emailLabel')"
        type="email"
        :placeholder="$t('auth.common.emailPlaceholder')"
        :error="errors.email"
      />

      <AppAlert v-if="errors.general" variant="danger">
        {{ errors.general }}
      </AppAlert>

      <AppButton type="submit" :loading="loading" size="lg">
        {{ $t('auth.common.continue') }}
      </AppButton>

      <p class="page-login__link">
        {{ $t('auth.login.noAccount') }}
        <NuxtLink to="/register">{{ $t('auth.common.createAccount') }}</NuxtLink>
      </p>
    </form>

    <!-- Step 2a: SAML detected -->
    <div v-else-if="step === 'saml' && activeSamlOrg" class="page-login__form">
      <div class="page-login__email-reminder">
        <span>{{ email }}</span>
        <button type="button" class="page-login__change-email" @click="goBackToEmail">
          {{ $t('auth.login.changeEmail') }}
        </button>
      </div>

      <i18n-t keypath="auth.login.ssoInfo" tag="p" class="page-login__sso-info" scope="global">
        <template #org><strong>{{ activeSamlOrg.name }}</strong></template>
      </i18n-t>

      <a
        :href="`/api/auth/saml/${activeSamlOrg.slug}/login`"
        class="page-login__sso-btn"
      >
        {{ $t('auth.login.ssoButton') }}
      </a>

      <button
        v-if="!activeSamlOrg.enforceSSO"
        type="button"
        class="page-login__back"
        @click="step = 'password'"
      >
        {{ $t('auth.login.usePassword') }}
      </button>
    </div>

    <!-- Step 2b: Password -->
    <form v-else-if="step === 'password'" class="page-login__form" @submit.prevent="handleLogin">
      <div class="page-login__email-reminder">
        <span>{{ email }}</span>
        <button type="button" class="page-login__change-email" @click="goBackToEmail">
          {{ $t('auth.login.changeEmail') }}
        </button>
      </div>

      <AppInput
        v-model="password"
        :label="$t('auth.common.passwordLabel')"
        type="password"
        :placeholder="$t('auth.login.passwordPlaceholder')"
        :error="errors.password"
      />

      <AppAlert v-if="errors.general" variant="danger">
        {{ errors.general }}
      </AppAlert>

      <AppButton type="submit" :loading="loading" size="lg">
        {{ $t('auth.common.signIn') }}
      </AppButton>

      <NuxtLink to="/forgot-password" class="page-login__forgot">
        {{ $t('auth.login.forgotPassword') }}
      </NuxtLink>
    </form>

    <!-- Step 3: 2FA -->
    <form v-else-if="step === 'totp'" class="page-login__form" @submit.prevent="handleTotpVerify">
      <p class="page-login__totp-info">
        {{ $t('auth.login.totpInfo') }}
      </p>

      <AppInput
        v-model="totpCode"
        :label="$t('auth.login.totpLabel')"
        :placeholder="$t('auth.login.totpPlaceholder')"
        :error="errors.totp"
      />

      <AppAlert v-if="errors.general" variant="danger">
        {{ errors.general }}
      </AppAlert>

      <AppButton type="submit" :loading="loading" size="lg">
        {{ $t('auth.login.totpSubmit') }}
      </AppButton>

      <button type="button" class="page-login__back" @click="step = 'password'">
        {{ $t('auth.login.back') }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'auth', auth: false, redirectIfAuth: true })

const { t } = useI18n()
const apiError = useApiError()

useHead({ title: t('seo.login.title') })
useSeoMeta({ robots: 'noindex, nofollow' })

const authStore = useAuthStore()

const oauthProviders = ref<string[]>([])
const oauthLabels: Record<string, string> = { google: 'Google', microsoft: 'Microsoft', github: 'GitHub' }

if (import.meta.client) {
  $fetch<{ providers: string[] }>('/api/auth/providers')
    .then(data => { oauthProviders.value = data.providers })
    .catch(() => {})
}

type Step = 'email' | 'saml' | 'password' | 'totp'

const email = ref('')
const password = ref('')
const totpCode = ref('')
const loading = ref(false)
const step = ref<Step>('email')
const errors = ref<Record<string, string>>({})
const samlOrgs = ref<Array<{ name: string; slug: string; enforceSSO: boolean }>>([])
const activeSamlOrg = computed(() => samlOrgs.value[0])

function goBackToEmail() {
  step.value = 'email'
  password.value = ''
  totpCode.value = ''
  errors.value = {}
  samlOrgs.value = []
}

async function handleCheckEmail() {
  errors.value = {}

  if (!email.value) {
    errors.value.email = t('validation.emailRequired')
    return
  }

  loading.value = true
  try {
    const result = await $fetch('/api/auth/check-email', {
      method: 'POST',
      body: { email: email.value },
    })

    if (result.samlOrgs.length > 0) {
      samlOrgs.value = result.samlOrgs
      step.value = 'saml'
    }
    else {
      step.value = 'password'
    }
  }
  catch {
    errors.value.general = t('auth.login.errorCheckEmail')
  }
  finally {
    loading.value = false
  }
}

async function handleLogin() {
  errors.value = {}

  if (!password.value) {
    errors.value.password = t('validation.passwordRequired')
    return
  }

  loading.value = true
  try {
    const response = await authStore.login(email.value, password.value)

    if (response.requiresTwoFactor) {
      step.value = 'totp'
      return
    }

    await authStore.fetchMe()
    navigateTo('/dashboard/sites')
  }
  catch (err: any) {
    if (err?.statusCode === 403 && err?.data?.data?.samlUrl) {
      navigateTo(err.data.data.samlUrl, { external: true })
      return
    }
    errors.value.general = apiError(err, t('auth.login.errorInvalidCredentials'))
  }
  finally {
    loading.value = false
  }
}

async function handleTotpVerify() {
  errors.value = {}

  if (!totpCode.value) {
    errors.value.totp = t('validation.codeRequired')
    return
  }

  loading.value = true
  try {
    await authStore.verifyTotp(totpCode.value)
    await authStore.fetchMe()
    navigateTo('/dashboard/sites')
  }
  catch {
    errors.value.general = t('auth.login.errorInvalidCode')
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-login {
  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__forgot {
    font-size: $font-size-sm;
    color: $color-gray-500;
    text-align: center;
    text-decoration: none;

    &:hover {
      color: $color-gray-700;
      text-decoration: underline;
    }
  }

  &__email-reminder {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-3;
    background: $color-gray-100;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    color: $color-gray-700;
  }

  &__change-email {
    background: none;
    border: none;
    color: $color-gray-500;
    font-size: $font-size-sm;
    cursor: pointer;
    text-decoration: underline;

    &:hover {
      color: $color-gray-700;
    }
  }

  &__sso-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-3 $spacing-6;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    background: $color-accent;
    color: $color-white;
    border-radius: $radius-lg;
    text-decoration: none;
    transition: all $transition-fast;

    &:hover {
      background: $color-accent-light;
      box-shadow: $shadow-md;
    }
  }

  &__sso-info {
    font-size: $font-size-sm;
    color: $color-gray-500;
    line-height: $line-height-normal;

    strong {
      color: $color-gray-800;
    }
  }

  &__link {
    text-align: center;
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  &__totp-info {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
  }

  &__back {
    background: none;
    border: none;
    color: $color-gray-500;
    font-size: $font-size-sm;
    cursor: pointer;
    text-align: center;
    padding: $spacing-2;

    &:hover {
      color: $color-gray-800;
    }
  }

  &__divider {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    color: $color-gray-500;
    font-size: $font-size-sm;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: $color-gray-200;
    }
  }

  &__oauth {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__oauth-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-2;
    padding: $spacing-3 $spacing-3;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $color-white;
    color: $color-gray-700;
    font-size: $font-size-sm;
    text-decoration: none;
    transition: background-color 0.15s, border-color 0.15s;

    &:hover {
      background: $color-gray-50;
      border-color: $color-gray-300;
    }
  }
}
</style>

<template>
  <div class="page-login">
    <!-- Step 1: Email -->
    <form v-if="step === 'email'" class="page-login__form" @submit.prevent="handleCheckEmail">
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="votre@email.com"
        :error="errors.email"
      />

      <AppAlert v-if="errors.general" variant="danger">
        {{ errors.general }}
      </AppAlert>

      <AppButton type="submit" :loading="loading" size="lg">
        Continuer
      </AppButton>

      <template v-if="oauthProviders.length > 0">
        <div class="page-login__divider">
          <span>ou continuer avec</span>
        </div>

        <div class="page-login__oauth">
          <a v-for="p in oauthProviders" :key="p" :href="`/api/auth/oauth/${p}/authorize`" class="page-login__oauth-btn">
            {{ oauthLabels[p] }}
          </a>
        </div>
      </template>

      <p class="page-login__link">
        Pas de compte ?
        <NuxtLink to="/register">Créer un compte</NuxtLink>
      </p>
    </form>

    <!-- Step 2a: SAML detected -->
    <div v-else-if="step === 'saml' && activeSamlOrg" class="page-login__form">
      <div class="page-login__email-reminder">
        <span>{{ email }}</span>
        <button type="button" class="page-login__change-email" @click="goBackToEmail">
          Modifier
        </button>
      </div>

      <p class="page-login__sso-info">
        Votre organisation <strong>{{ activeSamlOrg.name }}</strong> utilise le SSO.
      </p>

      <a
        :href="`/api/auth/saml/${activeSamlOrg.slug}/login`"
        class="page-login__sso-btn"
      >
        Se connecter via SSO
      </a>

      <button
        v-if="!activeSamlOrg.enforceSSO"
        type="button"
        class="page-login__back"
        @click="step = 'password'"
      >
        ou utiliser un mot de passe
      </button>
    </div>

    <!-- Step 2b: Password -->
    <form v-else-if="step === 'password'" class="page-login__form" @submit.prevent="handleLogin">
      <div class="page-login__email-reminder">
        <span>{{ email }}</span>
        <button type="button" class="page-login__change-email" @click="goBackToEmail">
          Modifier
        </button>
      </div>

      <AppInput
        v-model="password"
        label="Mot de passe"
        type="password"
        placeholder="Votre mot de passe"
        :error="errors.password"
      />

      <AppAlert v-if="errors.general" variant="danger">
        {{ errors.general }}
      </AppAlert>

      <AppButton type="submit" :loading="loading" size="lg">
        Se connecter
      </AppButton>

      <NuxtLink to="/forgot-password" class="page-login__forgot">
        Mot de passe oublié ?
      </NuxtLink>
    </form>

    <!-- Step 3: 2FA -->
    <form v-else-if="step === 'totp'" class="page-login__form" @submit.prevent="handleTotpVerify">
      <p class="page-login__totp-info">
        Entrez le code à 6 chiffres de votre application d'authentification, ou un code de secours.
      </p>

      <AppInput
        v-model="totpCode"
        label="Code 2FA"
        placeholder="123456"
        :error="errors.totp"
      />

      <AppAlert v-if="errors.general" variant="danger">
        {{ errors.general }}
      </AppAlert>

      <AppButton type="submit" :loading="loading" size="lg">
        Vérifier
      </AppButton>

      <button type="button" class="page-login__back" @click="step = 'password'">
        Retour
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false, redirectIfAuth: true })

useHead({ title: 'Connexion' })
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
    errors.value.email = 'Email requis'
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
    errors.value.general = 'Impossible de vérifier l\'email'
  }
  finally {
    loading.value = false
  }
}

async function handleLogin() {
  errors.value = {}

  if (!password.value) {
    errors.value.password = 'Mot de passe requis'
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
    const message = err?.data?.message || err?.statusMessage
    if (err?.statusCode === 403 && err?.data?.data?.samlUrl) {
      navigateTo(err.data.data.samlUrl, { external: true })
      return
    }
    errors.value.general = message || 'Email ou mot de passe incorrect'
  }
  finally {
    loading.value = false
  }
}

async function handleTotpVerify() {
  errors.value = {}

  if (!totpCode.value) {
    errors.value.totp = 'Code requis'
    return
  }

  loading.value = true
  try {
    await authStore.verifyTotp(totpCode.value)
    await authStore.fetchMe()
    navigateTo('/dashboard/sites')
  }
  catch {
    errors.value.general = 'Code invalide'
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
    gap: $spacing-2;
  }

  &__oauth-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $spacing-2 $spacing-3;
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

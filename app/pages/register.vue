<template>
  <div class="page-register">
    <form class="page-register__form" @submit.prevent="handleRegister">
      <AppInput
        v-model="orgName"
        label="Nom de l'organisation"
        placeholder="Mon entreprise"
        :error="errors.orgName"
      />
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="votre@email.com"
        :error="errors.email"
      />
      <AppInput
        v-model="password"
        label="Mot de passe"
        type="password"
        placeholder="Minimum 8 caractères"
        :error="errors.password"
      />

      <label class="page-register__terms">
        <input v-model="acceptedTerms" type="checkbox" class="page-register__checkbox">
        <span>
          Je déclare agir à titre professionnel et j'accepte les
          <NuxtLink to="/legal/cgu" target="_blank">CGU</NuxtLink> et les
          <NuxtLink to="/legal/cgv" target="_blank">CGV</NuxtLink>.
          Consultez notre
          <NuxtLink to="/legal/privacy" target="_blank">politique de confidentialité</NuxtLink>.
        </span>
      </label>
      <p v-if="errors.terms" class="page-register__terms-error">{{ errors.terms }}</p>

      <AppAlert v-if="errors.general" variant="danger">
        {{ errors.general }}
      </AppAlert>

      <AppButton type="submit" :loading="loading" :disabled="!acceptedTerms" size="lg">
        Créer un compte
      </AppButton>

      <template v-if="oauthProviders.length > 0">
        <div class="page-register__divider">
          <span>ou continuer avec</span>
        </div>

        <div class="page-register__oauth">
          <a
            v-for="p in oauthProviders"
            :key="p"
            :href="acceptedTerms ? `/api/auth/oauth/${p}/authorize` : undefined"
            :class="['page-register__oauth-btn', { 'page-register__oauth-btn--disabled': !acceptedTerms }]"
            :aria-disabled="!acceptedTerms"
            @click="handleOAuthClick($event, p)"
          >
            {{ oauthLabels[p] }}
          </a>
        </div>
        <p v-if="oauthBlocked" class="page-register__terms-error">Veuillez accepter les CGU et CGV avant de continuer avec un provider OAuth.</p>
      </template>

      <p class="page-register__link">
        Déjà un compte ?
        <NuxtLink to="/login">Se connecter</NuxtLink>
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false, redirectIfAuth: true })

// Self-hosted: block registration if a user already exists
const { isSelfHosted } = useDeployment()
if (isSelfHosted.value && import.meta.client) {
  $fetch<{ needsSetup: boolean }>('/api/setup/status')
    .then(data => { if (!data.needsSetup) navigateTo('/login', { replace: true }) })
    .catch(() => {})
}

useHead({ title: 'Inscription' })
useSeoMeta({ robots: 'noindex, nofollow' })

const authStore = useAuthStore()

const oauthProviders = ref<string[]>([])
const oauthLabels: Record<string, string> = { google: 'Google', microsoft: 'Microsoft', github: 'GitHub' }

if (import.meta.client) {
  $fetch<{ providers: string[] }>('/api/auth/providers')
    .then(data => { oauthProviders.value = data.providers })
    .catch(() => {})
}

const orgName = ref('')
const email = ref('')
const password = ref('')
const acceptedTerms = ref(false)
const oauthBlocked = ref(false)
const loading = ref(false)
const errors = ref<Record<string, string>>({})

function handleOAuthClick(e: Event, _provider: string) {
  if (!acceptedTerms.value) {
    e.preventDefault()
    oauthBlocked.value = true
  }
}

async function handleRegister() {
  errors.value = {}

  if (!orgName.value.trim()) {
    errors.value.orgName = 'Nom requis'
    return
  }
  if (!email.value) {
    errors.value.email = 'Email requis'
    return
  }
  if (password.value.length < 8) {
    errors.value.password = 'Minimum 8 caractères'
    return
  }
  if (!acceptedTerms.value) {
    errors.value.terms = 'Vous devez accepter les CGU et CGV'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { email: email.value, password: password.value, orgName: orgName.value.trim(), acceptedTerms: true },
    })
    await authStore.fetchMe()
    navigateTo('/dashboard/sites')
  }
  catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    errors.value.general = fetchError?.data?.message || 'Erreur lors de la création du compte'
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-register {
  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__link {
    text-align: center;
    font-size: $font-size-sm;
    color: $color-gray-500;
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

  &__terms {
    display: flex;
    align-items: flex-start;
    gap: $spacing-2;
    font-size: $font-size-sm;
    color: $color-gray-600;
    cursor: pointer;

    a {
      color: $color-accent;
      text-decoration: underline;
    }
  }

  &__checkbox {
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: $color-accent;
  }

  &__terms-error {
    font-size: $font-size-xs;
    color: $color-danger;
    margin-top: -$spacing-2;
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

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: auto;

      &:hover {
        background: $color-white;
        border-color: $color-gray-200;
      }
    }
  }
}
</style>

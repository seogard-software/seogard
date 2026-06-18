<template>
  <form class="auth-register-form" @submit.prevent="handleRegister">
    <template v-if="oauthProviders.length > 0">
      <div class="auth-register-form__oauth">
        <a
          v-for="p in oauthProviders"
          :key="p"
          :href="`/api/auth/oauth/${p}/authorize`"
          class="auth-register-form__oauth-btn"
        >
          <OAuthIcon :provider="p" />
          Continuer avec {{ oauthLabels[p] }}
        </a>
      </div>
      <p class="auth-register-form__oauth-terms">
        En continuant avec un fournisseur, vous acceptez les
        <NuxtLink to="/legal/cgu" target="_blank">CGU</NuxtLink> et les
        <NuxtLink to="/legal/cgv" target="_blank">CGV</NuxtLink>.
      </p>

      <div class="auth-register-form__divider">
        <span>ou avec votre email</span>
      </div>
    </template>

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

    <label class="auth-register-form__terms">
      <input v-model="acceptedTerms" type="checkbox" class="auth-register-form__checkbox">
      <span>
        Je déclare agir à titre professionnel et j'accepte les
        <NuxtLink to="/legal/cgu" target="_blank">CGU</NuxtLink> et les
        <NuxtLink to="/legal/cgv" target="_blank">CGV</NuxtLink>.
        Consultez notre
        <NuxtLink to="/legal/privacy" target="_blank">politique de confidentialité</NuxtLink>.
      </span>
    </label>
    <p v-if="errors.terms" class="auth-register-form__terms-error">{{ errors.terms }}</p>

    <AppAlert v-if="errors.general" variant="danger">
      {{ errors.general }}
    </AppAlert>

    <AppButton type="submit" :loading="loading" :disabled="!acceptedTerms" size="lg">
      Créer un compte
    </AppButton>
  </form>
</template>

<script setup lang="ts">
// Formulaire d'inscription réutilisable : page /register ET modale de la barre Analyser.
// Émet `success` après inscription + fetchMe ; le parent décide de la suite (dashboard ou
// reprise du scan). Ne gère PAS la connexion (state machine SAML/TOTP → page /login dédiée).
const emit = defineEmits<{ success: [] }>()

const authStore = useAuthStore()

const oauthProviders = ref<string[]>([])
const oauthLabels: Record<string, string> = { google: 'Google', microsoft: 'Microsoft', github: 'GitHub' }

if (import.meta.client) {
  $fetch<{ providers: string[] }>('/api/auth/providers')
    .then(data => { oauthProviders.value = data.providers })
    .catch(() => {})
}

const email = ref('')
const password = ref('')
const acceptedTerms = ref(false)
const loading = ref(false)
const errors = ref<Record<string, string>>({})

async function handleRegister() {
  errors.value = {}

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
      body: { email: email.value, password: password.value, acceptedTerms: true },
    })
    await authStore.fetchMe()
    emit('success')
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

.auth-register-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

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

  &__oauth-terms {
    font-size: $font-size-xs;
    color: $color-gray-500;
    text-align: center;
    margin-top: -$spacing-2;

    a {
      color: $color-accent;
      text-decoration: underline;
    }
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
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-2;
    padding: $spacing-3 $spacing-3;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $color-white;
    color: $color-gray-800;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    text-decoration: none;
    transition: background-color 0.15s, border-color 0.15s;

    &:hover {
      background: $color-gray-50;
      border-color: $color-gray-300;
    }
  }
}
</style>

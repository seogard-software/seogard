<template>
  <div class="page-reset">
    <!-- Success state -->
    <template v-if="success">
      <h1 class="page-reset__title">Mot de passe modifié</h1>
      <p class="page-reset__text">Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.</p>
      <NuxtLink to="/login" class="page-reset__link">
        <AppButton size="lg">Se connecter</AppButton>
      </NuxtLink>
    </template>

    <!-- Invalid/expired token -->
    <template v-else-if="invalidToken">
      <h1 class="page-reset__title">Lien expiré</h1>
      <p class="page-reset__text">Ce lien de réinitialisation a expiré ou est invalide. Demandez un nouveau lien.</p>
      <NuxtLink to="/login" class="page-reset__link">
        <AppButton variant="secondary" size="lg">Retour à la connexion</AppButton>
      </NuxtLink>
    </template>

    <!-- Form -->
    <template v-else>
      <h1 class="page-reset__title">Nouveau mot de passe</h1>
      <p class="page-reset__text">Choisissez un nouveau mot de passe pour votre compte.</p>

      <form class="page-reset__form" @submit.prevent="handleReset">
        <AppInput
          v-model="password"
          label="Nouveau mot de passe"
          type="password"
          placeholder="8 caractères minimum"
          :error="errors.password"
        />
        <AppInput
          v-model="confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          placeholder="Retapez votre mot de passe"
          :error="errors.confirm"
        />

        <AppAlert v-if="errors.general" variant="danger">
          {{ errors.general }}
        </AppAlert>

        <AppButton type="submit" :loading="loading" size="lg">
          Réinitialiser le mot de passe
        </AppButton>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false })

useHead({ title: 'Réinitialiser le mot de passe' })
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
    errors.value.password = '8 caractères minimum'
    return
  }
  if (password.value !== confirmPassword.value) {
    errors.value.confirm = 'Les mots de passe ne correspondent pas'
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
    const message = err?.data?.message || 'Une erreur est survenue'
    if (message.includes('expiré') || message.includes('invalide')) {
      invalidToken.value = true
    }
    else {
      errors.value.general = message
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

<template>
  <div class="page-forgot">
    <template v-if="sent">
      <h1 class="page-forgot__title">Email envoyé</h1>
      <p class="page-forgot__text">
        Si un compte existe pour <strong>{{ email }}</strong>, vous recevrez un lien de réinitialisation dans quelques instants.
      </p>
      <p class="page-forgot__text">Pensez à vérifier vos spams.</p>
      <NuxtLink to="/login" class="page-forgot__link">
        <AppButton variant="secondary" size="lg">Retour à la connexion</AppButton>
      </NuxtLink>
    </template>

    <template v-else>
      <h1 class="page-forgot__title">Mot de passe oublié</h1>
      <p class="page-forgot__text">Entrez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.</p>

      <form class="page-forgot__form" @submit.prevent="handleSubmit">
        <AppInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="vous@exemple.com"
          :error="errors.email"
        />

        <AppAlert v-if="errors.general" variant="danger">
          {{ errors.general }}
        </AppAlert>

        <AppButton type="submit" :loading="loading" size="lg">
          Envoyer le lien
        </AppButton>

        <NuxtLink to="/login" class="page-forgot__back">
          Retour à la connexion
        </NuxtLink>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false })

useHead({ title: 'Mot de passe oublié' })
useSeoMeta({ robots: 'noindex, nofollow' })

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  if (!email.value || !email.value.includes('@')) {
    errors.value.email = 'Email invalide'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })
    sent.value = true
  }
  catch {
    errors.value.general = 'Une erreur est survenue. Réessayez.'
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.page-forgot {
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

    strong { color: $color-gray-700; }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__link {
    text-decoration: none;
  }

  &__back {
    font-size: $font-size-sm;
    color: $color-gray-500;
    text-align: center;
    text-decoration: none;

    &:hover {
      color: $color-gray-700;
      text-decoration: underline;
    }
  }
}
</style>

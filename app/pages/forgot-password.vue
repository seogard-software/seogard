<template>
  <div class="page-forgot">
    <template v-if="sent">
      <h1 class="page-forgot__title">{{ $t('auth.forgot.sentTitle') }}</h1>
      <i18n-t keypath="auth.forgot.sentText" tag="p" class="page-forgot__text" scope="global">
        <template #email><strong>{{ email }}</strong></template>
      </i18n-t>
      <p class="page-forgot__text">{{ $t('auth.forgot.checkSpam') }}</p>
      <NuxtLink to="/login" class="page-forgot__link">
        <AppButton variant="secondary" size="lg">{{ $t('auth.common.backToLogin') }}</AppButton>
      </NuxtLink>
    </template>

    <template v-else>
      <h1 class="page-forgot__title">{{ $t('auth.forgot.title') }}</h1>
      <p class="page-forgot__text">{{ $t('auth.forgot.text') }}</p>

      <form class="page-forgot__form" @submit.prevent="handleSubmit">
        <AppInput
          v-model="email"
          :label="$t('auth.common.emailLabel')"
          type="email"
          :placeholder="$t('auth.forgot.emailPlaceholder')"
          :error="errors.email"
        />

        <AppAlert v-if="errors.general" variant="danger">
          {{ errors.general }}
        </AppAlert>

        <AppButton type="submit" :loading="loading" size="lg">
          {{ $t('auth.forgot.submit') }}
        </AppButton>

        <NuxtLink to="/login" class="page-forgot__back">
          {{ $t('auth.common.backToLogin') }}
        </NuxtLink>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'auth', auth: false })

const { t } = useI18n()

useHead({ title: t('seo.forgot.title') })
useSeoMeta({ robots: 'noindex, nofollow' })

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  if (!email.value || !email.value.includes('@')) {
    errors.value.email = t('validation.emailInvalid')
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
    errors.value.general = t('auth.forgot.errorGeneric')
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

<template>
  <AppModal v-model="open" wide :title="$t('auth.modal.title')" @close="emit('dismiss')">
    <div class="auth-modal">
      <div class="auth-modal__pitch">
        <p class="auth-modal__intro" v-html="$t('auth.modal.intro')" />
        <ul class="auth-modal__perks">
          <li class="auth-modal__perk">{{ $t('auth.modal.perk1') }}</li>
          <li class="auth-modal__perk">{{ $t('auth.modal.perk2') }}</li>
          <li class="auth-modal__perk">{{ $t('auth.modal.perk3') }}</li>
        </ul>
      </div>

      <div class="auth-modal__form">
        <AuthRegisterForm @success="emit('success')" />
        <p class="auth-modal__login">
          {{ $t('auth.common.alreadyAccount') }}
          <NuxtLink to="/login" @click="open = false">{{ $t('auth.common.signIn') }}</NuxtLink>
        </p>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
// Modale d'inscription de la barre Analyser : inscription par défaut (AuthRegisterForm) + lien
// connexion. La connexion (state machine SAML/TOTP) reste sur /login ; le scan en attente (URL en
// localStorage) est rejoué au retour par la page /dashboard/sites (point d'atterrissage du callback).
const open = defineModel<boolean>({ required: true })
const emit = defineEmits<{ success: [], dismiss: [] }>()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.auth-modal {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $spacing-8;
  align-items: start;

  @media (max-width: $breakpoint-md) {
    grid-template-columns: 1fr;
    gap: $spacing-5;
  }

  &__pitch {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__intro {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;

    strong { color: $color-gray-900; }
  }

  &__perks {
    list-style: none;
    margin: 0;
    padding: $spacing-3 $spacing-4;
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
    background: $color-gray-50;
    border: 1px solid $color-gray-100;
    border-radius: $radius-md;
  }

  &__perk {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-sm;
    color: $color-gray-700;

    &::before {
      content: '✓';
      flex-shrink: 0;
      color: $color-accent;
      font-weight: $font-weight-bold;
    }
  }

  &__login {
    text-align: center;
    font-size: $font-size-sm;
    color: $color-gray-500;

    a {
      color: $color-accent;
      text-decoration: underline;
    }
  }
}
</style>

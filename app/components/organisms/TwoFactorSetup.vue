<template>
  <div class="two-factor-setup">
    <!-- 2FA disabled — setup flow -->
    <template v-if="!authStore.currentUser?.totpEnabled">
      <template v-if="step === 'idle'">
        <p class="two-factor-setup__desc">
          Protégez votre compte avec l'authentification à deux facteurs (2FA).
        </p>
        <AppButton variant="accent" size="sm" @click="startSetup">
          Activer
          <template #icon-right><AppIcon name="chevron-right" size="sm" /></template>
        </AppButton>
      </template>

      <template v-if="step === 'qr'">
        <p class="two-factor-setup__desc">
          Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
        </p>
        <div class="two-factor-setup__qr">
          <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="QR Code 2FA" width="200" height="200">
        </div>
        <form class="two-factor-setup__form" @submit.prevent="enableTotp">
          <AppInput
            v-model="verifyCode"
            label="Code de vérification"
            placeholder="123456"
            :error="error"
          />
          <AppButton variant="accent" size="sm" type="submit" :loading="loading">
            Valider
            <template #icon-right><AppIcon name="chevron-right" size="sm" /></template>
          </AppButton>
        </form>
      </template>

      <template v-if="step === 'backup'">
        <AppAlert variant="warning">
          Sauvegardez ces codes de secours dans un endroit sûr. Chaque code ne peut être utilisé qu'une seule fois.
        </AppAlert>
        <div class="two-factor-setup__codes">
          <code v-for="code in backupCodes" :key="code">{{ code }}</code>
        </div>
        <AppButton variant="accent" size="sm" @click="step = 'idle'">
          Continuer
          <template #icon-right><AppIcon name="chevron-right" size="sm" /></template>
        </AppButton>
      </template>
    </template>

    <!-- 2FA enabled — disable flow -->
    <template v-else>
      <AppBadge variant="success">2FA activée</AppBadge>
      <form class="two-factor-setup__form" @submit.prevent="disableTotp">
        <AppInput
          v-model="disableCode"
          label="Code pour désactiver"
          placeholder="123456"
          :error="error"
        />
        <AppButton variant="danger" size="sm" type="submit" :loading="loading">
          Désactiver
          <template #icon-right><AppIcon name="chevron-right" size="sm" /></template>
        </AppButton>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()

const step = ref<'idle' | 'qr' | 'backup'>('idle')
const qrCodeDataUrl = ref('')
const verifyCode = ref('')
const disableCode = ref('')
const backupCodes = ref<string[]>([])
const error = ref<string>()
const loading = ref(false)

async function startSetup() {
  loading.value = true
  error.value = undefined
  try {
    const data = await $fetch<{ qrCodeDataUrl: string }>('/api/auth/totp/setup', {
      method: 'POST',
    })
    qrCodeDataUrl.value = data.qrCodeDataUrl
    step.value = 'qr'
  }
  catch {
    error.value = 'Erreur lors du setup'
  }
  finally {
    loading.value = false
  }
}

async function enableTotp() {
  if (!verifyCode.value) {
    error.value = 'Code requis'
    return
  }
  loading.value = true
  error.value = undefined
  try {
    const data = await $fetch<{ backupCodes: string[] }>('/api/auth/totp/enable', {
      method: 'POST',
      body: { code: verifyCode.value },
    })
    backupCodes.value = data.backupCodes
    step.value = 'backup'
    verifyCode.value = ''
    await authStore.fetchMe()
  }
  catch {
    error.value = 'Code invalide'
  }
  finally {
    loading.value = false
  }
}

async function disableTotp() {
  if (!disableCode.value) {
    error.value = 'Code requis'
    return
  }
  loading.value = true
  error.value = undefined
  try {
    await $fetch('/api/auth/totp/disable', {
      method: 'POST',
      body: { code: disableCode.value },
    })
    disableCode.value = ''
    await authStore.fetchMe()
  }
  catch {
    error.value = 'Code invalide'
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.two-factor-setup {
  display: flex;
  flex-direction: column;
  gap: $spacing-4;

  &__desc {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
  }

  &__qr {
    display: flex;
    justify-content: center;
    padding: $spacing-4;
    background-color: $surface-card;
    border-radius: $radius-lg;
    border: 1px solid $color-gray-200;
    width: fit-content;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__codes {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-2;

    code {
      padding: $spacing-2 $spacing-3;
      background-color: $surface-elevated;
      border-radius: $radius-md;
      font-family: $font-family-mono;
      font-size: $font-size-sm;
      text-align: center;
      color: $color-gray-800;
    }
  }
}
</style>

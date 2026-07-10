<template>
  <div :class="['scan-bar', `scan-bar--${size}`]">
    <form class="scan-bar__form" @submit.prevent="handleSubmit">
      <div class="scan-bar__field">
        <AppIcon v-if="size === 'inline'" name="search" size="sm" class="scan-bar__ico" />
        <span v-if="size === 'inline'" class="scan-bar__proto" aria-hidden="true">https://</span>
        <input
          v-model="url"
          type="text"
          class="scan-bar__input"
          :placeholder="size === 'hero' ? $t('common.scanBar.placeholder') : $t('common.scanBar.placeholderCompact')"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          :aria-invalid="!!error"
          :aria-label="$t('common.scanBar.ariaLabel')"
        >
        <span v-if="size !== 'inline'" class="scan-bar__badge">{{ $t('common.scanBar.badge') }}</span>
      </div>
      <AppButton type="submit" variant="accent" :size="size === 'inline' ? 'sm' : 'md'" :loading="loading" class="scan-bar__btn">
        {{ $t('common.scanBar.submit') }}
      </AppButton>
    </form>
    <p v-if="error" class="scan-bar__error">{{ error }}</p>
    <p class="scan-bar__consent">
      {{ $t('common.scanBar.consent') }}
    </p>
    <AuthModal v-model="showAuth" @success="onAuthSuccess" @dismiss="onboarding.clearPending()" />
  </div>
</template>

<script setup lang="ts">
// Barre « Analyser » (onboarding scan) : home hero + sidebar blog. Connecté → crée/redirige + crawl
// auto direct ; déconnecté → persiste l'URL (survie OAuth/SAML/SSO) + modale inscription, puis
// reprise. L'orchestration vit dans useScanOnboarding ; l'overview affiche la progression existante.
interface Props { size?: 'hero' | 'compact' | 'inline' }
const { size = 'hero' } = defineProps<Props>()

const { t } = useI18n()
const authStore = useAuthStore()
const onboarding = useScanOnboarding()

const url = ref('')
const error = ref('')
const loading = ref(false)
const showAuth = ref(false)
const pendingUrl = ref('')

// Préfixe https:// si absent puis valide le format AVANT toute action (réutilise isValidUrl partagé).
function toCandidate(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`
  return isValidUrl(candidate) ? candidate : null
}

async function handleSubmit() {
  error.value = ''
  const candidate = toCandidate(url.value)
  if (!candidate) {
    error.value = t('common.scanBar.errorInvalid')
    return
  }
  pendingUrl.value = candidate

  loading.value = true
  try {
    if (authStore.isAuthenticated) {
      await onboarding.runScan(candidate)
    }
    else {
      onboarding.persistPending(candidate) // survit aux redirections OAuth/SAML/SSO
      showAuth.value = true
    }
  }
  catch {
    error.value = t('common.scanBar.errorGeneric')
  }
  finally {
    loading.value = false
  }
}

// Inscription email réussie (modale, sans rechargement) → on lance le scan directement.
async function onAuthSuccess() {
  showAuth.value = false
  if (!pendingUrl.value) return
  loading.value = true
  try {
    await onboarding.runScan(pendingUrl.value)
  }
  catch {
    error.value = t('common.scanBar.errorGeneric')
  }
  finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.scan-bar {
  width: 100%;

  &__form {
    display: flex;
    gap: $spacing-2;
    width: 100%;
  }

  &__field {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
  }

  // Badge « Gratuit » à l'intérieur de l'input, à droite (gagne une ligne vs un label au-dessus).
  &__badge {
    position: absolute;
    right: $spacing-3;
    top: 50%;
    transform: translateY(-50%);
    padding: 2px $spacing-2;
    background: $color-accent;
    color: $color-white;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-radius: $radius-full;
    line-height: 1.4;
    pointer-events: none;
  }

  &__input {
    width: 100%;
    padding: $spacing-3 $spacing-4;
    padding-right: 5.25rem; // place pour le badge « Gratuit »
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $color-white;
    color: $color-gray-900;
    font-size: $font-size-base;
    transition: border-color 0.15s;

    &::placeholder { color: $color-gray-400; }
    &:focus {
      outline: none;
      border-color: $color-accent;
    }
    &[aria-invalid='true'] { border-color: $color-danger; }
  }

  &__error {
    margin-top: $spacing-2;
    font-size: $font-size-sm;
    color: $color-danger;
  }

  &__consent {
    margin-top: $spacing-2;
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &--hero {
    .scan-bar__input { padding: $spacing-4 $spacing-5; padding-right: 5.75rem; font-size: $font-size-lg; }
  }

  &--compact {
    .scan-bar__form { flex-direction: column; }
    .scan-bar__btn { width: 100%; }
  }

  // ── Variante « inline » : champ fin façon maquette (loupe + https:// + bouton compact) ──
  // Préfixe EN FLUX (pas d'absolute) → le placeholder ne peut jamais être recouvert par « https:// ».
  &__ico { flex: none; color: $color-gray-400; pointer-events: none; }
  &__proto {
    flex: none;
    font-family: $font-family-mono;
    font-size: $font-size-sm;
    color: $color-gray-400;
    pointer-events: none;
    user-select: none;
  }

  &--inline {
    .scan-bar__form { flex-direction: row; gap: $spacing-2; align-items: stretch; }

    // La bordure passe sur le conteneur ; loupe + https:// + input sont des frères en ligne.
    .scan-bar__field {
      align-items: center;
      gap: $spacing-2;
      padding: 0 $spacing-3;
      border: 1px solid $color-gray-200;
      border-radius: $radius-lg;
      background: $color-white;
      transition: border-color 0.15s, box-shadow 0.15s;

      &:focus-within { border-color: $color-accent; box-shadow: 0 0 0 3px rgba($color-accent, 0.12); }
    }

    .scan-bar__input {
      flex: 1;
      width: auto;
      min-width: 0;
      padding: $spacing-3 0;
      border: none;
      background: transparent;
      font-family: $font-family-mono;
      font-size: $font-size-sm;

      &:focus { outline: none; border: none; box-shadow: none; }
    }

    .scan-bar__btn { width: auto; white-space: nowrap; border-radius: $radius-lg; }
    .scan-bar__consent { font-size: $font-size-xs; color: $color-gray-400; margin-top: $spacing-2; }

    @media (max-width: $breakpoint-sm) {
      .scan-bar__form { flex-direction: column; }
      .scan-bar__btn { width: 100%; }
    }
  }
}
</style>

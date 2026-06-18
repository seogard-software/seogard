<template>
  <div :class="['scan-bar', `scan-bar--${size}`]">
    <form class="scan-bar__form" @submit.prevent="handleSubmit">
      <div class="scan-bar__field">
        <input
          v-model="url"
          type="text"
          class="scan-bar__input"
          :placeholder="size === 'compact' ? 'votresite.fr' : 'Saisissez votre site Web'"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          :aria-invalid="!!error"
          aria-label="Adresse de votre site Web"
        >
        <span class="scan-bar__badge">Gratuit</span>
      </div>
      <AppButton type="submit" variant="accent" :loading="loading" class="scan-bar__btn">
        Analyser
      </AppButton>
    </form>
    <p v-if="error" class="scan-bar__error">{{ error }}</p>
    <p class="scan-bar__consent">
      En cliquant sur Analyser, je certifie être propriétaire du site ou disposer d'une autorisation pour le crawler.
    </p>
    <AuthModal v-model="showAuth" @success="onAuthSuccess" @dismiss="onboarding.clearPending()" />
  </div>
</template>

<script setup lang="ts">
// Barre « Analyser » (onboarding scan) : home hero + sidebar blog. Connecté → crée/redirige + crawl
// auto direct ; déconnecté → persiste l'URL (survie OAuth/SAML/SSO) + modale inscription, puis
// reprise. L'orchestration vit dans useScanOnboarding ; l'overview affiche la progression existante.
interface Props { size?: 'hero' | 'compact' }
const { size = 'hero' } = defineProps<Props>()

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
    error.value = 'Entrez une adresse valide (ex. votresite.fr)'
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
    error.value = 'Une erreur est survenue. Réessayez.'
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
    error.value = 'Une erreur est survenue. Réessayez.'
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
}
</style>

<template>
  <section id="estimator" class="estimator">
    <div class="estimator__container">
      <span class="section-label">Estimateur</span>
      <h2 class="section-title">Combien coûte le monitoring de votre site ?</h2>
      <p class="section-desc">
        Entrez l'URL de votre site et votre email. On analyse votre sitemap et vous envoie une estimation personnalisée.
      </p>

      <div class="estimator__box">
        <!-- Step 1: URL -->
        <div v-if="step === 'url'" class="estimator__step">
          <form class="estimator__form" @submit.prevent="goToEmail">
            <div class="estimator__input-wrapper">
              <svg class="estimator__input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
              <input
                v-model="url"
                type="text"
                class="estimator__input"
                placeholder="https://example.com"
              >
            </div>
            <button type="submit" class="estimator__btn" :disabled="!url.trim()">
              Continuer
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </form>
        </div>

        <!-- Step 2: Email -->
        <div v-if="step === 'email'" class="estimator__step">
          <div class="estimator__email-context">
            <button class="estimator__back" type="button" @click="step = 'url'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
              {{ url }}
            </button>
            <p class="estimator__email-explain">
              L'analyse de votre sitemap peut prendre quelques minutes selon la taille du site.
              Renseignez votre email pour recevoir votre estimation dès qu'elle est prête.
            </p>
          </div>
          <form class="estimator__form" @submit.prevent="submit">
            <div class="estimator__input-wrapper">
              <svg class="estimator__input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              <input
                v-model="email"
                type="email"
                class="estimator__input"
                placeholder="votre@email.com"
                required
              >
            </div>
            <button type="submit" class="estimator__btn" :disabled="submitting || !email.trim()">
              <template v-if="submitting">
                <span class="estimator__spinner" />
                Envoi...
              </template>
              <template v-else>
                Recevoir mon estimation
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
              </template>
            </button>
          </form>
        </div>

        <!-- Step 3: Confirmation -->
        <div v-if="step === 'done'" class="estimator__done">
          <div class="estimator__done-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h3 class="estimator__done-title">Estimation en cours</h3>
          <p class="estimator__done-text">
            On analyse le sitemap de <strong>{{ url }}</strong>. Vous recevrez votre estimation personnalisée à <strong>{{ email }}</strong> dès que l'analyse sera terminée.
          </p>
          <div class="estimator__done-actions">
            <NuxtLink to="/register" class="estimator__cta estimator__cta--primary">
              Créer un compte en attendant
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </NuxtLink>
            <a href="https://github.com/seogard-software/seogard" target="_blank" rel="noopener" class="estimator__cta estimator__cta--ghost">
              Ou self-hosted (gratuit)
            </a>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="estimator__error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          <span>{{ error }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type Step = 'url' | 'email' | 'done'

const url = ref('')
const email = ref('')
const step = ref<Step>('url')
const submitting = ref(false)
const error = ref<string | null>(null)

function goToEmail() {
  if (!url.value.trim()) return
  error.value = null
  step.value = 'email'
}

async function submit() {
  if (!email.value.trim() || submitting.value) return

  submitting.value = true
  error.value = null

  try {
    await $fetch('/api/public/sitemap-estimate-email', {
      method: 'POST',
      body: { url: url.value.trim(), email: email.value.trim() },
    })
    step.value = 'done'
  }
  catch (err: unknown) {
    const fetchError = err as { statusCode?: number, data?: { message?: string } }
    if (fetchError.statusCode === 429) {
      error.value = fetchError.data?.message || 'Trop de requêtes. Réessayez dans quelques minutes.'
    }
    else if (fetchError.statusCode === 400) {
      error.value = fetchError.data?.message || 'Vérifiez l\'URL et l\'email.'
    }
    else {
      error.value = 'Une erreur est survenue. Réessayez.'
    }
  }
  finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.section-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-accent;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: $spacing-4;
  text-align: center;
}

.section-title {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  color: $color-gray-900;
  margin-bottom: $spacing-4;
  letter-spacing: -0.02em;
  text-align: center;
}

.section-desc {
  font-size: $font-size-lg;
  color: $color-gray-500;
  max-width: 600px;
  margin: 0 auto $spacing-12;
  line-height: $line-height-normal;
  text-align: center;
}

.estimator {
  padding: 6rem 0;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 $spacing-6;
  }

  &__box {
    max-width: 640px;
    margin: 0 auto;
  }

  &__form {
    display: flex;
    gap: $spacing-3;

    @media (max-width: $breakpoint-md) {
      flex-direction: column;
    }
  }

  &__input-wrapper {
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
  }

  &__input-icon {
    position: absolute;
    left: $spacing-4;
    color: $color-gray-400;
    pointer-events: none;
  }

  &__input {
    width: 100%;
    padding: 0.875rem $spacing-4 0.875rem 2.75rem;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    color: $color-gray-900;
    font-size: $font-size-base;
    font-family: $font-family-base;
    outline: none;
    transition: border-color $transition-base;

    &::placeholder {
      color: $color-gray-400;
    }

    &:focus {
      border-color: $color-gray-400;
    }

    &:disabled {
      opacity: 0.5;
    }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: 0.875rem $spacing-6;
    background: $color-accent;
    color: $color-white;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    font-family: $font-family-base;
    border: none;
    border-radius: $radius-lg;
    cursor: pointer;
    white-space: nowrap;
    transition: all $transition-base;

    &:hover:not(:disabled) {
      opacity: 0.9;
      box-shadow: $shadow-lg;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid $color-gray-200;
    border-top-color: $color-accent;
    border-radius: 50%;
    animation: estimator-spin 0.6s linear infinite;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    background: none;
    border: none;
    color: $color-gray-500;
    font-size: $font-size-sm;
    font-family: $font-family-base;
    cursor: pointer;
    padding: 0;
    margin-bottom: $spacing-3;

    &:hover {
      color: $color-gray-700;
    }
  }

  &__email-context {
    margin-bottom: $spacing-4;
  }

  &__email-explain {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
    margin: 0;
  }

  &__done {
    text-align: center;
    padding: $spacing-8 $spacing-6;
    background: $color-white;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
  }

  &__done-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba($color-success, 0.1);
    border-radius: 50%;
    color: $color-success;
    margin-bottom: $spacing-4;
  }

  &__done-title {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 $spacing-3;
  }

  &__done-text {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
    margin: 0 0 $spacing-6;
  }

  &__done-actions {
    display: flex;
    gap: $spacing-3;
    justify-content: center;
    flex-wrap: wrap;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: 0.75rem $spacing-6;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;
    text-decoration: none;
    transition: all $transition-base;

    &--primary {
      background: $color-accent;
      color: $color-white;

      &:hover {
        opacity: 0.9;
        box-shadow: $shadow-lg;
        text-decoration: none;
      }
    }

    &--ghost {
      color: $color-gray-500;
      border: 1px solid $color-gray-300;

      &:hover {
        color: $color-gray-800;
        border-color: $color-gray-400;
        text-decoration: none;
      }
    }
  }

  &__error {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    margin-top: $spacing-4;
    padding: $spacing-4;
    background: rgba($color-danger, 0.06);
    border: 1px solid rgba($color-danger, 0.15);
    border-radius: $radius-lg;
    color: $color-danger;
    font-size: $font-size-sm;
  }
}

@keyframes estimator-spin {
  to { transform: rotate(360deg); }
}
</style>

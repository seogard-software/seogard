import type { PostHog } from 'posthog-js'

// Source UNIQUE de l'état de consentement cookies (lecture/écriture du cookie + opt-in/opt-out
// de l'analytics comportemental PostHog). Avant, la logique vivait enfermée dans CookieConsent.vue :
// on l'extrait ici pour que le plugin PostHog et la bannière partagent la MÊME vérité (pas deux
// logiques divergentes). Umami reste non concerné (cookieless, anonymisé, sans consentement requis).

export type ConsentState = 'accepted' | 'refused' | null

const CONSENT_COOKIE = 'cookie-consent'
const CONSENT_MAX_AGE = 365 * 24 * 60 * 60 // 1 an

export function useCookieConsent() {
  const cookie = useCookie<ConsentState>(CONSENT_COOKIE, {
    maxAge: CONSENT_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })

  const state = computed<ConsentState>(() => cookie.value ?? null)

  // $posthog n'est fourni que par le plugin .client (donc jamais en SSR) et reste absent tant qu'il
  // n'y a pas de clé (dev / self-hosted) → l'optional chaining suffit, pas de garde import.meta.client
  // (accept/refuse ne sont appelés que sur un clic client). Sans garde interne = testable.
  function posthog(): PostHog | undefined {
    return useNuxtApp().$posthog as PostHog | undefined
  }

  function accept() {
    cookie.value = 'accepted'
    posthog()?.opt_in_capturing()
  }

  function refuse() {
    cookie.value = 'refused'
    posthog()?.opt_out_capturing()
  }

  return { state, accept, refuse }
}

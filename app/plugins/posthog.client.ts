import posthog from 'posthog-js'

// PostHog Cloud (EU) — session replay + autocapture, RGPD-first.
// - No-op si posthogKey vide (dev / self-hosted BSL 1.1) → rien ne charge, comme umami.client.ts.
// - opt_out_capturing_by_default: RIEN n'est capturé tant que le consentement n'est pas ACCEPTÉ
//   (via la bannière CookieConsent → useCookieConsent). On opt-in seulement si déjà accepté au load.
// - maskAllInputs: les champs saisis (mots de passe compris) ne sont JAMAIS filmés ; tout le reste
//   de l'écran (parcours, clics, hésitations) reste visible pour comprendre où l'utilisateur bloque.
export default defineNuxtPlugin(() => {
  const { posthogKey, posthogHost } = useRuntimeConfig().public

  if (!posthogKey) return

  posthog.init(posthogKey, {
    api_host: posthogHost || 'https://eu.i.posthog.com',
    capture_pageview: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
    opt_out_capturing_by_default: true,
    session_recording: { maskAllInputs: true },
  })

  const { state } = useCookieConsent()
  if (state.value === 'accepted') posthog.opt_in_capturing()

  return { provide: { posthog } }
})

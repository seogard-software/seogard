import type { PostHog } from 'posthog-js'

// Wrapper mince et SÛR autour de PostHog pour baliser les jalons du tunnel de conversion.
// - No-op côté serveur et quand $posthog est absent (clé vide en dev/self-hosted).
// - Quand le consentement est refusé, PostHog est en opt-out → capture()/identify() ne partent pas.
// Les PAGES (pageviews) et les clics sont déjà capturés par autocapture : on ne balise ICI que les
// ACTIONS de valeur (scan lancé, inscription, activation, abonnement), jamais une simple page vue.

export type ScanSource =
  | 'home_hero'
  | 'scanner_page'
  | 'about'
  | 'monitoring'
  | 'audit'
  | 'pricing'
  | 'formations'
  | `fiche:${string}`
  | 'unknown'

export function useAnalytics() {
  // $posthog n'est fourni que par le plugin .client (jamais en SSR) → optional chaining suffit.
  // Pas de garde import.meta.client interne (= testable) ; les call sites SSR-sensibles gardent
  // eux-mêmes (ex. auth store : `if (import.meta.client) useAnalytics().reset()`).
  function posthog(): PostHog | undefined {
    return useNuxtApp().$posthog as PostHog | undefined
  }

  function capture(event: string, props?: Record<string, unknown>) {
    posthog()?.capture(event, props)
  }

  function identify(id: string, props?: Record<string, unknown>) {
    posthog()?.identify(id, props)
  }

  function reset() {
    posthog()?.reset()
  }

  return { capture, identify, reset }
}

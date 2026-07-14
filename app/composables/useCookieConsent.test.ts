import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { useCookieConsent } from './useCookieConsent'

// useCookieConsent = source unique du consentement : lit/écrit le cookie ET pilote l'opt-in/opt-out
// de PostHog. On stub les auto-imports Nuxt (useCookie, computed, useNuxtApp) pour vérifier que le
// choix se propage bien au bon signal PostHog, et que tout reste sûr quand PostHog est absent.
const cookieRef = ref<string | null>(null)
const optIn = vi.fn()
const optOut = vi.fn()
let posthog: unknown = { opt_in_capturing: optIn, opt_out_capturing: optOut }

vi.stubGlobal('computed', computed)
vi.stubGlobal('useCookie', () => cookieRef)
vi.stubGlobal('useNuxtApp', () => ({ $posthog: posthog }))

describe('useCookieConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cookieRef.value = null
    posthog = { opt_in_capturing: optIn, opt_out_capturing: optOut }
  })

  it('state reflète le cookie (null / accepted / refused)', () => {
    const c = useCookieConsent()
    expect(c.state.value).toBeNull()
    cookieRef.value = 'accepted'
    expect(c.state.value).toBe('accepted')
    cookieRef.value = 'refused'
    expect(c.state.value).toBe('refused')
  })

  it('accept() écrit accepted et opt-in PostHog', () => {
    const c = useCookieConsent()
    c.accept()
    expect(cookieRef.value).toBe('accepted')
    expect(optIn).toHaveBeenCalledOnce()
    expect(optOut).not.toHaveBeenCalled()
  })

  it('refuse() écrit refused et opt-out PostHog', () => {
    const c = useCookieConsent()
    c.refuse()
    expect(cookieRef.value).toBe('refused')
    expect(optOut).toHaveBeenCalledOnce()
    expect(optIn).not.toHaveBeenCalled()
  })

  it('ne casse pas si PostHog absent (clé vide / self-hosted)', () => {
    posthog = undefined
    const c = useCookieConsent()
    expect(() => { c.accept(); c.refuse() }).not.toThrow()
    expect(cookieRef.value).toBe('refused')
  })
})

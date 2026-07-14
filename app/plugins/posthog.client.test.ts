import { describe, it, expect, vi, beforeEach } from 'vitest'

// Plugin PostHog : on vérifie le contrat RGPD/self-hosted — no-op total sans clé, et quand la clé
// est présente, init TOUJOURS en opt-out (opt_out_capturing_by_default) mais opt-in SEULEMENT si le
// consentement est déjà « accepted ». posthog-js et les auto-imports Nuxt sont mockés.
const init = vi.fn()
const optIn = vi.fn()

vi.mock('posthog-js', () => ({ default: { init, opt_in_capturing: optIn } }))

let runtimeConfig: { public: { posthogKey: string, posthogHost: string } }
let consentState: string | null

vi.stubGlobal('defineNuxtPlugin', (fn: unknown) => fn)
vi.stubGlobal('useRuntimeConfig', () => runtimeConfig)
vi.stubGlobal('useCookieConsent', () => ({ state: { value: consentState } }))

async function loadPlugin() {
  return (await import('./posthog.client')).default as (nuxtApp: unknown) => unknown
}

describe('posthog.client plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consentState = null
  })

  it('no-op si posthogKey vide (dev / self-hosted BSL)', async () => {
    runtimeConfig = { public: { posthogKey: '', posthogHost: '' } }
    const plugin = await loadPlugin()
    const res = plugin({})
    expect(init).not.toHaveBeenCalled()
    expect(res).toBeUndefined()
  })

  it('init + provide si clé ; opt-in quand consentement déjà accepté', async () => {
    runtimeConfig = { public: { posthogKey: 'phc_x', posthogHost: 'https://eu.i.posthog.com' } }
    consentState = 'accepted'
    const plugin = await loadPlugin()
    const res = plugin({}) as { provide: { posthog: unknown } }
    expect(init).toHaveBeenCalledOnce()
    expect(optIn).toHaveBeenCalledOnce()
    expect(res.provide.posthog).toBeDefined()
  })

  it('init mais PAS d opt-in si consentement non accepté (opt-out par défaut tient)', async () => {
    runtimeConfig = { public: { posthogKey: 'phc_x', posthogHost: '' } }
    consentState = null
    const plugin = await loadPlugin()
    plugin({})
    expect(init).toHaveBeenCalledOnce()
    expect(optIn).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAnalytics } from './useAnalytics'

// useAnalytics = wrapper mince PostHog pour baliser le tunnel. On vérifie la délégation directe et
// surtout le no-op silencieux quand $posthog est absent (clé vide en dev / build self-hosted BSL).
const capture = vi.fn()
const identify = vi.fn()
const reset = vi.fn()
let posthog: unknown = { capture, identify, reset }

vi.stubGlobal('useNuxtApp', () => ({ $posthog: posthog }))

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    posthog = { capture, identify, reset }
  })

  it('capture / identify / reset délèguent à PostHog', () => {
    const a = useAnalytics()
    a.capture('scan_submitted', { source: 'home_hero' })
    expect(capture).toHaveBeenCalledWith('scan_submitted', { source: 'home_hero' })
    a.identify('u1', { email: 'x@y.z' })
    expect(identify).toHaveBeenCalledWith('u1', { email: 'x@y.z' })
    a.reset()
    expect(reset).toHaveBeenCalledOnce()
  })

  it('no-op silencieux si PostHog absent (clé vide)', () => {
    posthog = undefined
    const a = useAnalytics()
    expect(() => { a.capture('x'); a.identify('u'); a.reset() }).not.toThrow()
  })
})

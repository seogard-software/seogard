import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useScanOnboarding } from './useScanOnboarding'

// useScanOnboarding s'appuie sur $fetch (/api/scan), useRouter (navigation) et localStorage
// (URL en attente) → on les stub. On vérifie surtout que runScan navigue vers le site RENVOYÉ
// par /api/scan (et pas un autre), purge l'URL, et que scanPath construit le bon chemin.
const mockFetch = vi.fn()
const mockPush = vi.fn()
const mockReplace = vi.fn()

const store = new Map<string, string>()
const mockLocalStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
}

vi.stubGlobal('localStorage', mockLocalStorage)
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('useRouter', () => ({ push: mockPush, replace: mockReplace }))

describe('useScanOnboarding', () => {
  let onboarding: ReturnType<typeof useScanOnboarding>

  beforeEach(() => {
    vi.clearAllMocks()
    store.clear()
    onboarding = useScanOnboarding()
  })

  it('persistPending / readPending / clearPending sur localStorage', () => {
    expect(onboarding.readPending()).toBeNull()
    onboarding.persistPending('https://exemple.fr')
    expect(onboarding.readPending()).toBe('https://exemple.fr')
    onboarding.clearPending()
    expect(onboarding.readPending()).toBeNull()
  })

  it('scanPath appelle POST /api/scan et renvoie le chemin du site RENVOYÉ', async () => {
    mockFetch.mockResolvedValueOnce({ siteId: 'site-seogard', defaultZoneId: 'z1' })
    const path = await onboarding.scanPath('https://seogard.io')
    expect(mockFetch).toHaveBeenCalledWith('/api/scan', { method: 'POST', body: { url: 'https://seogard.io' } })
    expect(path).toBe('/dashboard/sites/site-seogard')
  })

  it('runScan : scanne, purge l URL en attente, navigue vers le site renvoyé (pas un autre)', async () => {
    onboarding.persistPending('https://seogard.io')
    mockFetch.mockResolvedValueOnce({ siteId: 'site-seogard', defaultZoneId: 'z1' })

    await onboarding.runScan('https://seogard.io')

    expect(mockPush).toHaveBeenCalledWith('/dashboard/sites/site-seogard')
    expect(onboarding.readPending()).toBeNull()
  })

  it('runScan propage l erreur si /api/scan échoue (sans naviguer)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('500'))
    await expect(onboarding.runScan('https://seogard.io')).rejects.toThrow()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

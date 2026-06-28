import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchPage } from '../../crawler/fetcher'

// Tests d'INTÉGRATION de la boucle de redirection de fetchPage (fetch mocké). C'est le code le plus
// risqué de la feature redirection — jusqu'ici couvert seulement par les fonctions pures.

interface FakeRes { status: number, location?: string | null, body?: string }
function res({ status, location = null, body = '' }: FakeRes): Response {
  const headers = new Map<string, string | null>()
  if (location) headers.set('location', location)
  return {
    status,
    url: '',
    headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? null },
    text: async () => body,
  } as unknown as Response
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})
afterEach(() => vi.unstubAllGlobals())

describe('fetchPage — boucle de redirection', () => {
  it('page 200 normale : pas de redirection', async () => {
    fetchMock.mockResolvedValue(res({ status: 200, body: '<title>OK</title>' }))
    const r = await fetchPage('https://x.com/a', 2000)
    expect(r.statusCode).toBe(200)
    expect(r.redirectTarget).toBeNull()
    expect(r.meta.isRedirected).toBe(false)
    expect(r.html).toContain('OK')
  })

  it('301 cross-path : enregistre le code 3xx + la cible, sans corps', async () => {
    fetchMock.mockResolvedValue(res({ status: 301, location: '/new' }))
    const r = await fetchPage('https://x.com/old', 2000)
    expect(r.statusCode).toBe(301)
    expect(r.redirectTarget).toBe('https://x.com/new') // Location relatif résolu en absolu
    expect(r.meta.isRedirected).toBe(true)
    expect(r.html).toBe('') // on ne télécharge PAS la destination
    expect(fetchMock).toHaveBeenCalledTimes(1) // pas de 2e fetch (cross-path = on s'arrête)
  })

  it('301 canonique bénigne (http→https) : suivie, renvoie le 200 final', async () => {
    fetchMock.mockImplementation(async (u: string) =>
      u === 'http://x.com/a'
        ? res({ status: 301, location: 'https://x.com/a' })
        : res({ status: 200, body: '<title>HTTPS</title>' }),
    )
    const r = await fetchPage('http://x.com/a', 2000)
    expect(r.statusCode).toBe(200) // suivi jusqu'au 200
    expect(r.redirectTarget).toBeNull() // bénin → pas signalé comme redirection
    expect(r.meta.isRedirected).toBe(false)
    expect(r.finalUrl).toBe('https://x.com/a')
    expect(fetchMock).toHaveBeenCalledTimes(2) // 2e saut bien effectué
  })

  it('redirection vers la home : cible = racine', async () => {
    fetchMock.mockResolvedValue(res({ status: 302, location: 'https://x.com/' }))
    const r = await fetchPage('https://x.com/produit/123', 2000)
    expect(r.statusCode).toBe(302)
    expect(r.redirectTarget).toBe('https://x.com/')
  })

  it('3xx SANS header Location : isRedirected vrai, cible null', async () => {
    fetchMock.mockResolvedValue(res({ status: 307, location: null }))
    const r = await fetchPage('https://x.com/a', 2000)
    expect(r.statusCode).toBe(307)
    expect(r.redirectTarget).toBeNull()
    expect(r.meta.isRedirected).toBe(true) // 3xx → traité comme redirection (baseline préservée côté worker)
  })
})

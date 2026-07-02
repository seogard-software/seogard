import { describe, it, expect, vi } from 'vitest'

// Globals auto-importés par Nitro — stubbés avant l'import du middleware.
vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage?: string }) =>
  Object.assign(new Error(opts.statusMessage || String(opts.statusCode)), opts))

let mockPath = '/'
vi.stubGlobal('getRequestURL', () => new URL(`https://seogard.io${mockPath}`))

const handler = (await import('../../server/middleware/00.gone-410')).default as (event: unknown) => void

function statusOf(path: string): number {
  mockPath = path
  try {
    handler({})
    return 200
  }
  catch (e) {
    return (e as { statusCode: number }).statusCode
  }
}

describe('middleware 410 Gone (tout /blog supprimé, racine comprise)', () => {
  it('renvoie 410 sur tout article /blog/<slug>', () => {
    expect(statusOf('/blog/seo-technique-2024')).toBe(410)
    expect(statusOf('/blog/n-importe-quel-slug')).toBe(410)
  })

  it('410 aussi avec un slash final', () => {
    expect(statusOf('/blog/un-article/')).toBe(410)
  })

  it('renvoie 410 sur la racine /blog (pas de backlink, pas de successeur)', () => {
    expect(statusOf('/blog')).toBe(410)
    expect(statusOf('/blog/')).toBe(410)
  })

  it('ne touche pas les autres routes', () => {
    expect(statusOf('/')).toBe(200)
    expect(statusOf('/formations')).toBe(200)
    expect(statusOf('/blogueur')).toBe(200)
  })
})

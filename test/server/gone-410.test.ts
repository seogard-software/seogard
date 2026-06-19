import { describe, it, expect, vi } from 'vitest'

// Globals auto-importés par Nitro — stubbés avant l'import du middleware.
vi.stubGlobal('defineEventHandler', (fn: unknown) => fn)
vi.stubGlobal('createError', (opts: { statusCode: number, statusMessage?: string }) =>
  Object.assign(new Error(opts.statusMessage || String(opts.statusCode)), opts))

let mockPath = '/'
vi.stubGlobal('getRequestURL', () => new URL(`https://seogard.io${mockPath}`))

const handler = (await import('../../server/middleware/00.gone-410')).default as (event: unknown) => void

function run(path: string) {
  mockPath = path
  return handler({})
}

const DEAD = '/blog/merchant-center-flags-feeds-disruption'

describe('middleware 410 Gone (articles perdus)', () => {
  it('renvoie 410 sur un article perdu', () => {
    let code = 0
    try { run(DEAD) }
    catch (e) { code = (e as { statusCode: number }).statusCode }
    expect(code).toBe(410)
  })

  it('410 aussi avec un slash final', () => {
    let code = 0
    try { run(`${DEAD}/`) }
    catch (e) { code = (e as { statusCode: number }).statusCode }
    expect(code).toBe(410)
  })

  it('renvoie 410 sur un slug orphelin ajouté à la liste', () => {
    let code = 0
    try { run('/blog/google-ads-api-enforces-daily-minimum-budget-for-demand-gen-campaigns') }
    catch (e) { code = (e as { statusCode: number }).statusCode }
    expect(code).toBe(410)
  })

  it('renvoie 410 sur tout slug -via-sejournal- (pattern, même hors liste)', () => {
    let code = 0
    try { run('/blog/un-titre-quelconque-via-sejournal-unauteur') }
    catch (e) { code = (e as { statusCode: number }).statusCode }
    expect(code).toBe(410)
  })

  it('ne touche pas une page vivante ni les autres routes', () => {
    expect(run('/blog/un-article-bien-vivant')).toBeUndefined()
    expect(run('/blog/metas-disparues-apres-mise-en-production')).toBeUndefined()
    expect(run('/blog')).toBeUndefined()
    expect(run('/')).toBeUndefined()
  })
})

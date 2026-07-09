import { describe, it, expect, vi, beforeEach } from 'vitest'

// Non-régression du wording performance honnête (fichiers désormais en ANGLAIS — racine
// unique, plan i18n) : la perf doit être présentée comme MONITORÉE (vitals affichés, sans
// alerte) ; SEUL le poids de page (page weight) déclenche une régression. On interdit toute
// formulation qui ferait croire à une alerte sur LCP/CLS/TTFB.

vi.mock('../utils/deployment', () => ({ isSelfHosted: () => false }))

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('setResponseHeader', vi.fn())
vi.stubGlobal('createError', (opts: { statusCode: number }) => {
  const err = new Error(`HTTP ${opts.statusCode}`) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})

const FORBIDDEN = [
  'alertes core web vitals',
  'alerte lcp',
  'core web vitals alert',
  'alert on lcp',
  'alerts on core web vitals',
  'lcp alert',
  'cls alert',
  'ttfb alert',
]

beforeEach(() => vi.clearAllMocks())

describe('llms.txt — wording Performance Web honnête', () => {
  it('mentionne "Performance Web" et ne promet aucune alerte sur les Web Vitals', async () => {
    const handler = (await import('./llms.txt')).default
    const content = await handler({} as never) as string
    expect(content).toContain('Web performance')
    const lower = content.toLowerCase()
    for (const phrase of FORBIDDEN) expect(lower).not.toContain(phrase)
  })
})

describe('llms-full.txt — wording Performance Web honnête', () => {
  it('a une section Web performance, monitoring-only sauf poids de page', async () => {
    const handler = (await import('./llms-full.txt')).default
    const content = await handler({} as never) as string
    expect(content).toContain('Web performance')
    const lower = content.toLowerCase()
    expect(lower).toContain('page weight') // la seule régression perf
    for (const phrase of FORBIDDEN) expect(lower).not.toContain(phrase)
  })
})

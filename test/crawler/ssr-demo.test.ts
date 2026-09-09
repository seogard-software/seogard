import { readFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import demo from '../../shared/data/ssr-demo.json'
import { runRule, type RuleContext } from '../../crawler/rules/engine'
import { isCsrBlocked } from '../../crawler/rules/helpers'
import { isSsrContentMismatch, isSsrRenderingFailed } from '../../crawler/rules/ssr-csr'
import '../../crawler/rules/recommendations'

// Reproduce with: yarn test test/crawler/ssr-demo.test.ts
// Requires the Chromium version installed by: yarn playwright install chromium
// Real HTTP, fetcher, Chromium renderer and rules; no crawler measurements are mocked.
describe('public SSR demonstration', () => {
  let server: Server | undefined
  let origin: string
  let fetcher: typeof import('../../crawler/fetcher')
  let renderer: typeof import('../../crawler/renderer') | undefined
  const fixtures = new Map<string, string>()

  beforeAll(async () => {
    // Neutralize remote logging even if the caller supplies a production environment.
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('BETTERSTACK_TOKEN', '')
    vi.stubEnv('LOG_LEVEL', 'silent')
    fetcher = await import('../../crawler/fetcher')
    renderer = await import('../../crawler/renderer')

    for (const variant of ['before', 'after'] as const) {
      const html = await readFile(new URL(`../fixtures/ssr-demo/${variant}.html`, import.meta.url), 'utf8')
      fixtures.set(`/${variant}`, html)
    }

    server = createServer((request, response) => {
      const html = fixtures.get(request.url ?? '')
      response.writeHead(html ? 200 : 404, {
        'Content-Type': 'text/html; charset=utf-8',
        // Fixtures can execute their inline script, but cannot load external resources.
        'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'",
      })
      response.end(html ?? '')
    })
    await new Promise<void>((resolve, reject) => {
      server!.once('error', reject)
      server!.listen(0, '127.0.0.1', resolve)
    })
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Expected a local TCP address')
    origin = `http://127.0.0.1:${address.port}`
    await renderer.initBrowser()
  }, 20_000)

  afterAll(async () => {
    try {
      await renderer?.closeBrowser()
    }
    finally {
      if (server?.listening) {
        await new Promise<void>((resolve, reject) => {
          server!.close(error => error ? reject(error) : resolve())
          server!.closeAllConnections()
        })
      }
      vi.unstubAllEnvs()
    }
  }, 20_000)

  it('reproduces both differences, removes them with server HTML, and matches the public evidence', async () => {
    expect(demo.rulesChecked).toEqual(['ssr_title_mismatch', 'rec_content_missing_in_ssr'])
    const observations = []

    for (const variant of ['before', 'after'] as const) {
      const expected = demo[variant]
      const url = `${origin}/${variant}`
      const fetched = await fetcher.fetchPage(url)
      const rendered = await renderer!.renderPage(url, fetched.meta.ttfbMs)

      // The complete public source is exactly the document served in this test.
      expect(fetched.html).toBe(fixtures.get(`/${variant}`))
      expect(fetched.html).toBe(expected.code)
      expect(fetched.statusCode).toBe(200)
      expect(rendered.renderedUrl).toBe(url)

      const context: RuleContext = {
        pageUrl: url,
        finalUrl: fetched.finalUrl,
        oldMeta: null,
        newMeta: fetched.meta,
        oldStatusCode: null,
        newStatusCode: fetched.statusCode,
        renderedMeta: rendered.renderedMeta,
        renderedUrl: rendered.renderedUrl,
        ssrContentLength: fetched.contentLength,
        csrContentLength: rendered.csrContentLength,
      }

      // A disappearing result must mean the fixture was fixed, not that a guard
      // discarded the measurement as blocked rendering or an extreme SSR failure.
      expect(isCsrBlocked(context.renderedMeta, context.csrContentLength)).toBe(false)
      expect(isSsrContentMismatch(context.ssrContentLength, context.csrContentLength)).toBe(false)
      expect(isSsrRenderingFailed(context.ssrContentLength, context.csrContentLength)).toBe(false)
      expect(rendered.renderedMeta.wordCount).toBeGreaterThanOrEqual(300)

      const detectedRules = demo.rulesChecked.flatMap(id => runRule(id, context)).map(result => result.type)
      expect(detectedRules).toEqual(variant === 'before' ? demo.rulesChecked : [])
      expect(detectedRules).toEqual(expected.detectedRules)

      observations.push({
        raw: { title: fetched.meta.title, wordCount: fetched.meta.wordCount },
        rendered: { title: rendered.renderedMeta.title, wordCount: rendered.renderedMeta.wordCount },
      })
    }

    // Both fixtures contain the same article. Only the insertion stage changes.
    const beforeContent = demo.before.code.match(/\.innerHTML = `([\s\S]+)`/)?.[1]
    const afterContent = demo.after.code.match(/<main id="content">\n([\s\S]+)\n<\/main>/)?.[1]
    expect(beforeContent).toBeTruthy()
    expect(afterContent).toBe(beforeContent)
    // Same final title and word count; after contains no injection script.
    expect(observations[0]!.rendered).toEqual(observations[1]!.rendered)
    expect(demo.after.code).not.toContain('<script')
    expect(observations[1]!.raw.title).toBe(observations[1]!.rendered.title)
    // Raw HTML extraction includes <title>; rendered word count uses body.innerText.
    // The public counts preserve those real methods instead of forcing equal totals.
    expect(observations).toEqual([
      { raw: demo.before.raw, rendered: demo.before.rendered },
      { raw: demo.after.raw, rendered: demo.after.rendered },
    ])
  }, 30_000)
})

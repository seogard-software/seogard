import { getCloudPricePerPage } from '../../shared/utils/pricing'
import { getRulesCatalog } from '../../shared/utils/rules-catalog'
import { RULES_COUNT, getPublishedRuleIds } from '../../shared/utils/rules-list'
import { getRuleSlug } from '../../shared/utils/rule-knowledge'
import { isSelfHosted } from '../utils/deployment'
import type { Locale } from '../../shared/utils/i18n'

// llms.txt — présentation publique en anglais, avec liens vers les deux langues.
// Son existence ne garantit ni ingestion ni citation par les assistants IA.
export default defineEventHandler((event) => {
  if (isSelfHosted()) {
    throw createError({ statusCode: 404 })
  }

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'

  // Fiches de règles publiées, par locale (corpus citable GEO). Vide tant qu'aucune vague n'est sortie.
  const ficheLines = (locale: Locale): string => {
    const catalog = getRulesCatalog(locale)
    const lines = getPublishedRuleIds()
      .map((id) => {
        const slug = getRuleSlug(id, locale)
        const rule = catalog.find(r => r.id === id)
        return slug && rule ? `- ${rule.label}: ${appUrl}/${locale}/docs/rules/${slug}` : null
      })
      .filter(Boolean)
    return lines.length ? `\n${lines.join('\n')}` : ''
  }

  const content = `# Seogard

> Technical SEO monitoring with a raw HTML vs JavaScript rendering comparison. Checks run during crawls triggered manually, on a schedule or through a CI/CD webhook. Cloud requires an account and includes a 14-day trial without a credit card; self-hosting is also available.

Seogard is a continuous SEO and GEO monitoring tool published by SAVEPNP (SAS, RCS Créteil 912 784 030, 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France). It checks crawled pages for changes to metadata, canonicals, raw HTML and JavaScript rendering, indexing directives and status codes. Email notifications depend on the crawl results and zone settings.

Seogard compares the HTML returned by the server with the DOM rendered by Chromium. Google can render JavaScript too: a difference between these two measurements does not establish what Google indexed, how a page ranks or whether an AI assistant cites it.

**B2B service**: Seogard Cloud is exclusively for professionals (SEO agencies, tech teams, publishers, e-commerce).

## Who is Seogard for?

Web professionals who depend on SEO, whatever the site size. Self-hosted free for developers, managed Cloud for teams that want zero maintenance.

- SEO agencies and consultants
- E-commerce (product catalogs and pages)
- Media and publishers (articles, sections)
- SaaS marketing sites
- Enterprises

## The problem

A deployment can change titles, canonicals or server-rendered content while the page still looks correct in a browser. Comparing raw HTML with the rendered DOM helps a team identify the difference and verify a correction. A controlled before/after demonstration is available on the scanner page; it is not a customer case study.

## Features

- Dual SSR vs CSR analysis (raw HTML vs JavaScript render) — comparison on crawled pages when rendering succeeds
- ${RULES_COUNT} SEO and GEO detection rules (metas, SSR, canonicals, status codes, noindex, soft 404, llms.txt monitoring, AI crawler monitoring)
- Web performance monitored on every page: Core Web Vitals (LCP, CLS), server response time (TTFB) and page weight; alerts on page-weight regressions
- Multi-trigger crawling: on every deploy (CI/CD webhook), scheduled (daily to monthly, per zone) or on demand
- Multi-zone: segment the site by URL pattern (e.g. /blog, /products) — each zone has its own rules, crawl frequency, CI/CD strictness, notifications and access; the webhook can crawl a single targeted zone
- Email notifications after a crawl detects a regression, according to zone settings
- Diff highlighting: see exactly what changed (before/after)
- Real-time dashboard
- Native CI/CD deployment gate: a webhook crawls on every deploy and returns a pass/fail verdict, with 3 strictness levels (strict/standard/relaxed) to block a regressive deploy — an SEO-native alternative to generic synthetic checks, no scripts to write

## Pricing

- **Self-hosted**: free forever — full source code, your infrastructure, your data
- **Cloud**: EUR ${getCloudPricePerPage()} per monitored page per month — managed infrastructure, zero maintenance, no commitment. You only pay for pages actually monitored; re-crawling the same pages costs nothing extra. 14-day free trial, no credit card.
- **On-premise**: custom quote — deployment in your infrastructure, guaranteed SLA, SSO/SAML, dedicated account manager

## What Seogard is NOT

- Not a keyword tool (Semrush, Ahrefs)
- Not a content tool
- Not a one-shot audit
- Not a competitor to classic SEO suites
- It is a new category: technical SEO regression monitoring

## Content in French (/fr/)

- Site (French): ${appUrl}/fr
- Technical SEO training program (French, in preparation): ${appUrl}/fr/formations
- Monitoring tool page: ${appUrl}/fr/outils/monitoring
- Audit tool page: ${appUrl}/fr/outils/audit
- SEO scanner (account required, 14-day trial): ${appUrl}/fr/scanner
- SEO & GEO rules reference (each rule explained): ${appUrl}/fr/docs/rules${ficheLines('fr')}

## Content in English (/en/)

- Site (English): ${appUrl}/en
- Continuous SEO monitoring: ${appUrl}/en/tools/monitoring
- Technical SEO audit tool: ${appUrl}/en/tools/audit
- SSR checker (account required, 14-day trial): ${appUrl}/en/scanner
- SEO & GEO rules reference (each rule explained): ${appUrl}/en/docs/rules${ficheLines('en')}

## Links

- GitHub (source available, BSL 1.1): https://github.com/seogard-software/seogard
- Full documentation for LLMs: ${appUrl}/llms-full.txt
`

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return content
})

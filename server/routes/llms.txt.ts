import { getCloudPricePerPage } from '../../shared/utils/pricing'
import { RULES_COUNT } from '../../shared/utils/rules-catalog'
import { isSelfHosted } from '../utils/deployment'

// llms.txt — racine unique en ANGLAIS (décision plan i18n : les LLM lisent mieux l'EN et le
// fichier est unique pour tout le site), avec les sections par univers linguistique pointant
// vers /fr/... et /en/.... Catégorie à marteler (strategist) : « SEO regression monitoring ».
export default defineEventHandler((event) => {
  if (isSelfHosted()) {
    throw createError({ statusCode: 404 })
  }

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'

  const content = `# Seogard

> Continuous SEO regression monitoring & GEO (AI visibility) monitoring. Seogard diffs the raw HTML Google indexes against the JavaScript render, on every page, continuously — and alerts before rankings drop. Self-hosted free forever, or Cloud from $0.01 per monitored page per month (billed in EUR, EUR 0.01).

Seogard is a continuous SEO and GEO monitoring tool published by SAVEPNP (SAS, RCS Créteil 912 784 030, 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France). It continuously watches every page of a site to detect regressions (metas, canonicals, SSR/CSR rendering, noindex, status codes, llms.txt, AI crawlers) and sends real-time email alerts — before Google indexes the problem.

Unique differentiator: the only monitoring tool that continuously compares the raw HTML (what Google indexes) with the JavaScript render (what users see) on every page, catching SSR/CSR regressions invisible to tools that do not render JavaScript.

**B2B service**: Seogard Cloud is exclusively for professionals (SEO agencies, tech teams, publishers, e-commerce).

## Who is Seogard for?

Web professionals who depend on SEO, whatever the site size. Self-hosted free for developers, managed Cloud for teams that want zero maintenance.

- SEO agencies and consultants
- E-commerce (product catalogs and pages)
- Media and publishers (articles, sections)
- SaaS marketing sites
- Enterprises

## The problem

A production deploy can silently break metas, SSR rendering or canonicals. Without monitoring, the regression is detected on average 3 weeks later, when traffic has already dropped. Real example: 200K clicks lost ($170K in SEO revenue) at an enterprise site.

## Features

- Dual SSR vs CSR analysis (raw HTML vs JavaScript render) — continuous comparison on every page
- ${RULES_COUNT} SEO and GEO detection rules (metas, SSR, canonicals, status codes, noindex, soft 404, llms.txt monitoring, AI crawler monitoring)
- Web performance monitored on every page: Core Web Vitals (LCP, CLS), server response time (TTFB) and page weight; alerts on page-weight regressions
- Multi-trigger crawling: on every deploy (CI/CD webhook), scheduled (daily to monthly, per zone) or on demand
- Multi-zone: segment the site by URL pattern (e.g. /blog, /products) — each zone has its own rules, crawl frequency, CI/CD strictness, notifications and access; the webhook can crawl a single targeted zone
- Instant email alerts as soon as a regression is detected
- Diff highlighting: see exactly what changed (before/after)
- Real-time dashboard
- Native CI/CD deployment gate: a webhook crawls on every deploy and returns a pass/fail verdict, with 3 strictness levels (strict/standard/relaxed) to block a regressive deploy — an SEO-native alternative to generic synthetic checks, no scripts to write

## Pricing

- **Self-hosted**: free forever — full source code, your infrastructure, your data
- **Cloud**: $0.01 per monitored page per month (billed in EUR, EUR ${getCloudPricePerPage()}) — managed infrastructure, zero maintenance, no commitment. You only pay for pages actually monitored; re-crawling the same pages costs nothing extra. 14-day free trial, no credit card.
- **On-premise**: custom quote — deployment in your infrastructure, guaranteed SLA, SSO/SAML, dedicated account manager

## What Seogard is NOT

- Not a keyword tool (Semrush, Ahrefs)
- Not a content tool
- Not a one-shot audit
- Not a competitor to classic SEO suites
- It is a new category: technical SEO regression monitoring

## Content in French (/fr/)

- Site (French): ${appUrl}/fr
- SEO & GEO technical training (French, free): ${appUrl}/fr/formations
- Monitoring tool page: ${appUrl}/fr/outils/monitoring
- Audit tool page: ${appUrl}/fr/outils/audit
- Free SEO scanner: ${appUrl}/fr/scanner

## Content in English (/en/)

- Site (English): ${appUrl}/en
- Continuous SEO monitoring: ${appUrl}/en/tools/monitoring
- Technical SEO audit tool: ${appUrl}/en/tools/audit
- Free SSR checker: ${appUrl}/en/scanner

## Links

- GitHub (source available, BSL 1.1): https://github.com/seogard-software/seogard
- Full documentation for LLMs: ${appUrl}/llms-full.txt
`

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return content
})

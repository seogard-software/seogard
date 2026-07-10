import { getPriceExamples, getCloudPricePerPage } from '../../shared/utils/pricing'
import { RULES_COUNT, getRulesCatalog } from '../../shared/utils/rules-catalog'
import { getPublishedRuleIds } from '../../shared/utils/rules-list'
import { getRuleSlug } from '../../shared/utils/rule-knowledge'
import { isSelfHosted } from '../utils/deployment'
import type { Locale } from '../../shared/utils/i18n'

// llms-full.txt — documentation complète pour les LLM, racine unique en ANGLAIS (décision plan
// i18n), sections de liens par univers linguistique (/fr/ et /en/). Catégorie martelée :
// « SEO regression monitoring » + termes GEO à placer (GEO monitoring, AI crawler monitoring,
// llms.txt monitoring).
export default defineEventHandler(async (event) => {
  if (isSelfHosted()) {
    throw createError({ statusCode: 404 })
  }

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'
  const examples = getPriceExamples('en')
  const examplesText = examples.map(ex => `- ${ex.label} pages: EUR ${ex.price}/month`).join('\n')

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

  const content = `# Seogard — Full documentation

> Continuous SEO regression monitoring & GEO (AI visibility) monitoring. Real-time regression detection and alerts, before Google. Self-hosted free forever, or Cloud from $0.01 per monitored page per month (billed in EUR, EUR ${getCloudPricePerPage()}).

## Overview

Seogard is a **continuous SEO and GEO monitoring tool** published by SAVEPNP (SAS, RCS Créteil 912 784 030, 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France). Available self-hosted for free (source available under BSL 1.1) or as a managed Cloud (B2B only).

Seogard continuously watches every page of a site and **alerts in real time** by email as soon as a regression is detected — before Google re-renders the pages.

Unique differentiator: Seogard performs a **continuous dual SSR/CSR analysis** on every page (raw HTML vs JavaScript render), catching regressions invisible to tools that do not render JavaScript and to one-shot audit tools (Screaming Frog, Sitebulb).

Unlike classic SEO suites (Semrush, Ahrefs, Screaming Frog) and even existing monitoring tools (Conductor/ContentKing, Lumar), Seogard is the only one offering this native SSR vs CSR comparison. A broken SSR is invisible in a browser — but Google sees an empty page. Seogard catches exactly this kind of invisible regression.

## The problem Seogard solves

Modern sites are complex: SSR, CSR, JavaScript frameworks, microservices, CI/CD with daily deploys. Every production deploy can silently break SEO-critical elements:

- Meta titles and descriptions disappear
- SSR (Server-Side Rendering) breaks and Google no longer sees the content
- Pages accidentally switch to noindex
- Canonicals change or disappear
- Pages start returning 404 or 500 errors

Without automated monitoring, these regressions are detected on average 3 weeks later, when organic traffic has already dropped significantly.

**Real example**: a large French enterprise lost 200,000 clicks ($170K in SEO revenue) because of a broken SSR and missing metas after a deploy. The regression was detected 3 weeks too late.

## Who it is for

Web professionals who depend on SEO, whatever the site size. Cloud is for professionals only (B2B). With the free self-hosted version, any developer can use it. With Cloud at $0.01 per monitored page (billed in EUR), the price naturally scales with volume — you only pay for pages actually monitored each month.

- **Blogs and brochure sites**: free monitoring self-hosted, or a few euros per month on Cloud.
- **E-commerce**: product catalogs, product pages, categories. A meta regression directly impacts revenue.
- **Media and publishers**: articles, sections, author pages. SEO is the main traffic source.
- **SaaS**: marketing sites with many landing pages.
- **Enterprises**: organizations where dev and SEO teams are separate, and frequent deploys make manual monitoring impossible.

## Detailed features

### ${RULES_COUNT} SEO and GEO detection rules

Seogard ships ${RULES_COUNT} detection rules (monitoring + recommendations + GEO) covering the most common and most costly regressions:

**Meta and content:**
- Missing or changed title
- Missing or changed meta description
- Missing or changed canonical
- Missing, duplicated or changed H1
- Missing or changed hreflang
- Missing Open Graph and Twitter Cards

**Indexing:**
- Accidentally added noindex
- Changed robots meta
- Changed X-Robots-Tag

**Status codes:**
- Page switching to 404, 500, 503
- Soft 404 (page returning 200 with error-page content)
- Unexpected redirects

**SSR vs CSR:**
- SSR content significantly different from CSR content
- Failed SSR rendering (empty content)
- SSR title different from CSR title
- SSR meta description different from CSR

**Performance and structure:**
- Sharp page-weight increase (performance regression)
- Removed or changed Schema.org markup

### SSR vs CSR comparison

Seogard performs a dual analysis of every page:
1. **Raw HTTP fetch (SSR)**: fetches the HTML exactly as the server sends it, just like Googlebot
2. **JavaScript render (CSR)**: uses a headless browser (Playwright/Chromium) to execute JavaScript and capture the final DOM

Comparing the two detects when SSR silently breaks — invisible in a regular browser but catastrophic for SEO, because Googlebot does not always see client-rendered content.

### Web performance

Seogard measures the performance of every page on every crawl, on the full render (all resources loaded, Google-like):

- **Core Web Vitals**: LCP (content display) and CLS (visual stability), measured with the official web-vitals library.
- **TTFB**: server response time.
- **Page weight**: total downloaded weight + breakdown (HTML, JS, CSS, images, fonts).

Official Google thresholds (Lighthouse). LCP, CLS and TTFB are **monitored and displayed** (latest measurement + 30-day trend) — measured synthetically they vary too much to be a reliable alert signal; Google itself ranks on field data (CrUX p75). Page weight, however, is deterministic: a sharp increase fires a regression (and can block a deploy in strict mode). It is the only performance regression.

### Crawl frequency

After adding a site, Seogard discovers pages via the sitemap and runs a full initial crawl. Crawls then trigger in three combinable modes: on every deploy (CI/CD webhook), on a schedule (daily to monthly, per zone) and on demand. Every crawled page is analyzed as raw HTML (SSR) and JavaScript render (CSR) to detect gaps.

### Zones — monitoring per site section

A site can be split into zones, each zone being a set of pages defined by URL pattern (e.g. /blog, /products, /checkout). The default zone covers the whole site. Each zone has its own configuration: enabled/disabled SEO/GEO rules, scheduled crawl frequency, CI/CD gate strictness, notifications and per-member access. The deploy webhook targets a specific zone and crawls only it, speeding up CI feedback. You can apply stricter monitoring to critical pages (checkout funnel, category pages) than to the rest of the site — a granularity generic monitoring tools do not offer natively.

### Built-in CI/CD webhook

Seogard integrates with your CI/CD pipeline: a POST webhook triggers a crawl on every deploy, with a GET endpoint to poll the verdict (pass/fail). 3 strictness levels: strict, standard, relaxed.

### Instant alerts

- **Email**: instant alert as soon as a critical issue is detected
- **Severity levels**: critical (immediate action), warning (watch), info (non-critical change)
- **Diff highlighting**: every alert shows exactly what changed (before/after) with highlighted differences

### Dashboard

The dashboard gives a real-time overview:
- All your sites with their SEO health
- Crawl history with live progress
- Alerts grouped by severity with diff highlighting
- Crawled pages with their latest status

## Technical architecture

Seogard is built with:
- **Nuxt 4** (Vue 3) for the frontend and API
- **MongoDB** for the database
- **Playwright** (headless Chromium) for CSR rendering
- **Redis** for the crawl queue

Crawl workers run on dedicated servers with 16 vCPU and 32 GB RAM, able to process 300,000 pages overnight for the initial crawl, then 30,000 pages in about 1 hour for scheduled crawls.

The full source code is available on GitHub for the self-hosted version.

## Pricing

3 plans:

| Plan | Price | Details |
|------|-------|---------|
| Self-hosted | Free forever | Full source code, your infrastructure, your data, GitHub community, free updates |
| Cloud | $0.01 per monitored page per month (billed in EUR, EUR ${getCloudPricePerPage()}) | Managed infrastructure, zero maintenance, email/webhook alerts, priority support, built-in CI/CD webhook, no commitment. You only pay for pages actually monitored — re-crawling the same pages costs nothing extra. 14-day free trial, no credit card. |
| On-premise | Custom quote | Deployment in your infrastructure, guaranteed SLA, dedicated account manager, SSO/SAML, team training |

**Cloud price examples:**
${examplesText}

## Use cases

1. **Pre-production checks**: run a crawl before going live to verify 0 SEO regressions
2. **Post-deploy**: immediate alert if a release breaks something
3. **Continuous monitoring**: daily monitoring for enterprises with frequent deploys
4. **Self-hosted**: host Seogard on your own infrastructure, keep full control of your data

## Competitors and positioning

| Tool | Price | Positioning |
|------|-------|-------------|
| Screaming Frog | EUR 199/year | One-shot audit, no continuous monitoring |
| SEORadar | USD 199-999/month | Change monitoring, US-focused |
| Conductor (ex-ContentKing) | USD 139-1279/month | Continuous monitoring, no SSR/CSR |
| Lumar (ex-DeepCrawl) | USD 1200-4000/month | Enterprise, technical audit |
| **Seogard** | **Free (self-hosted) / $0.01 per page (Cloud)** | **Technical SEO regression monitoring, SSR/CSR, self-hosted or Cloud** |

Seogard stands out with:
- **Native dual SSR/CSR analysis** — continuous comparison of raw HTML and JavaScript render on every page
- **Free self-hosted** — source available under BSL 1.1 (becomes Apache 2.0 in 2029)
- Exclusive focus on regressions (not a generalist suite)
- Instant alerts with diff highlighting (highlighted before/after)
- ${RULES_COUNT} detection rules specific to SEO and GEO regressions
- Built-in CI/CD webhook (3 levels: strict / standard / relaxed)
- Transparent usage-based pricing: you only pay for monitored pages (Cloud), or nothing (self-hosted)

## Technical SEO & GEO training (French)

Seogard publishes training courses on technical SEO and GEO (AI visibility): SSR/CSR rendering, AI crawlers (ChatGPT, Perplexity), llms.txt, structured data, FAQ and citation signals, SEO regressions and the CI/CD gate. Free, accessible without coding. Currently in French.

- Training (French): ${appUrl}/fr/formations

## Content in French (/fr/)

- Site (French): ${appUrl}/fr
- Training: ${appUrl}/fr/formations
- Monitoring tool page: ${appUrl}/fr/outils/monitoring
- Audit tool page: ${appUrl}/fr/outils/audit
- Free SEO scanner: ${appUrl}/fr/scanner
- SEO & GEO rules reference (each rule explained): ${appUrl}/fr/docs/rules${ficheLines('fr')}
- Terms (CGU): ${appUrl}/fr/legal/cgu
- Sales terms (CGV): ${appUrl}/fr/legal/cgv
- Privacy: ${appUrl}/fr/legal/privacy

## Content in English (/en/)

- Site (English): ${appUrl}/en
- Continuous SEO monitoring: ${appUrl}/en/tools/monitoring
- Technical SEO audit tool: ${appUrl}/en/tools/audit
- Free SSR checker: ${appUrl}/en/scanner
- SEO & GEO rules reference (each rule explained): ${appUrl}/en/docs/rules${ficheLines('en')}

## Links

- GitHub: https://github.com/seogard-software/seogard
- Short version: ${appUrl}/llms.txt

## Legal information

- **Publisher**: SAVEPNP, SAS with a capital of EUR 1,000
- **RCS**: Créteil 912 784 030 — SIRET 912 784 030 00021
- **VAT**: FR04912784030
- **Head office**: 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France
- **Director**: Aadil TALBI
- **B2B service only**: for professionals only
- **Terms (French)**: ${appUrl}/fr/legal/cgu
- **Sales terms (French)**: ${appUrl}/fr/legal/cgv
- **Privacy (French)**: ${appUrl}/fr/legal/privacy
- **Contact**: legal@${(() => { try { return new URL(appUrl).hostname } catch { return 'seogard.io' } })()}
`

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return content
})

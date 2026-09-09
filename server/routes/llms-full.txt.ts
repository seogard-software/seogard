import { getPriceExamples, getCloudPricePerPage } from '../../shared/utils/pricing'
import { getRulesCatalog } from '../../shared/utils/rules-catalog'
import { RULES_COUNT, getPublishedRuleIds } from '../../shared/utils/rules-list'
import { getRuleSlug } from '../../shared/utils/rule-knowledge'
import { isSelfHosted } from '../utils/deployment'
import type { Locale } from '../../shared/utils/i18n'

// llms-full.txt — présentation publique détaillée, cohérente avec les pages produit.
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

> Technical SEO monitoring with a raw HTML vs JavaScript rendering comparison. Checks run during crawls triggered manually, on a schedule or through a CI/CD webhook. Cloud requires an account and includes a 14-day trial without a credit card; self-hosting is also available.

## Overview

Seogard is a **continuous SEO and GEO monitoring tool** published by SAVEPNP (SAS, RCS Créteil 912 784 030, 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France). Available self-hosted for free (source available under BSL 1.1) or as a managed Cloud (B2B only).

Seogard checks pages during each crawl and can notify the team by email when the crawl detects a regression, according to the zone settings. It does not guarantee detection before a search engine visits the page.

Seogard compares the raw HTML returned by the server with the DOM rendered by Chromium. Google can also render JavaScript. The comparison identifies technical differences to investigate; it does not reveal Google’s index, establish a ranking penalty or measure AI citations.

## The problem Seogard solves

Modern sites are complex: SSR, CSR, JavaScript frameworks, microservices, CI/CD with daily deploys. Every production deploy can silently break SEO-critical elements:

- Meta titles and descriptions disappear
- Main content disappears from the server HTML and depends on JavaScript rendering
- Pages accidentally switch to noindex
- Canonicals change or disappear
- Pages start returning 404 or 500 errors

The scanner page includes a controlled before/after demonstration, tested with the crawler, for a title mismatch and main content missing from raw HTML. This demonstrates the checks, not traffic recovery or a customer outcome.

## Who it is for

Web professionals who depend on SEO, whatever the site size. Cloud is for professionals only (B2B). With the free self-hosted version, any developer can use it. With Cloud at EUR ${getCloudPricePerPage()} per monitored page per month, the price naturally scales with volume — you only pay for pages actually monitored each month.

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
1. **Raw HTTP fetch (SSR)**: fetches the HTML exactly as the server sends it, before JavaScript execution
2. **JavaScript render (CSR)**: uses a headless browser (Playwright/Chromium) to execute JavaScript and capture the final DOM

Comparing the two can identify missing server-rendered content or metadata differences. Interpret the result alongside rendering errors and the page’s intended behavior. Use Search Console separately to inspect Google’s crawl and indexing information.

### Web performance

When rendering succeeds, Seogard records synthetic performance measurements from its Chromium session:

- **Core Web Vitals**: LCP (content display) and CLS (visual stability), measured with the official web-vitals library.
- **TTFB**: server response time.
- **Page weight**: total downloaded weight + breakdown (HTML, JS, CSS, images, fonts).

LCP, CLS and TTFB are **monitored and displayed** (latest measurement + 30-day trend). These synthetic readings are not a substitute for real-user Core Web Vitals. Page weight is the performance metric with a regression rule; results can vary with the resources served during a crawl.

### Crawl frequency

After adding a site, Seogard discovers pages via the sitemap and runs a full initial crawl. Crawls then trigger in three combinable modes: on every deploy (CI/CD webhook), on a schedule (daily to monthly, per zone) and on demand. Every crawled page is analyzed as raw HTML (SSR) and JavaScript render (CSR) to detect gaps.

### Zones — monitoring per site section

A site can be split into zones, each zone being a set of pages defined by URL pattern (e.g. /blog, /products, /checkout). The default zone covers the whole site. Each zone has its own configuration: enabled/disabled SEO/GEO rules, scheduled crawl frequency, CI/CD gate strictness, notifications and per-member access. The deploy webhook targets a specific zone and crawls only it, speeding up CI feedback. You can apply stricter monitoring to critical pages (checkout funnel, category pages) than to the rest of the site.

### Built-in CI/CD webhook

Seogard integrates with your CI/CD pipeline: a POST webhook triggers a crawl on every deploy, with a GET endpoint to poll the verdict (pass/fail). 3 strictness levels: strict, standard, relaxed.

### Crawl notifications

- **Email**: notifications after a crawl, subject to notification settings
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

Crawl duration depends on the number of pages, server responses, JavaScript rendering and worker capacity. No fixed completion time is promised.

The full source code is available on GitHub for the self-hosted version.

## Pricing

3 plans:

| Plan | Price | Details |
|------|-------|---------|
| Self-hosted | Free forever | Full source code, your infrastructure, your data, GitHub community, free updates |
| Cloud | EUR ${getCloudPricePerPage()} per monitored page per month | Managed infrastructure, zero maintenance, email/webhook alerts, priority support, built-in CI/CD webhook, no commitment. You only pay for pages actually monitored — re-crawling the same pages costs nothing extra. 14-day free trial, no credit card. |
| On-premise | Custom quote | Deployment in your infrastructure, guaranteed SLA, dedicated account manager, SSO/SAML, team training |

**Cloud price examples:**
${examplesText}

## Use cases

1. **Pre-production checks**: run a crawl before going live to check the enabled rules against the current crawl and available baseline
2. **Post-deploy**: trigger a crawl and inspect detected regressions
3. **Continuous monitoring**: daily monitoring for enterprises with frequent deploys
4. **Self-hosted**: host Seogard on your own infrastructure, keep full control of your data

## Positioning

Seogard stands out with:
- **Raw HTML and JavaScript rendering comparison** — during crawls, when rendering succeeds
- **Free self-hosted** — source available under BSL 1.1 (becomes Apache 2.0 in 2029)
- Exclusive focus on regressions (not a generalist suite)
- Crawl notifications with highlighted before/after differences
- ${RULES_COUNT} detection rules specific to SEO and GEO regressions
- Built-in CI/CD webhook (3 levels: strict / standard / relaxed)
- Transparent usage-based pricing: you only pay for monitored pages (Cloud), or nothing (self-hosted)

## Technical SEO & GEO training (French)

The training program is in preparation. No course is currently available. Published SEO rule guides and the controlled SSR demonstration can already be read without an account. Using the scanner requires an account and starts a 14-day Cloud trial.

- Training (French): ${appUrl}/fr/formations

## Content in French (/fr/)

- Site (French): ${appUrl}/fr
- Training: ${appUrl}/fr/formations
- Monitoring tool page: ${appUrl}/fr/outils/monitoring
- Audit tool page: ${appUrl}/fr/outils/audit
- SEO scanner (account required, 14-day trial): ${appUrl}/fr/scanner
- SEO & GEO rules reference (each rule explained): ${appUrl}/fr/docs/rules${ficheLines('fr')}
- Terms (CGU): ${appUrl}/fr/legal/cgu
- Sales terms (CGV): ${appUrl}/fr/legal/cgv
- Privacy: ${appUrl}/fr/legal/privacy

## Content in English (/en/)

- Site (English): ${appUrl}/en
- Continuous SEO monitoring: ${appUrl}/en/tools/monitoring
- Technical SEO audit tool: ${appUrl}/en/tools/audit
- SSR checker (account required, 14-day trial): ${appUrl}/en/scanner
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

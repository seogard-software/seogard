import { test, expect } from '@playwright/test'
import { getRuleSlug } from '../../../shared/utils/rule-knowledge'
import { gotoHydrated } from '../../helpers/hydration'

// Public acquisition must work before login, in both languages and without client rendering.
test.use({ storageState: { cookies: [], origins: [] } })
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'owner', 'Public journey runs once, with an anonymous context')
})

for (const locale of ['fr', 'en'] as const) {
  test(`${locale}: server HTML exposes the demonstration and both localized guides`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    try {
      const response = await page.goto(`http://localhost:3333/${locale}/demo/ssr`)
      expect(response?.status()).toBe(200)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('#demo-example-title')).toBeVisible()
      await page.locator('.ssr-demo__evidence > summary').click()
      await expect(page.locator('.ssr-demo__measurements article')).toHaveCount(2)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `http://localhost:3333/${locale}/demo/ssr`)
      await expect(page.locator('link[rel="alternate"][hreflang="' + (locale === 'fr' ? 'en' : 'fr') + '"]')).toHaveAttribute('href', `http://localhost:3333/${locale === 'fr' ? 'en' : 'fr'}/demo/ssr`)
      await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/)
      for (const id of ['ssr_title_mismatch', 'rec_content_missing_in_ssr']) {
        const path = `/${locale}/docs/rules/${getRuleSlug(id, locale)}`
        await expect(page.locator(`.ssr-demo a[href="${path}"]`)).toBeVisible()
        await page.goto(`http://localhost:3333${path}`)
        await expect(page.locator('h1')).toHaveCount(1)
        await expect(page.locator(`a[href="/${locale}/demo/ssr"]`)).toBeVisible()
        await expect(page.locator('article a[href^="https://developers.google.com/search/docs/"]').first()).toBeVisible()
        const other = locale === 'fr' ? 'en' : 'fr'
        await expect(page.locator(`link[rel="alternate"][hreflang="${other}"]`)).toHaveAttribute('href', `http://localhost:3333/${other}/docs/rules/${getRuleSlug(id, other)}`)
        const structured = await page.locator('script[type="application/ld+json"]').allTextContents()
        expect(structured.some(value => value.includes('"dateModified":"2026-09-08"'))).toBeTruthy()
        await page.goto(`http://localhost:3333/${locale}/demo/ssr`)
        await page.locator('.ssr-demo__evidence > summary').click()
      }
      for (const tool of ['audit', 'monitoring']) {
        const path = `/${locale}/${locale === 'fr' ? 'outils' : 'tools'}/${tool}`
        await page.goto(`http://localhost:3333${path}`)
        await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `http://localhost:3333${path}`)
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `http://localhost:3333/og-image${locale === 'en' ? '-en' : ''}.png`)
      }
    }
    finally {
      await context.close()
    }
  })

  test(`${locale}: mobile scanner preserves the URL, explains the trial, and starts a crawl after registration`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoHydrated(page, `/${locale}/scanner`)
    const site = `seo-acquisition-${locale}.example`
    const bar = page.locator('.scan-bar').first()
    await expect(bar.locator('.scan-bar__consent')).toContainText('14')
    await bar.getByRole('textbox').fill(site)
    await bar.getByRole('button', { name: locale === 'fr' ? 'Analyser' : 'Scan site', exact: true }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    const close = modal.getByRole('button', { name: locale === 'fr' ? 'Fermer' : 'Close', exact: true })
    await expect(close).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(modal.getByRole('link', { name: locale === 'fr' ? 'Se connecter' : 'Sign in', exact: true })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await expect(modal).toContainText(locale === 'fr' ? "14 jours d'essai" : '14-day free trial')
    expect(await page.evaluate(() => localStorage.getItem('seogard:pendingScan'))).toBe(`https://${site}`)
    // Abandon clears the pending action; reopening still uses the entered URL.
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
    await expect(bar.getByRole('button', { name: locale === 'fr' ? 'Analyser' : 'Scan site', exact: true })).toBeFocused()
    expect(await page.evaluate(() => localStorage.getItem('seogard:pendingScan'))).toBeNull()
    await bar.getByRole('button', { name: locale === 'fr' ? 'Analyser' : 'Scan site', exact: true }).click()
    await modal.getByLabel('Email', { exact: true }).fill(`acquisition-${locale}@seogard-test.example`)
    await modal.getByLabel(locale === 'fr' ? 'Mot de passe' : 'Password', { exact: true }).fill('Local-only-test-password-2026')
    await modal.getByRole('checkbox').check()
    if (process.env.SEO_QA_DIR) await page.screenshot({ path: `${process.env.SEO_QA_DIR}/${locale}-registration-mobile.png` })
    const scan = page.waitForResponse(response => response.url().endsWith('/api/scan') && response.request().method() === 'POST')
    await modal.getByRole('button', { name: locale === 'fr' ? 'Créer un compte' : 'Create an account', exact: true }).click()
    const response = await scan
    expect(response.ok()).toBeTruthy()
    expect(response.request().postDataJSON()).toEqual({ url: `https://${site}` })
    const result = await response.json()
    expect(result.created).toBe(true)
    expect(result.crawlId).toBeTruthy()
    await page.waitForURL(`**/dashboard/sites/${result.siteId}/**`, { timeout: 20_000 })
    expect(await page.evaluate(() => localStorage.getItem('seogard:pendingScan'))).toBeNull()
  })

  test(`${locale}: evidence remains readable on mobile and formations links to available content`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoHydrated(page, `/${locale}/demo/ssr`)
    await expect(page.locator('.cookie-banner')).toHaveCount(0)
    await page.locator('.cookie-consent').getByRole('button', { name: locale === 'fr' ? 'Refuser' : 'Decline', exact: true }).click()
    await expect(page.locator('.cookie-consent')).not.toBeVisible()
    await page.locator('.ssr-demo__evidence > summary').click()
    await page.locator('.ssr-demo__source > summary').first().click()
    await expect(page.locator('.ssr-demo pre').first()).toBeVisible()
    const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: innerWidth }))
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1)
    if (process.env.SEO_QA_DIR) await page.locator('.ssr-demo').screenshot({ path: `${process.env.SEO_QA_DIR}/${locale}-demo-mobile.png` })
    await gotoHydrated(page, `/${locale}/formations`)
    // The program is not published: both CTAs must lead to existing localized resources.
    const links = page.locator('main a')
    await expect(links.filter({ hasText: locale === 'fr' ? 'Lire les guides SEO' : 'Read the SEO guides' }).first()).toHaveAttribute('href', `/${locale}/docs/rules`)
    await expect(page.locator(`main a[href="/${locale}/scanner"]`).first()).toBeVisible()
    const structured = await page.locator('script[type="application/ld+json"]').allTextContents()
    expect(structured.some(value => /"@type"\s*:\s*"Course"/.test(value))).toBeFalsy()
    if (process.env.SEO_QA_DIR) {
      await page.setViewportSize({ width: 1440, height: 1000 })
      await gotoHydrated(page, `/${locale}/scanner`)
      await page.screenshot({ path: `${process.env.SEO_QA_DIR}/${locale}-scanner-desktop.png` })
      await page.locator('#ssr-demo').screenshot({ path: `${process.env.SEO_QA_DIR}/${locale}-demo-desktop.png` })
      await gotoHydrated(page, `/${locale}`)
      await page.screenshot({ path: `${process.env.SEO_QA_DIR}/${locale}-home-desktop.png` })
      await page.locator('#compare').screenshot({ path: `${process.env.SEO_QA_DIR}/${locale}-comparison-desktop.png` })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.screenshot({ path: `${process.env.SEO_QA_DIR}/${locale}-comparison-mobile.png` })
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391)
    }
  })
}

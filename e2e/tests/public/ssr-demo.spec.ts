import { test, expect } from '@playwright/test'
import demo from '../../../shared/data/ssr-demo.json' with { type: 'json' }
import { gotoHydrated } from '../../helpers/hydration'

test.use({ storageState: { cookies: [], origins: [] } })
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'owner', 'Public demo runs once with an anonymous visitor')
})

for (const locale of ['fr', 'en'] as const) {
  test(locale + ': sample renders identically after the fix, with isolated scripts and keyboard controls', async ({ page }) => {
    await gotoHydrated(page, '/' + locale)
    await page.locator('.cookie-consent').getByRole('button', { name: locale === 'fr' ? 'Refuser' : 'Decline', exact: true }).click()
    await expect(page.locator('.cookie-consent')).not.toBeVisible()
    await page.locator('a[href="/' + locale + '/demo/ssr"]').click()
    await page.waitForURL('**/' + locale + '/demo/ssr')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'http://localhost:3333/' + locale + '/demo/ssr')
    const preview = page.frameLocator('.ssr-demo__frame')
    await expect(preview.locator('h1')).toHaveText('SSR demonstration')
    const originalText = await preview.locator('body').innerText()
    expect(originalText.trim().split(/\s+/)).toHaveLength(demo.before.rendered.wordCount)
    await expect(page.locator('.ssr-demo__verdict strong')).toHaveText('2')
    // The real script executes, but cannot access the parent document or issue network requests.
    expect(await preview.locator('body').evaluate(() => {
      try { return !!window.parent.document.body }
      catch { return false }
    })).toBe(false)
    let externalRequests = 0
    await page.route('https://demo-network.example/**', async (route) => {
      externalRequests++
      await route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, body: 'allowed' })
    })
    expect(await preview.locator('body').evaluate(async () => {
      try { await fetch('https://demo-network.example/probe'); return true }
      catch { return false }
    })).toBe(false)
    expect(externalRequests).toBe(0)
    const after = page.getByRole('button', { name: locale === 'fr' ? 'Après correction' : 'After the fix', exact: true })
    await after.focus()
    await page.keyboard.press('Enter')
    await expect(after).toHaveAttribute('aria-pressed', 'true')
    await expect(after).toBeFocused()
    await expect(page.locator('.ssr-demo__verdict strong')).toHaveText('0')
    await expect(page.locator('.ssr-demo__scope')).toContainText(locale === 'fr' ? '0 écart' : '0 differences')
    await expect(preview.locator('body')).toHaveText(originalText)
    await expect.poll(() => preview.locator('body').evaluate(() => document.title)).toBe(demo.after.rendered.title)
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1)
    }
    await page.goBack()
    await expect(page).toHaveURL(new RegExp('/' + locale + '$'))
    await expect(page.locator('a[href="/' + locale + '/demo/ssr"]')).toBeInViewport()
  })

  test(locale + ': legacy anchor stays below the header and the demo starts the existing signup flow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoHydrated(page, '/' + locale + '/scanner#ssr-demo')
    await page.locator('.cookie-consent').getByRole('button', { name: locale === 'fr' ? 'Refuser' : 'Decline', exact: true }).click()
    await expect(page.locator('.cookie-consent')).not.toBeVisible()
    const top = () => page.evaluate(() => ({
      target: document.querySelector('#ssr-demo')!.getBoundingClientRect().top,
      header: document.querySelector('.layout-landing__header')!.getBoundingClientRect().bottom,
    }))
    await expect.poll(async () => { const position = await top(); return position.target - position.header }).toBeGreaterThanOrEqual(12)
    await expect(page.locator('#ssr-demo-title')).toBeInViewport()
    await page.locator('#ssr-demo a').click()
    await page.waitForURL('**/' + locale + '/demo/ssr')
    const bar = page.locator('#analyser .scan-bar')
    await bar.getByRole('textbox').fill('demo-signup.example')
    await bar.getByRole('button', { name: locale === 'fr' ? 'Analyser' : 'Scan site', exact: true }).click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal.getByLabel('Email', { exact: true })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('seogard:pendingScan'))).toBe('https://demo-signup.example')
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
    await expect(bar.getByRole('button', { name: locale === 'fr' ? 'Analyser' : 'Scan site', exact: true })).toBeFocused()
    expect(await page.evaluate(() => localStorage.getItem('seogard:pendingScan'))).toBeNull()
  })
}

import { test, expect } from '@playwright/test'
import { getTestIds } from '../../helpers/constants'

const ids = getTestIds()
const zonePageUrl = `/dashboard/sites/${ids.siteId}/zones/${ids.defaultZoneId}/pages`

test.describe('Zone permissions — pages visibility', () => {
  test('page loads without error', async ({ page }) => {
    await page.goto(zonePageUrl)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('zone-denied')).not.toBeVisible()
  })
})

test.describe('Crawl button visibility', () => {
  test('owner sees crawl button', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    await page.goto(zonePageUrl)
    await expect(page.getByTestId('crawl-button')).toBeVisible({ timeout: 15_000 })
  })

  test('admin sees crawl button', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-admin')
    await page.goto(zonePageUrl)
    await expect(page.getByTestId('crawl-button')).toBeVisible({ timeout: 15_000 })
  })

  test('member sees crawl button', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-member')
    await page.goto(zonePageUrl)
    await expect(page.getByTestId('crawl-button')).toBeVisible({ timeout: 15_000 })
  })

  test('viewer does NOT see crawl button', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-viewer')
    await page.goto(zonePageUrl)
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('crawl-button')).not.toBeVisible()
  })
})

test.describe('Sidebar links visibility', () => {
  test('owner sees webhook and members links in sidebar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    await page.goto(zonePageUrl)
    await page.waitForLoadState('networkidle')
    // Expand the default zone in sidebar
    const zoneBtn = page.locator('.app-sidebar__zone-btn').first()
    await zoneBtn.click()
    await expect(page.locator('a:has-text("Webhook")')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('a:has-text("Membres")')).toBeVisible()
  })

  test('admin sees webhook and members links in sidebar', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-admin')
    await page.goto(zonePageUrl)
    await page.waitForLoadState('networkidle')
    const zoneBtn = page.locator('.app-sidebar__zone-btn').first()
    await zoneBtn.click()
    await expect(page.locator('a:has-text("Webhook")')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('a:has-text("Membres")')).toBeVisible()
  })

  test('member does NOT see webhook and members links', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-member')
    await page.goto(zonePageUrl)
    await page.waitForLoadState('networkidle')
    const zoneBtn = page.locator('.app-sidebar__zone-btn').first()
    await zoneBtn.click()
    // Wait for sub-links to render
    await expect(page.locator('a:has-text("Overview")')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('a:has-text("Webhook")')).not.toBeVisible()
    await expect(page.locator('a:has-text("Membres")')).not.toBeVisible()
  })

  test('viewer does NOT see webhook and members links', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-viewer')
    await page.goto(zonePageUrl)
    await page.waitForLoadState('networkidle')
    const zoneBtn = page.locator('.app-sidebar__zone-btn').first()
    await zoneBtn.click()
    await expect(page.locator('a:has-text("Overview")')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('a:has-text("Webhook")')).not.toBeVisible()
    await expect(page.locator('a:has-text("Membres")')).not.toBeVisible()
  })
})

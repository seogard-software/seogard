import { test, expect } from '@playwright/test'
import { getTestIds } from '../../helpers/constants'
import fs from 'node:fs'

const ids = getTestIds()

function getCookiesFromStorage(authFile: string): string {
  const storage = JSON.parse(fs.readFileSync(authFile, 'utf-8'))
  return storage.cookies
    .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
    .join('; ')
}

const BASE = 'http://localhost:3333'

async function apiCall(request: any, authFile: string, method: string, url: string) {
  const cookies = getCookiesFromStorage(authFile)
  return request.fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/json',
    },
  })
}

// --- API: Trial expired user gets 403 on crawl ---

test.describe('Trial billing — API', () => {
  test('expired trial user gets 403 on crawl', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'trial-expired')
    const res = await apiCall(
      request,
      'e2e/.auth/trialExpired.json',
      'POST',
      `/api/sites/${ids.trialSiteId}/zones/${ids.trialDefaultZoneId}/crawl`,
    )
    expect(res.status()).toBe(403)
  })

  test('active trial user can trigger crawl', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'trial-active')
    const res = await apiCall(
      request,
      'e2e/.auth/trialActive.json',
      'POST',
      `/api/sites/${ids.trialSiteId}/zones/${ids.trialDefaultZoneId}/crawl`,
    )
    // 200 or 201 = authorized
    expect([200, 201]).toContain(res.status())
  })
})

// --- UI: Billing page shows trial status ---

test.describe('Trial billing — UI', () => {
  test('expired trial user sees "essai terminé" on billing page', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'trial-expired')
    await page.goto(`/dashboard/organizations/${ids.trialOrgId}/billing`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('essai', { exact: false })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('terminé', { exact: false })).toBeVisible()
    await expect(page.getByText('Activer la facturation')).toBeVisible()
  })

  test('active trial user sees days remaining on billing page', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'trial-active')
    await page.goto(`/dashboard/organizations/${ids.trialOrgId}/billing`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Essai gratuit', { exact: false })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('restant', { exact: false })).toBeVisible()
  })

  test('expired trial user sees billing banner on zone pages', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'trial-expired')
    await page.goto(`/dashboard/sites/${ids.trialSiteId}/zones/${ids.trialDefaultZoneId}/pages`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('essai de 14 jours est terminé', { exact: false })).toBeVisible({ timeout: 15_000 })
  })
})

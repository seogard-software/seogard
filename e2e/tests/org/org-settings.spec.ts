import { test, expect } from '@playwright/test'
import { getTestIds } from '../../helpers/constants'

const ids = getTestIds()
const settingsUrl = `/dashboard/organizations/${ids.orgId}/settings`

test.describe('Org settings access by role', () => {
  test('owner can access settings and sees form', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    await page.goto(settingsUrl)
    await page.waitForLoadState('networkidle')
    // Owner should see the settings form with org name
    await expect(page.getByText('Nom')).toBeVisible({ timeout: 15_000 })
  })

  test('non-owner does not see danger zone actions', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-admin')
    await page.goto(settingsUrl)
    await page.waitForLoadState('networkidle')
    // Non-owner should NOT see the "Supprimer l'organisation" button
    await expect(page.getByText(/supprimer.*organisation/i)).not.toBeVisible()
  })
})

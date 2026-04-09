import { test as setup, expect } from '@playwright/test'
import { USERS, TEST_PASSWORD } from './helpers/constants'
import type { UserKey } from './helpers/constants'

const userKeys: UserKey[] = ['owner', 'admin', 'member', 'viewer', 'trialExpired', 'trialActive']

for (const key of userKeys) {
  setup(`authenticate as ${key}`, async ({ page }) => {
    const { email } = USERS[key]

    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    // Step 1: Enter email
    const emailInput = page.getByPlaceholder('votre@email.com')
    await expect(emailInput).toBeVisible({ timeout: 15_000 })
    await emailInput.fill(email)
    await page.getByRole('button', { name: 'Continuer' }).click()

    // Step 2: Wait for password field to appear
    const passwordInput = page.getByPlaceholder('Votre mot de passe')
    await expect(passwordInput).toBeVisible({ timeout: 15_000 })
    await passwordInput.fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Se connecter' }).click()

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard/**', { timeout: 30_000 })

    // Save storage state
    await page.context().storageState({ path: `e2e/.auth/${key}.json` })
  })
}

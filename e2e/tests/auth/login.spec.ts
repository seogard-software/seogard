import { test, expect } from '@playwright/test'
import { USERS, TEST_PASSWORD } from '../../helpers/constants'

// Login tests run without storageState (anonymous) and only in owner project
test.use({ storageState: { cookies: [], origins: [] } })

test('login happy path redirects to dashboard', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'owner')
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  // Step 1: email
  await page.getByPlaceholder('votre@email.com').fill(USERS.owner.email)
  await page.getByRole('button', { name: 'Continuer' }).click()

  // Step 2: password
  await expect(page.getByPlaceholder('Votre mot de passe')).toBeVisible({ timeout: 15_000 })
  await page.getByPlaceholder('Votre mot de passe').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await page.waitForURL('**/dashboard/**', { timeout: 15_000 })
  expect(page.url()).toContain('/dashboard')
})

test('wrong password shows error', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'owner')
  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.getByPlaceholder('votre@email.com').fill(USERS.owner.email)
  await page.getByRole('button', { name: 'Continuer' }).click()

  await expect(page.getByPlaceholder('Votre mot de passe')).toBeVisible({ timeout: 15_000 })
  await page.getByPlaceholder('Votre mot de passe').fill('WrongPassword!')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  // Should show error message
  await expect(page.getByText(/incorrect|invalide|erreur/i)).toBeVisible({ timeout: 5_000 })
})

test('protected route without auth redirects to login', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'owner')
  await page.goto('/dashboard/sites')
  await page.waitForURL('**/login', { timeout: 10_000 })
  expect(page.url()).toContain('/login')
})

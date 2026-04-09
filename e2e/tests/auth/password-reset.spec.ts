import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3333'

test.describe('Password reset — API', () => {
  test('POST /api/auth/forgot-password accepts valid email', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/forgot-password`, {
      data: { email: 'owner@test-seogard.io' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(true)
  })

  test('POST /api/auth/forgot-password accepts unknown email (no enumeration)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/forgot-password`, {
      data: { email: 'nobody@doesnotexist.com' },
    })
    // Must return 200 to prevent email enumeration
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.sent).toBe(true)
  })

  test('POST /api/auth/forgot-password rejects missing email', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/forgot-password`, {
      data: {},
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/auth/reset-password rejects invalid token', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/reset-password`, {
      data: { token: 'fake-invalid-token', password: 'newpassword123' },
    })
    expect(res.status()).toBe(400)
  })

  test('POST /api/auth/reset-password rejects short password', async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/reset-password`, {
      data: { token: 'some-token', password: 'short' },
    })
    expect(res.status()).toBe(400)
  })
})

test.describe('Password reset — UI', () => {
  test('forgot password page is accessible', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByText('Mot de passe oublié')).toBeVisible()
    await expect(page.getByPlaceholder('vous@exemple.com')).toBeVisible()
  })

  test('forgot password shows confirmation after submit', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByPlaceholder('vous@exemple.com').fill('owner@test-seogard.io')
    await page.getByRole('button', { name: 'Envoyer le lien' }).click()
    await expect(page.getByText('Email envoyé')).toBeVisible({ timeout: 10_000 })
  })

  test('reset password page shows error for invalid token', async ({ page }) => {
    await page.goto('/reset-password?token=invalid')
    await page.getByPlaceholder('8 caractères minimum').fill('newpassword123')
    await page.getByPlaceholder('Retapez votre mot de passe').fill('newpassword123')
    await page.getByRole('button', { name: 'Réinitialiser le mot de passe' }).click()
    await expect(page.getByText('expiré', { exact: false })).toBeVisible({ timeout: 10_000 })
  })

  test('login page has forgot password link', async ({ page }) => {
    await page.goto('/login')
    // Enter email to get to password step
    await page.getByPlaceholder('votre@email.com').fill('owner@test-seogard.io')
    await page.getByRole('button', { name: 'Continuer' }).click()
    await expect(page.getByText('Mot de passe oublié')).toBeVisible({ timeout: 10_000 })
  })
})

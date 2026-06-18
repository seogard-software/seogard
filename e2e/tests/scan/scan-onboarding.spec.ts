import { test, expect } from '@playwright/test'
import { getTestIds } from '../../helpers/constants'
import fs from 'node:fs'

const ids = getTestIds()
const BASE = 'http://localhost:3333'

function cookies(authFile: string): string {
  const storage = JSON.parse(fs.readFileSync(authFile, 'utf-8'))
  return storage.cookies.map((c: { name: string, value: string }) => `${c.name}=${c.value}`).join('; ')
}

// Tout le parcours scan est testé avec la session OWNER (a une orga active + un site example.com).
test.describe('Scan onboarding — barre Analyser', () => {
  test.beforeEach((_, testInfo) => {
    test.skip(testInfo.project.name !== 'owner', 'Parcours testé avec la session owner')
  })

  // ─────────────── API /api/scan ───────────────

  test('API : site déjà présent → existing, renvoie CE site (pas de re-crawl)', async ({ request }) => {
    const res = await request.fetch(`${BASE}/api/scan`, {
      method: 'POST',
      headers: { Cookie: cookies('e2e/.auth/owner.json'), 'Content-Type': 'application/json', 'x-org-id': ids.orgId },
      data: { url: 'https://example.com' },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.existing).toBe(true)
    expect(body.siteId).toBe(ids.siteId)
  })

  test('API : nouveau site → created, renvoie un NOUVEAU siteId', async ({ request }) => {
    const res = await request.fetch(`${BASE}/api/scan`, {
      method: 'POST',
      headers: { Cookie: cookies('e2e/.auth/owner.json'), 'Content-Type': 'application/json', 'x-org-id': ids.orgId },
      data: { url: 'https://e2e-new-site.example' },
    })
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.created).toBe(true)
    expect(body.siteId).toBeTruthy()
    expect(body.siteId).not.toBe(ids.siteId)
  })

  test('API : URL invalide → 400', async ({ request }) => {
    const res = await request.fetch(`${BASE}/api/scan`, {
      method: 'POST',
      headers: { Cookie: cookies('e2e/.auth/owner.json'), 'Content-Type': 'application/json', 'x-org-id': ids.orgId },
      data: { url: 'pas-une-url' },
    })
    expect(res.status()).toBe(400)
  })

  // ─────────────── UI barre Analyser (connecté) ───────────────

  test('UI : scanner un site déjà présent redirige vers son overview', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Saisissez votre site Web').fill('example.com')
    await page.getByRole('button', { name: 'Analyser' }).click()
    // Valide TOUTE la chaîne de navigation (runScan → /api/scan → [id]/index → zone pages).
    await page.waitForURL(`**/dashboard/sites/${ids.siteId}/**`, { timeout: 20_000 })
    expect(page.url()).toContain(`/dashboard/sites/${ids.siteId}/`)
  })

  test('UI : URL invalide → erreur inline, aucune navigation', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Saisissez votre site Web').fill('pas une url !!')
    await page.getByRole('button', { name: 'Analyser' }).click()
    await expect(page.getByText(/adresse valide/i)).toBeVisible()
    expect(page.url()).not.toContain('/dashboard')
  })

  // ─────────────── Reprise après retour OAuth (simulée via localStorage) — LE bug ───────────────

  test('Reprise post-OAuth : atterrit sur le site SCANNÉ, pas sur le site actif/premier', async ({ page }) => {
    // Simule l'état laissé par la barre avant la redirection externe : une URL en attente. Sans la
    // reprise, /dashboard/sites redirigerait vers le 1er site (example.com) — le bug qu'on a vécu.
    await page.addInitScript(() => {
      localStorage.setItem('seogard:pendingScan', 'https://e2e-oauth-resume.example')
    })

    await page.goto('/dashboard/sites')

    // Doit partir sur le site scanné (un NOUVEAU site), donc PAS example.com (ids.siteId).
    await page.waitForURL('**/dashboard/sites/*/zones/**', { timeout: 20_000 })
    expect(page.url()).not.toContain(`/dashboard/sites/${ids.siteId}/`)

    // L'URL en attente a été purgée.
    const pending = await page.evaluate(() => localStorage.getItem('seogard:pendingScan'))
    expect(pending).toBeNull()
  })
})

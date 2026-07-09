import type { Page } from '@playwright/test'

// Navigation + attente d'hydratation : sur une app SSR, cliquer avant que Vue n'attache ses
// listeners déclenche le submit NATIF du formulaire (navigation ?query) au lieu du handler.
// networkidle ≈ hydratation terminée en dev (chunks + locales i18n chargés).
export async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: 'networkidle' })
}

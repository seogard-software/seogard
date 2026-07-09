import { test, expect } from '@playwright/test'

// Le sélecteur (« Prisme ») est public → on ne le teste qu'une fois (projet owner).
test.describe('Sélecteur de langue — slugs traduits + pages FR-only', () => {
  test('depuis /fr/tarifs, le lien EN pointe vers le slug traduit /en/pricing et y navigue', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    await page.goto('/fr/tarifs')
    const en = page.locator('.lang a[hreflang="en"]').first()
    await expect(en).toHaveAttribute('href', '/en/pricing') // jamais /en/tarifs
    await en.click()
    await expect(page).toHaveURL(/\/en\/pricing$/)
  })

  test('depuis /fr/outils/monitoring, le lien EN pointe vers /en/tools/monitoring', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    await page.goto('/fr/outils/monitoring')
    await expect(page.locator('.lang a[hreflang="en"]').first()).toHaveAttribute('href', '/en/tools/monitoring')
  })

  test('retour : depuis /en/pricing, le lien FR pointe vers /fr/tarifs', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    await page.goto('/en/pricing')
    await expect(page.locator('.lang a[hreflang="fr"]').first()).toHaveAttribute('href', '/fr/tarifs')
  })

  test('formations (bilingue) : le lien EN mène vers /en/formations', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    await page.goto('/fr/formations')
    await expect(page.locator('.lang a[hreflang="en"]').first()).toHaveAttribute('href', '/en/formations')
  })
})

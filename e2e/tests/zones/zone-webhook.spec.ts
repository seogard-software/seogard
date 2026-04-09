import { test, expect } from '@playwright/test'
import { getTestIds } from '../../helpers/constants'

const ids = getTestIds()
const webhookUrl = `/dashboard/sites/${ids.siteId}/zones/${ids.defaultZoneId}/webhook`

test.describe('Webhook page access by role', () => {
  test('owner sees webhook content', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    await page.goto(webhookUrl)
    await expect(page.getByTestId('zone-denied')).not.toBeVisible()
    await expect(page.getByText('API Key')).toBeVisible()
  })

  test('admin sees webhook content', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-admin')
    await page.goto(webhookUrl)
    await expect(page.getByTestId('zone-denied')).not.toBeVisible()
    await expect(page.getByText('API Key')).toBeVisible()
  })

  test('member sees permission denied', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-member')
    await page.goto(webhookUrl)
    await expect(page.getByTestId('zone-denied')).toBeVisible()
  })

  test('viewer sees permission denied', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-viewer')
    await page.goto(webhookUrl)
    await expect(page.getByTestId('zone-denied')).toBeVisible()
  })
})

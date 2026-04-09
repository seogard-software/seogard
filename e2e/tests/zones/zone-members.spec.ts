import { test, expect } from '@playwright/test'
import { getTestIds } from '../../helpers/constants'

const ids = getTestIds()
const membersUrl = `/dashboard/sites/${ids.siteId}/zones/${ids.defaultZoneId}/members`

test.describe('Members page access by role', () => {
  test('owner sees member list', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    await page.goto(membersUrl)
    await expect(page.getByTestId('zone-denied')).not.toBeVisible()
    await expect(page.getByTestId('member-list').first()).toBeVisible()
  })

  test('admin sees member list', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-admin')
    await page.goto(membersUrl)
    await expect(page.getByTestId('zone-denied')).not.toBeVisible()
    await expect(page.getByTestId('member-list').first()).toBeVisible()
  })

  test('member sees permission denied', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-member')
    await page.goto(membersUrl)
    await expect(page.getByTestId('zone-denied')).toBeVisible()
  })

  test('viewer sees permission denied', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-viewer')
    await page.goto(membersUrl)
    await expect(page.getByTestId('zone-denied')).toBeVisible()
  })
})

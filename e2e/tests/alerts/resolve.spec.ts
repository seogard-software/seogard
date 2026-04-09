import { test, expect } from '@playwright/test'
import { getTestIds } from '../../helpers/constants'
import fs from 'node:fs'

const ids = getTestIds()
const BASE = 'http://localhost:3333'

function getCookiesFromStorage(authFile: string): string {
  const storage = JSON.parse(fs.readFileSync(authFile, 'utf-8'))
  return storage.cookies
    .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
    .join('; ')
}

async function apiCall(authFile: string, method: string, url: string, body?: object) {
  const cookies = getCookiesFromStorage(authFile)
  const opts: RequestInit = {
    method,
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/json',
    },
  }
  if (body) opts.body = JSON.stringify(body)
  return fetch(`${BASE}${url}`, opts)
}

test.describe('Alert resolve — API permissions', () => {
  test('member can resolve-all by ruleId', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-member')
    const res = await apiCall(
      'e2e/.auth/member.json',
      'POST',
      `/api/sites/${ids.siteId}/alerts/resolve-all`,
      { ruleId: 'meta_title_missing' },
    )
    // 200 even if no alerts to resolve
    expect(res.status).toBe(200)
  })

  test('viewer cannot resolve-all (403)', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-viewer')
    const res = await apiCall(
      'e2e/.auth/viewer.json',
      'POST',
      `/api/sites/${ids.siteId}/alerts/resolve-all`,
      { ruleId: 'meta_title_missing' },
    )
    expect(res.status).toBe(403)
  })

  test('resolve-all without ruleId returns 400', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-member')
    const res = await apiCall(
      'e2e/.auth/member.json',
      'POST',
      `/api/sites/${ids.siteId}/alerts/resolve-all`,
      {},
    )
    expect(res.status).toBe(400)
  })
})

test.describe('Alert resolve — no acknowledge endpoint', () => {
  test('POST /api/sites/:id/alerts/acknowledge-all returns 404 (removed)', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    const res = await apiCall(
      'e2e/.auth/owner.json',
      'POST',
      `/api/sites/${ids.siteId}/alerts/acknowledge-all`,
      { ruleId: 'meta_title_missing' },
    )
    // 404 because the endpoint no longer exists
    expect([404, 405]).toContain(res.status)
  })
})

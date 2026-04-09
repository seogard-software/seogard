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

test.describe('Muted rules — API permissions', () => {
  test('admin can mute a rule', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-admin')
    const res = await apiCall(
      'e2e/.auth/admin.json',
      'POST',
      `/api/sites/${ids.siteId}/muted-rules`,
      { ruleId: 'rec_favicon_missing_audit' },
    )
    expect([200, 201]).toContain(res.status)
  })

  test('admin can list muted rules', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-admin')
    const res = await apiCall(
      'e2e/.auth/admin.json',
      'GET',
      `/api/sites/${ids.siteId}/muted-rules`,
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('rules')
    expect(Array.isArray(body.rules)).toBe(true)
  })

  test('admin can unmute a rule', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-admin')
    const res = await apiCall(
      'e2e/.auth/admin.json',
      'DELETE',
      `/api/sites/${ids.siteId}/muted-rules/rec_favicon_missing_audit`,
    )
    expect([200, 404]).toContain(res.status) // 404 if already unmuted
  })

  test('member cannot mute a rule (403)', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-member')
    const res = await apiCall(
      'e2e/.auth/member.json',
      'POST',
      `/api/sites/${ids.siteId}/muted-rules`,
      { ruleId: 'rec_favicon_missing_audit' },
    )
    expect(res.status).toBe(403)
  })

  test('viewer cannot mute a rule (403)', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-viewer')
    const res = await apiCall(
      'e2e/.auth/viewer.json',
      'POST',
      `/api/sites/${ids.siteId}/muted-rules`,
      { ruleId: 'rec_favicon_missing_audit' },
    )
    expect(res.status).toBe(403)
  })

  test('viewer can list muted rules (read-only)', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-viewer')
    const res = await apiCall(
      'e2e/.auth/viewer.json',
      'GET',
      `/api/sites/${ids.siteId}/muted-rules`,
    )
    expect(res.status).toBe(200)
  })
})

test.describe('Muted rules — POST validation', () => {
  test('POST without ruleId returns 400', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'zone-admin')
    const res = await apiCall(
      'e2e/.auth/admin.json',
      'POST',
      `/api/sites/${ids.siteId}/muted-rules`,
      {},
    )
    expect(res.status).toBe(400)
  })
})

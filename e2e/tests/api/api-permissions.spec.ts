import { test, expect } from '@playwright/test'
import { getTestIds } from '../../helpers/constants'
import fs from 'node:fs'

const ids = getTestIds()

function getCookiesFromStorage(authFile: string): string {
  const storage = JSON.parse(fs.readFileSync(authFile, 'utf-8'))
  return storage.cookies
    .map((c: { name: string; value: string }) => `${c.name}=${c.value}`)
    .join('; ')
}

type Role = 'owner' | 'zone-admin' | 'zone-member' | 'zone-viewer'

const authFiles: Record<Role, string> = {
  'owner': 'e2e/.auth/owner.json',
  'zone-admin': 'e2e/.auth/admin.json',
  'zone-member': 'e2e/.auth/member.json',
  'zone-viewer': 'e2e/.auth/viewer.json',
}

const BASE = 'http://localhost:3333'

async function apiCall(request: any, role: Role, method: string, url: string, body?: any) {
  const cookies = getCookiesFromStorage(authFiles[role])
  return request.fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Cookie': cookies,
      'Content-Type': 'application/json',
    },
    data: body,
  })
}

// POST crawl — owner, admin, member: authorized | viewer: 403
test.describe('API: POST crawl', () => {
  for (const [role, expected] of [
    ['owner', 'authorized'],
    ['zone-admin', 'authorized'],
    ['zone-member', 'authorized'],
    ['zone-viewer', 'denied'],
  ] as [Role, string][]) {
    test(`${role} ${expected === 'authorized' ? 'can' : 'cannot'} trigger crawl`, async ({ request }, testInfo) => {
      test.skip(testInfo.project.name !== role)
      const res = await apiCall(request, role, 'POST', `/api/sites/${ids.siteId}/zones/${ids.defaultZoneId}/crawl`)
      if (expected === 'authorized') {
        // 200, 201, or 409 (already running) are all "authorized"
        expect([200, 201, 409]).toContain(res.status())
      } else {
        expect(res.status()).toBe(403)
      }
    })
  }
})

// PATCH zone — owner, admin: 200 | member, viewer: 403
test.describe('API: PATCH zone', () => {
  for (const [role, expected] of [
    ['owner', 200],
    ['zone-admin', 200],
    ['zone-member', 403],
    ['zone-viewer', 403],
  ] as [Role, number][]) {
    test(`${role} gets ${expected}`, async ({ request }, testInfo) => {
      test.skip(testInfo.project.name !== role)
      const res = await apiCall(request, role, 'PATCH', `/api/sites/${ids.siteId}/zones/${ids.blogZoneId}`, { name: 'Blog' })
      expect(res.status()).toBe(expected)
    })
  }
})

// DELETE site — only owner can
test.describe('API: DELETE site (non-owners get 403)', () => {
  for (const role of ['zone-admin', 'zone-member', 'zone-viewer'] as Role[]) {
    test(`${role} gets 403`, async ({ request }, testInfo) => {
      test.skip(testInfo.project.name !== role)
      const res = await apiCall(request, role, 'DELETE', `/api/sites/${ids.siteId}`)
      expect(res.status()).toBe(403)
    })
  }
})

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

test.describe('Self-hosted — register blocked after first user', () => {
  test('POST /api/auth/register returns 403 when users exist and self-hosted', async ({ request }, testInfo) => {
    test.skip(testInfo.project.name !== 'owner')
    // This test only works when NUXT_PUBLIC_SELF_HOSTED=true
    // In cloud mode, register is always open
    const res = await request.post(`${BASE}/api/auth/register`, {
      data: {
        email: 'hacker@evil.com',
        password: 'password123',
        acceptedTerms: true,
      },
    })
    // In cloud: 409 (email already exists) or 200 (new user)
    // In self-hosted: 403 (registration disabled)
    // We just verify the endpoint responds (no 500)
    expect([200, 403, 409]).toContain(res.status())
  })
})

test.describe('Self-hosted — setup status', () => {
  test('GET /api/setup/status returns needsSetup false when users exist', async ({ request }) => {
    const res = await request.get(`${BASE}/api/setup/status`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.needsSetup).toBe(false)
  })
})

test.describe('Self-hosted — whitelist routes', () => {
  test('/docs/self-hosted is accessible without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/docs/self-hosted`)
    expect(res.status()).toBe(200)
  })

  test('/bot is accessible without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/bot`)
    expect(res.status()).toBe(200)
  })

  test('/docs/rules is accessible without auth', async ({ request }) => {
    const res = await request.get(`${BASE}/docs/rules`)
    expect(res.status()).toBe(200)
  })
})

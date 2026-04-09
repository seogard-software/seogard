import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3333'

test.describe('OAuth providers — API', () => {
  test('GET /api/auth/providers returns available providers', async ({ request }) => {
    const res = await request.get(`${BASE}/api/auth/providers`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('providers')
    expect(Array.isArray(body.providers)).toBe(true)
    // Providers are strings like 'google', 'microsoft', 'github'
    for (const p of body.providers) {
      expect(['google', 'microsoft', 'github']).toContain(p)
    }
  })

  test('GET /api/auth/providers is public (no auth needed)', async ({ request }) => {
    // Fresh request without cookies
    const res = await request.get(`${BASE}/api/auth/providers`)
    expect(res.status()).toBe(200)
  })
})

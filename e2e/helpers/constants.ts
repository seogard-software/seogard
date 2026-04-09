import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const TEST_PASSWORD = 'TestPassword123!'

export const USERS = {
  owner: { email: 'owner@test.seogard.io', role: 'owner' as const },
  admin: { email: 'admin@test.seogard.io', role: 'member' as const },
  member: { email: 'member@test.seogard.io', role: 'member' as const },
  viewer: { email: 'viewer@test.seogard.io', role: 'member' as const },
  trialExpired: { email: 'trial-expired@test.seogard.io', role: 'owner' as const },
  trialActive: { email: 'trial-active@test.seogard.io', role: 'owner' as const },
} as const

export type UserKey = keyof typeof USERS

export interface TestIds {
  orgId: string
  siteId: string
  defaultZoneId: string
  blogZoneId: string
  trialOrgId: string
  trialSiteId: string
  trialDefaultZoneId: string
  users: Record<UserKey, string>
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function getTestIds(): TestIds {
  const raw = fs.readFileSync(path.join(__dirname, '../.test-ids.json'), 'utf-8')
  return JSON.parse(raw) as TestIds
}

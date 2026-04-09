import mongoose, { Types } from 'mongoose'
import { hashPassword } from '../../server/utils/auth'
import { User, Organization, OrgMember, Subscription, Site, Zone } from '../../server/database/models'
import { patternsToRegexSource } from '../../shared/utils/zone'
import { TEST_PASSWORD, USERS } from './constants'
import type { TestIds, UserKey } from './constants'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function seedDatabase(): Promise<TestIds> {
  const db = mongoose.connection.db
  if (!db) throw new Error('MongoDB not connected')

  // Drop all collections
  const collections = await db.listCollections().toArray()
  for (const col of collections) {
    await db.dropCollection(col.name)
  }

  const passwordHash = await hashPassword(TEST_PASSWORD)

  // Create users
  const userIds: Record<UserKey, string> = {} as any
  for (const [key, { email }] of Object.entries(USERS)) {
    // trialActive gets a future trial, others get expired
    const trialEndsAt = key === 'trialActive'
      ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      : new Date('2020-01-01')

    const user = await User.create({
      email,
      passwordHash,
      name: key.charAt(0).toUpperCase() + key.slice(1) + ' User',
      emailVerified: true,
      trialEndsAt,
    })
    userIds[key as UserKey] = user._id.toString()
  }

  // Create organization
  const org = await Organization.create({
    name: 'Test Org',
    slug: 'test-org',
    ownerId: new Types.ObjectId(userIds.owner),
  })
  const orgId = org._id.toString()

  // Create subscription (active)
  await Subscription.create({
    orgId: new Types.ObjectId(orgId),
    stripeStatus: 'active',
  })

  // Create site
  const site = await Site.create({
    orgId: new Types.ObjectId(orgId),
    name: 'Test Site',
    url: 'https://example.com',
    discovering: 'idle',
  })
  const siteId = site._id.toString()

  // Create default zone (**)
  const defaultZone = await Zone.create({
    siteId: new Types.ObjectId(siteId),
    name: null,
    patterns: ['**'],
    isDefault: true,
    _patternsRegex: patternsToRegexSource(['**']),
  })
  const defaultZoneId = defaultZone._id.toString()

  // Create blog zone (/blog/**)
  const blogZone = await Zone.create({
    siteId: new Types.ObjectId(siteId),
    name: 'Blog',
    patterns: ['/blog/**'],
    isDefault: false,
    _patternsRegex: patternsToRegexSource(['/blog/**']),
  })
  const blogZoneId = blogZone._id.toString()

  // Create OrgMembers with zone roles
  // Owner — org role: owner, no zoneRoles needed (owner has full access)
  await OrgMember.create({
    orgId: new Types.ObjectId(orgId),
    userId: new Types.ObjectId(userIds.owner),
    role: 'owner',
    zoneRoles: [],
  })

  // Admin — org role: member, zone roles: admin on both zones
  await OrgMember.create({
    orgId: new Types.ObjectId(orgId),
    userId: new Types.ObjectId(userIds.admin),
    role: 'member',
    zoneRoles: [
      { zoneId: new Types.ObjectId(defaultZoneId), role: 'admin' },
      { zoneId: new Types.ObjectId(blogZoneId), role: 'admin' },
    ],
  })

  // Member — org role: member, zone roles: member on both zones
  await OrgMember.create({
    orgId: new Types.ObjectId(orgId),
    userId: new Types.ObjectId(userIds.member),
    role: 'member',
    zoneRoles: [
      { zoneId: new Types.ObjectId(defaultZoneId), role: 'member' },
      { zoneId: new Types.ObjectId(blogZoneId), role: 'member' },
    ],
  })

  // Viewer — org role: member, zone roles: viewer on both zones
  await OrgMember.create({
    orgId: new Types.ObjectId(orgId),
    userId: new Types.ObjectId(userIds.viewer),
    role: 'member',
    zoneRoles: [
      { zoneId: new Types.ObjectId(defaultZoneId), role: 'viewer' },
      { zoneId: new Types.ObjectId(blogZoneId), role: 'viewer' },
    ],
  })

  // --- Trial org (for billing tests) ---

  // Trial org owned by trialExpired user
  const trialOrg = await Organization.create({
    name: 'Trial Org',
    slug: 'trial-org',
    ownerId: new Types.ObjectId(userIds.trialExpired),
  })
  const trialOrgId = trialOrg._id.toString()

  await Subscription.create({
    orgId: new Types.ObjectId(trialOrgId),
    stripeStatus: 'trialing',
  })

  const trialSite = await Site.create({
    orgId: new Types.ObjectId(trialOrgId),
    name: 'Trial Site',
    url: 'https://trial.example.com',
    discovering: 'idle',
  })
  const trialSiteId = trialSite._id.toString()

  const trialDefaultZone = await Zone.create({
    siteId: new Types.ObjectId(trialSiteId),
    name: null,
    patterns: ['**'],
    isDefault: true,
    _patternsRegex: patternsToRegexSource(['**']),
  })
  const trialDefaultZoneId = trialDefaultZone._id.toString()

  // trialExpired is owner of trial org
  await OrgMember.create({
    orgId: new Types.ObjectId(trialOrgId),
    userId: new Types.ObjectId(userIds.trialExpired),
    role: 'owner',
    zoneRoles: [],
  })

  // trialActive is member of trial org (with member zone role)
  await OrgMember.create({
    orgId: new Types.ObjectId(trialOrgId),
    userId: new Types.ObjectId(userIds.trialActive),
    role: 'member',
    zoneRoles: [
      { zoneId: new Types.ObjectId(trialDefaultZoneId), role: 'member' },
    ],
  })

  const testIds: TestIds = {
    orgId,
    siteId,
    defaultZoneId,
    blogZoneId,
    trialOrgId,
    trialSiteId,
    trialDefaultZoneId,
    users: userIds,
  }

  // Write IDs to file for tests to read
  fs.writeFileSync(
    path.join(__dirname, '../.test-ids.json'),
    JSON.stringify(testIds, null, 2),
  )

  return testIds
}

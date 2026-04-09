import type { Google, MicrosoftEntraId, GitHub } from 'arctic'
import { decodeIdToken } from 'arctic'
import { User, RefreshToken, Organization, OrgMember } from '../../../../database/models'
import { isSelfHosted } from '../../../../utils/deployment'
import { generateAccessToken, generateRefreshTokenValue, setAuthCookies, getRefreshTokenExpiresAt } from '../../../../utils/auth'
import { getOAuthClient, isValidOAuthProvider } from '../../../../utils/oauth'
import type { OAuthProvider } from '../../../../utils/oauth'
import { createLogger } from '../../../../utils/logger'

const log = createLogger('web', 'api.auth.oauth')

interface OAuthProfile {
  email: string
  name: string | null
  avatarUrl: string | null
  providerId: string
}

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider') as OAuthProvider

  if (!provider || !isValidOAuthProvider(provider)) {
    throw createError({ statusCode: 400, message: 'Provider OAuth invalide' })
  }

  const client = getOAuthClient(provider)
  if (!client) {
    throw createError({ statusCode: 500, message: `Provider ${provider} non configuré` })
  }

  const query = getQuery(event)
  const code = query.code as string
  const state = query.state as string

  if (!code || !state) {
    throw createError({ statusCode: 400, message: 'Paramètres OAuth manquants' })
  }

  // Verify state from cookie
  const cookieRaw = getCookie(event, `oauth-${provider}`)
  if (!cookieRaw) {
    throw createError({ statusCode: 400, message: 'Session OAuth expirée' })
  }

  const { state: savedState, codeVerifier } = JSON.parse(cookieRaw)
  if (state !== savedState) {
    throw createError({ statusCode: 400, message: 'State OAuth invalide' })
  }

  // Clear the OAuth cookie
  deleteCookie(event, `oauth-${provider}`, { path: '/' })

  // Exchange code for tokens
  const tokens = await exchangeCode(client, provider, code, codeVerifier)
  const profile = await fetchProfile(provider, tokens)

  if (!profile.email) {
    throw createError({ statusCode: 400, message: 'Impossible de récupérer votre email depuis le provider' })
  }

  // Find or create user
  let user = await User.findOne({ email: profile.email })

  if (user) {
    // Existing user — link OAuth ID but keep authProvider as 'local' if they have a password
    if (!user.oauthProviderId) {
      user.oauthProviderId = profile.providerId
      if (!user.passwordHash) user.authProvider = provider
    }
    if (!user.name && profile.name) user.name = profile.name
    if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl
    await user.save()

    log.info({ userId: user._id, provider }, 'oauth login existing user')
  } else {
    // New user — create with personal org
    // OAuth login implies acceptance of terms (consent screen + redirect flow)
    user = await User.create({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      authProvider: provider,
      oauthProviderId: profile.providerId,
      passwordHash: null,
      trialEndsAt: isSelfHosted() ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      acceptedTermsAt: new Date(),
      acceptedTermsVersion: '2026-03-18',
    })

    log.info({ userId: user._id, provider }, 'oauth register new user')
  }

  // Check auto-provisioning: if email domain matches an org's allowedDomains
  const emailDomain = profile.email.split('@')[1]
  if (emailDomain) {
    const matchingOrgs = await Organization.find({
      allowedDomains: emailDomain,
    }).lean()

    for (const org of matchingOrgs) {
      const existing = await OrgMember.findOne({ orgId: org._id, userId: user._id }).lean()
      if (!existing) {
        await OrgMember.create({
          orgId: org._id,
          userId: user._id,
          role: 'member',
        })
        log.info({ userId: user._id, orgId: org._id, domain: emailDomain }, 'auto-provisioned into org')
      }
    }
  }

  // Issue auth tokens
  const accessToken = generateAccessToken(user._id.toString())
  const refreshTokenValue = generateRefreshTokenValue()

  await RefreshToken.deleteMany({ userId: user._id })
  await RefreshToken.create({
    userId: user._id,
    token: refreshTokenValue,
    expiresAt: getRefreshTokenExpiresAt(),
  })

  setAuthCookies(event, accessToken, refreshTokenValue)

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // New users without an org need onboarding
  const hasOrg = await OrgMember.findOne({ userId: user._id }).lean()
  if (!hasOrg) {
    return sendRedirect(event, `${appUrl}/onboarding`)
  }

  return sendRedirect(event, `${appUrl}/dashboard/sites`)
})

async function exchangeCode(client: Google | MicrosoftEntraId | GitHub, provider: OAuthProvider, code: string, codeVerifier: string) {
  if (provider === 'google') {
    return await (client as Google).validateAuthorizationCode(code, codeVerifier)
  } else if (provider === 'microsoft') {
    return await (client as MicrosoftEntraId).validateAuthorizationCode(code, codeVerifier)
  } else {
    return await (client as GitHub).validateAuthorizationCode(code)
  }
}

async function fetchProfile(provider: OAuthProvider, tokens: any): Promise<OAuthProfile> {
  if (provider === 'google') {
    const claims = decodeIdToken(tokens.idToken()) as any
    return {
      email: claims.email,
      name: claims.name || null,
      avatarUrl: claims.picture || null,
      providerId: claims.sub,
    }
  }

  if (provider === 'microsoft') {
    const claims = decodeIdToken(tokens.idToken()) as any
    return {
      email: claims.email || claims.preferred_username,
      name: claims.name || null,
      avatarUrl: null,
      providerId: claims.sub || claims.oid,
    }
  }

  // GitHub — need to fetch from API
  const accessToken = tokens.accessToken()
  const [userResp, emailsResp] = await Promise.all([
    fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    }),
    fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    }),
  ])

  const userData = await userResp.json() as any
  const emailsData = await emailsResp.json() as any[]

  const primaryEmail = emailsData.find((e: any) => e.primary && e.verified)?.email
    || emailsData.find((e: any) => e.verified)?.email
    || userData.email

  return {
    email: primaryEmail,
    name: userData.name || userData.login || null,
    avatarUrl: userData.avatar_url || null,
    providerId: String(userData.id),
  }
}

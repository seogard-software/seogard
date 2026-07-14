import type { Google, MicrosoftEntraId, GitHub } from 'arctic'
import { decodeIdToken } from 'arctic'
import { User, RefreshToken, Organization, OrgMember } from '../../../../database/models'
import { isSelfHosted } from '../../../../utils/deployment'
import { generateAccessToken, generateRefreshTokenValue, setAuthCookies, getRefreshTokenExpiresAt } from '../../../../utils/auth'
import { getOAuthClient, isValidOAuthProvider } from '../../../../utils/oauth'
import type { OAuthProvider } from '../../../../utils/oauth'
import { createPersonalOrg } from '../../../../utils/org-create'
import { createLogger } from '../../../../utils/logger'
import { localeFromAcceptLanguage } from '../../../../../shared/utils/i18n'

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
    throw createError({ statusCode: 400, message: 'Invalid OAuth provider', data: { errorCode: 'OAUTH_PROVIDER_INVALID' } })
  }

  const client = getOAuthClient(provider)
  if (!client) {
    throw createError({ statusCode: 500, message: `Provider ${provider} not configured`, data: { errorCode: 'OAUTH_PROVIDER_NOT_CONFIGURED', provider } })
  }

  const query = getQuery(event)
  const code = query.code as string
  const state = query.state as string

  if (!code || !state) {
    throw createError({ statusCode: 400, message: 'Missing OAuth parameters', data: { errorCode: 'OAUTH_PARAMS_MISSING' } })
  }

  // Verify state from cookie
  const cookieRaw = getCookie(event, `oauth-${provider}`)
  if (!cookieRaw) {
    throw createError({ statusCode: 400, message: 'OAuth session expired', data: { errorCode: 'OAUTH_SESSION_EXPIRED' } })
  }

  const { state: savedState, codeVerifier } = JSON.parse(cookieRaw)
  if (state !== savedState) {
    throw createError({ statusCode: 400, message: 'Invalid OAuth state', data: { errorCode: 'OAUTH_STATE_INVALID' } })
  }

  // Clear the OAuth cookie
  deleteCookie(event, `oauth-${provider}`, { path: '/' })

  // Exchange code for tokens
  const tokens = await exchangeCode(client, provider, code, codeVerifier)
  const profile = await fetchProfile(provider, tokens)

  if (!profile.email) {
    throw createError({ statusCode: 400, message: 'Could not retrieve email from the provider', data: { errorCode: 'OAUTH_EMAIL_MISSING' } })
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
    // Locale du compte : dérivée de l'en-tête Accept-Language (helper partagé avec register.post.ts).
    // Sans ça, tout inscrit OAuth tombait sur le défaut 'fr' du modèle → dashboard français pour
    // un anglophone (ex. en-AU). Seulement à la création : un user existant garde sa locale.
    const locale = localeFromAcceptLanguage(getHeader(event, 'accept-language'))

    user = await User.create({
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      authProvider: provider,
      oauthProviderId: profile.providerId,
      passwordHash: null,
      locale,
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

  // Nouvel inscrit sans orga (aucune auto-provision par domaine) : on lui crée une orga perso
  // automatiquement (zéro friction, comme l'inscription email) au lieu de passer par /onboarding.
  // Permet aussi à l'onboarding « scan » (barre Analyser) de s'enchaîner sans étape manuelle.
  const hasOrg = await OrgMember.findOne({ userId: user._id }).lean()
  if (!hasOrg) {
    await createPersonalOrg({
      userId: user._id.toString(),
      name: user.name || profile.email.split('@')[0] || profile.email,
      email: profile.email,
    })
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

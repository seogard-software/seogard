import { generateState, generateCodeVerifier } from 'arctic'
import type { Google, MicrosoftEntraId, GitHub } from 'arctic'
import { getOAuthClient, isValidOAuthProvider } from '../../../../utils/oauth'

export default defineEventHandler(async (event) => {
  const provider = getRouterParam(event, 'provider')

  if (!provider || !isValidOAuthProvider(provider)) {
    throw createError({ statusCode: 400, message: 'Provider OAuth invalide' })
  }

  const client = getOAuthClient(provider)
  if (!client) {
    throw createError({ statusCode: 500, message: `Provider ${provider} non configuré` })
  }

  const state = generateState()
  const codeVerifier = generateCodeVerifier()

  // Store state + codeVerifier in a temporary cookie
  const IS_DEV = process.env.NODE_ENV === 'development'
  setCookie(event, `oauth-${provider}`, JSON.stringify({ state, codeVerifier }), {
    httpOnly: true,
    secure: !IS_DEV,
    sameSite: 'lax',
    maxAge: 10 * 60,
    path: '/',
  })

  let url: URL
  const scopes = getScopes(provider)

  if (provider === 'google') {
    url = (client as Google).createAuthorizationURL(state, codeVerifier, scopes)
  } else if (provider === 'microsoft') {
    url = (client as MicrosoftEntraId).createAuthorizationURL(state, codeVerifier, scopes)
  } else {
    url = (client as GitHub).createAuthorizationURL(state, scopes)
  }

  return sendRedirect(event, url.toString())
})

function getScopes(provider: string): string[] {
  switch (provider) {
    case 'google': return ['openid', 'email', 'profile']
    case 'microsoft': return ['openid', 'email', 'profile', 'User.Read']
    case 'github': return ['user:email', 'read:user']
    default: return []
  }
}

import { Google, MicrosoftEntraId, GitHub } from 'arctic'

function getAppUrl(): string {
  return process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function createGoogleClient(): Google | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return new Google(clientId, clientSecret, `${getAppUrl()}/api/auth/oauth/google/callback`)
}

function createMicrosoftClient(): MicrosoftEntraId | null {
  const clientId = process.env.MICROSOFT_CLIENT_ID
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return new MicrosoftEntraId('common', clientId, clientSecret, `${getAppUrl()}/api/auth/oauth/microsoft/callback`)
}

function createGitHubClient(): GitHub | null {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  return new GitHub(clientId, clientSecret, `${getAppUrl()}/api/auth/oauth/github/callback`)
}

export type OAuthProvider = 'google' | 'microsoft' | 'github'

export function getOAuthClient(provider: OAuthProvider): Google | MicrosoftEntraId | GitHub | null {
  switch (provider) {
    case 'google': return createGoogleClient()
    case 'microsoft': return createMicrosoftClient()
    case 'github': return createGitHubClient()
    default: return null
  }
}

export const SUPPORTED_OAUTH_PROVIDERS: OAuthProvider[] = ['google', 'microsoft', 'github']

export function isValidOAuthProvider(provider: string): provider is OAuthProvider {
  return SUPPORTED_OAUTH_PROVIDERS.includes(provider as OAuthProvider)
}

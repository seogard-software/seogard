import { getOAuthClient, SUPPORTED_OAUTH_PROVIDERS } from '../../utils/oauth'

export default defineEventHandler(() => {
  const providers = SUPPORTED_OAUTH_PROVIDERS.filter(p => getOAuthClient(p) !== null)
  return { providers }
})

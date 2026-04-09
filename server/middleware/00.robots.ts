const CLOUD_HOSTS = ['seogard.io', 'www.seogard.io']

export default defineEventHandler((event) => {
  const host = getRequestHost(event)
  const isSelfHosted = String(process.env.NUXT_PUBLIC_SELF_HOSTED) === 'true'

  // Self-hosted: noindex everything — the tool is internal, not a public website
  if (isSelfHosted) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
    return
  }

  // Cloud staging/preview: noindex to avoid duplicate content
  if (CLOUD_HOSTS.some(h => host.endsWith(h)) && !CLOUD_HOSTS.includes(host)) {
    setResponseHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
})

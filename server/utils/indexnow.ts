import { createLogger } from './logger'

const log = createLogger('web', 'indexnow')

export async function submitToIndexNow(urls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY
  if (!key) return

  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'
  const host = new URL(appUrl).host

  try {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${appUrl}/${key}.txt`,
        urlList: urls,
      }),
    })

    if (response.ok || response.status === 202) {
      log.info({ urls, status: response.status }, 'IndexNow submission accepted')
    }
    else {
      log.warn({ urls, status: response.status, statusText: response.statusText }, 'IndexNow submission rejected')
    }
  }
  catch (error) {
    log.error({ error: (error as Error).message }, 'IndexNow submission failed')
  }
}

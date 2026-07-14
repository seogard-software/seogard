export function useCrawl() {
  const crawlResults = ref<CrawlResult[]>([])
  const loading = ref(false)
  const activeCrawl = ref<CrawlResult | null>(null)
  const analytics = useAnalytics()

  let pollingInterval: ReturnType<typeof setInterval> | null = null
  let pollingSiteId: string | null = null
  let pollingZoneId: string | null = null

  const progress = computed(() => {
    if (!activeCrawl.value || !activeCrawl.value.pagesTotal) return 0
    return Math.min(
      Math.round((activeCrawl.value.pagesScanned / activeCrawl.value.pagesTotal) * 100),
      100,
    )
  })

  async function fetchCrawlHistory(siteId: string) {
    loading.value = true
    try {
      const { data } = await useFetch<CrawlResult[]>(`/api/sites/${siteId}/crawls`)
      if (data.value) {
        crawlResults.value = data.value
      }
    }
    finally {
      loading.value = false
    }
  }

  async function pollStatus() {
    if (!pollingSiteId || !pollingZoneId) return

    try {
      const data = await $fetch<CrawlResult | null>(`/api/sites/${pollingSiteId}/zones/${pollingZoneId}/crawl-status`)
      const prev = activeCrawl.value
      const wasCrawling = prev !== null
      activeCrawl.value = data

      if (wasCrawling && !data) {
        stopPolling()
        // Fin de scan : le endpoint ne renvoie plus de crawl actif → on lit le dernier snapshot connu.
        // Cas terminal-échec rarement capté par le poll (status déjà null) → on émet completed par
        // défaut avec les compteurs, failed seulement si le dernier statut vu était explicitement KO.
        if (prev?.status === 'failed' || prev?.status === 'cancelled') {
          analytics.capture('scan_failed', { reason: prev.status })
        }
        else {
          analytics.capture('scan_completed', { pages: prev?.pagesScanned ?? 0, alerts: prev?.alertsGenerated ?? 0 })
        }
        onCrawlCompleted()
      }

      // No active crawl and never was — stop polling
      if (!wasCrawling && !data) {
        stopPolling()
      }
    }
    catch {
      // Silently ignore polling errors
    }
  }

  function startPolling(siteId: string, zoneId: string) {
    stopPolling()
    pollingSiteId = siteId
    pollingZoneId = zoneId
    pollingInterval = setInterval(pollStatus, 3_000)
  }

  function stopPolling() {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
    pollingSiteId = null
    pollingZoneId = null
  }

  let onCrawlCompleted: () => void = () => {}

  function setOnCrawlCompleted(callback: () => void) {
    onCrawlCompleted = callback
  }

  // One-time check on page load — only starts polling if crawl is active
  async function checkAndPoll(siteId: string, zoneId: string) {
    try {
      const data = await $fetch<CrawlResult | null>(`/api/sites/${siteId}/zones/${zoneId}/crawl-status`)
      activeCrawl.value = data
      if (data) {
        startPolling(siteId, zoneId)
      }
    }
    catch {
      // No active crawl
    }
  }

  async function triggerCrawl(siteId: string, zoneId: string) {
    loading.value = true
    try {
      const data = await $fetch<CrawlResult>(`/api/sites/${siteId}/zones/${zoneId}/crawl`, {
        method: 'POST' as const,
      })
      if (data) {
        crawlResults.value.unshift(data)
        activeCrawl.value = data
        startPolling(siteId, zoneId)
      }
      return data
    }
    finally {
      loading.value = false
    }
  }

  const lastCrawl = computed(() => crawlResults.value[0] ?? null)

  return {
    crawlResults,
    loading,
    lastCrawl,
    activeCrawl,
    progress,
    fetchCrawlHistory,
    triggerCrawl,
    checkAndPoll,
    startPolling,
    stopPolling,
    setOnCrawlCompleted,
  }
}

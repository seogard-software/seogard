export function useCrawl() {
  const crawlResults = ref<CrawlResult[]>([])
  const loading = ref(false)
  const activeCrawl = ref<CrawlResult | null>(null)

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
      const wasCrawling = activeCrawl.value !== null
      activeCrawl.value = data

      if (wasCrawling && !data) {
        stopPolling()
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

export function useSites() {
  const store = useSitesStore()

  const sites = computed(() => store.sites)
  const currentSite = computed(() => store.currentSite)
  const loading = computed(() => store.loading)
  const activeSites = computed(() => store.activeSites)

  async function fetchSites() {
    await store.fetchSites()
  }

  async function fetchSite(id: string) {
    await store.fetchSite(id)
  }

  async function createSite(payload: CreateSitePayload) {
    return store.createSite(payload)
  }

  async function deleteSite(id: string) {
    await store.deleteSite(id)
  }

  return {
    sites,
    currentSite,
    loading,
    activeSites,
    fetchSites,
    fetchSite,
    createSite,
    deleteSite,
  }
}

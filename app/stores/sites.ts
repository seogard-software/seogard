interface SitesState {
  sites: Site[]
  currentSite: Site | null
  loading: boolean
  activeSiteId: string | null
}

export const useSitesStore = defineStore('sites', {
  state: (): SitesState => ({
    sites: [],
    currentSite: null,
    loading: false,
    activeSiteId: null,
  }),

  getters: {
    activeSites: (state): Site[] => state.sites.filter(s => s.status === 'active'),
    sitesCount: (state): number => state.sites.length,
    activeSite: (state): Site | null =>
      state.sites.find(s => s._id === state.activeSiteId) ?? null,
  },

  actions: {
    async fetchSites() {
      const orgStore = useOrganizationStore()
      if (!orgStore.activeOrgId) {
        throw new Error('Aucune organisation active. Reconnectez-vous.')
      }

      this.loading = true
      try {
        const baseHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {}
        const headers = {
          ...baseHeaders,
          'x-org-id': orgStore.activeOrgId,
        }
        this.sites = await $fetch<Site[]>('/api/sites', { headers })
      }
      finally {
        this.loading = false
      }
    },

    async fetchSite(id: string) {
      this.loading = true
      try {
        const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
        const site = await $fetch<Site>(`/api/sites/${id}`, { headers })
        this.currentSite = site

        // Keep sites array in sync
        const idx = this.sites.findIndex(s => s._id === id)
        if (idx !== -1) this.sites[idx] = site
      }
      finally {
        this.loading = false
      }
    },

    async createSite(payload: CreateSitePayload) {
      const orgStore = useOrganizationStore()
      const site = await $fetch<Site>('/api/sites', {
        method: 'POST',
        body: payload,
        headers: orgStore.activeOrgId ? { 'x-org-id': orgStore.activeOrgId } : {},
      })

      this.sites.push(site)

      return site
    },

    async deleteSite(id: string) {
      await $fetch<void>(`/api/sites/${id}` as string, { method: 'DELETE' })
      this.sites = this.sites.filter(s => s._id !== id)

      if (this.currentSite?._id === id) {
        this.currentSite = null
      }

      if (this.activeSiteId === id) {
        this.activeSiteId = null
      }
    },

    setActiveSiteId(id: string | null) {
      this.activeSiteId = id
    },
  },

  persist: {
    pick: ['activeSiteId'],
  },
})

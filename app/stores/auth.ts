interface SubscriptionInfo {
  stripeStatus: StripeSubscriptionStatus
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  totalPagesUsed: number
}

interface AuthState {
  user: User | null
  subscription: SubscriptionInfo | null
  trialEndsAt: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    subscription: null,
    trialEndsAt: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user,
    currentUser: (state): User | null => state.user,
  },

  actions: {
    async login(email: string, password: string): Promise<LoginResponse> {
      const data = await $fetch<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      if (data.user) {
        this.user = data.user
      }

      return data
    },

    async verifyTotp(code: string) {
      const data = await $fetch<{ user: User }>('/api/auth/totp/verify', {
        method: 'POST',
        body: { code },
      })

      this.user = data.user
    },

    async fetchMe() {
      const orgStore = useOrganizationStore()
      const baseHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {}
      const headers: Record<string, string> = { ...baseHeaders }
      if (orgStore.activeOrgId) {
        headers['x-org-id'] = orgStore.activeOrgId
      }

      const data = await $fetch('/api/auth/me', { headers })

      this.user = data.user as User
      this.subscription = data.subscription as SubscriptionInfo | null
      this.trialEndsAt = (data as any).trialEndsAt ?? null

      // Sync organizations
      if ((data as any).organizations) {
        orgStore.setOrganizations((data as any).organizations)
      }
    },

    async logout() {
      await $fetch('/api/auth/logout', { method: 'POST' })
      this.user = null
      this.subscription = null
      this.trialEndsAt = null

      // Clear all stores to avoid stale data on next login
      const orgStore = useOrganizationStore()
      const sitesStore = useSitesStore()
      orgStore.$reset()
      sitesStore.$reset()
      useZones().resetZones()
    },
  },
})

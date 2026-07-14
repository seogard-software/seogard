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
        // La langue du dashboard suit User.locale (plugin i18n-user-locale)
        await useNuxtApp().$applyUserLocale()
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

      // Relie les session replays à une vraie personne (E-E-A-T du parcours : qui bloque où).
      // Point d'identify robuste : fetchMe passe après login ET register ET au chargement.
      if (import.meta.client && this.user) {
        useAnalytics().identify(this.user._id, { email: this.user.email, locale: this.user.locale })
      }

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

      // Dissocie le device de l'identité pour ne pas mélanger deux personnes sur le même navigateur.
      if (import.meta.client) useAnalytics().reset()

      // Clear all stores to avoid stale data on next login
      const orgStore = useOrganizationStore()
      const sitesStore = useSitesStore()
      orgStore.$reset()
      sitesStore.$reset()
      useZones().resetZones()
    },
  },
})

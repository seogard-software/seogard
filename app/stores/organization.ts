import type { UserOrganization, OrgMember, OrgRole } from '~~/shared/types/organization'

interface OrgState {
  organizations: UserOrganization[]
  activeOrgId: string | null
  members: OrgMember[]
}

export const useOrganizationStore = defineStore('organization', {
  state: (): OrgState => ({
    organizations: [],
    activeOrgId: null,
    members: [],
  }),

  getters: {
    activeOrg: (state): UserOrganization | null =>
      state.organizations.find(o => o._id === state.activeOrgId) ?? null,

    activeOrgRole: (state): OrgRole | null => {
      const org = state.organizations.find(o => o._id === state.activeOrgId)
      return org?.role ?? null
    },
  },

  actions: {
    setOrganizations(orgs: UserOrganization[]) {
      this.organizations = orgs
      // Only set activeOrgId if current one is missing or invalid
      if (!this.activeOrgId || !orgs.find(o => o._id === this.activeOrgId)) {
        this.activeOrgId = orgs[0]?._id || null
      }
    },

    setActiveOrg(orgId: string) {
      this.activeOrgId = orgId
    },

    async fetchMembers(orgId: string) {
      const data = await $fetch<{ members: OrgMember[] }>(
        `/api/organizations/${orgId}/members`,
        { headers: { 'x-org-id': orgId } },
      )
      this.members = data.members
    },
  },

  persist: {
    pick: ['activeOrgId'],
  },
})

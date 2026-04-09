export default defineNuxtPlugin(() => {
  const orgStore = useOrganizationStore()

  globalThis.$fetch = globalThis.$fetch.create({
    onRequest({ request, options }) {
      const url = typeof request === 'string' ? request : ''
      if (!url.startsWith('/api/') || !orgStore.activeOrgId) return

      const headers = (options.headers || {}) as Record<string, string>
      if (headers['x-org-id']) return

      options.headers = { ...headers, 'x-org-id': orgStore.activeOrgId }
    },
  })
})

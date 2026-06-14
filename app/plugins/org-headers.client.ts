export default defineNuxtPlugin(() => {
  const orgStore = useOrganizationStore()

  globalThis.$fetch = globalThis.$fetch.create({
    onRequest({ request, options }) {
      const url = typeof request === 'string' ? request : ''
      if (!url.startsWith('/api/') || !orgStore.activeOrgId) return

      // options.headers peut être un objet, un tableau ou une instance Headers selon ofetch :
      // on normalise via Headers (accepte les trois) pour rester type-safe.
      const headers = new Headers(options.headers as HeadersInit | undefined)
      if (headers.has('x-org-id')) return

      headers.set('x-org-id', orgStore.activeOrgId)
      options.headers = headers
    },
  })
})

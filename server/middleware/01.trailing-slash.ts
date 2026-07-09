// Slash final → 301 sans slash (anti-duplicate). Épargne racine, API, assets, query strings.
export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname
  if (path === '/' || !path.endsWith('/')) return
  if (path.startsWith('/api/') || path.startsWith('/_nuxt') || path.includes('.')) return

  return sendRedirect(event, path.replace(/\/+$/, '') + url.search, 301)
})

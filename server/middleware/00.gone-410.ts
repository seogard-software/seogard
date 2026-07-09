// Blog supprimé définitivement, sans contenu équivalent ni backlink à préserver → 410 Gone
// sur tout /blog (racine et articles), y compris sous le préfixe de locale (/fr/blog…).
export default defineEventHandler((event) => {
  const path = (getRequestURL(event).pathname.replace(/\/+$/, '') || '/').replace(/^\/(?:fr|en)(?=\/|$)/, '')
  if (path === '/blog' || path.startsWith('/blog/')) {
    throw createError({ statusCode: 410, statusMessage: 'Gone' })
  }
})

// Blog supprimé définitivement, sans contenu équivalent ni backlink à préserver → 410 Gone
// sur tout /blog (racine et articles) : désindexation rapide, Google cesse de re-crawler.
export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname.replace(/\/+$/, '') || '/'
  if (path === '/blog' || path.startsWith('/blog/')) {
    throw createError({ statusCode: 410, statusMessage: 'Gone' })
  }
})

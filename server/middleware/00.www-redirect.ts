export default defineEventHandler((event) => {
  const host = getRequestHost(event)
  if (host.startsWith('www.')) {
    const url = getRequestURL(event)
    return sendRedirect(event, `https://${host.slice(4)}${url.pathname}${url.search}`, 301)
  }
})

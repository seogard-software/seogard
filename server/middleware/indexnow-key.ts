export default defineEventHandler((event) => {
  const indexNowKey = process.env.INDEXNOW_KEY
  if (!indexNowKey) return

  const path = getRequestURL(event).pathname
  if (path !== `/${indexNowKey}.txt`) return

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  return indexNowKey
})

export default defineNuxtPlugin(() => {
  const { umamiUrl, umamiId } = useRuntimeConfig().public

  if (!umamiUrl || !umamiId) return

  const script = document.createElement('script')
  script.defer = true
  script.src = `${umamiUrl}/script.js`
  script.dataset.websiteId = umamiId
  document.head.appendChild(script)
})

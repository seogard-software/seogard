import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import 'dayjs/locale/en'

// dayjs suit la locale i18n active. Un import statique de locale par langue supportée.
export default defineNuxtPlugin((nuxtApp) => {
  dayjs.extend(relativeTime)

  const i18n = nuxtApp.$i18n as { locale?: { value?: string } } | undefined
  dayjs.locale(i18n?.locale?.value ?? 'fr')

  return {
    provide: {
      dayjs,
    },
  }
})

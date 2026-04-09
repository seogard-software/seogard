import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'

export default defineNuxtPlugin(() => {
  dayjs.extend(relativeTime)
  dayjs.locale('fr')

  return {
    provide: {
      dayjs,
    },
  }
})

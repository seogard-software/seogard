// Canonical + hreflang des pages publiques (appelé par les layouts landing/docs). Toutes les pages
// publiques sont bilingues → hreflang fr + en + x-default sur chacune.
import { PUBLISHED_LOCALES } from '~~/shared/utils/i18n'

export function useCanonicalHead() {
  const route = useRoute()
  const switchLocalePath = useSwitchLocalePath()
  const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

  const links = computed(() => {
    // Les routes localisées portent un nom suffixé ___locale (@nuxtjs/i18n). Les pages non
    // localisées qui partagent ces layouts (previews internes) ne reçoivent rien.
    const name = String(route.name ?? '')
    if (!name.includes('___')) return []

    const self = `${appUrl}${route.path.replace(/\/+$/, '')}`
    const result: { rel: string, href: string, hreflang?: string }[] = [{ rel: 'canonical', href: self }]

    const frHref = `${appUrl}${(switchLocalePath('fr') || route.path).replace(/\/+$/, '')}`

    if (PUBLISHED_LOCALES.length < 2) {
      result.push({ rel: 'alternate', hreflang: 'fr', href: self })
      result.push({ rel: 'alternate', hreflang: 'x-default', href: self })
      return result
    }

    for (const locale of PUBLISHED_LOCALES) {
      const path = switchLocalePath(locale)
      if (path) result.push({ rel: 'alternate', hreflang: locale, href: `${appUrl}${path.replace(/\/+$/, '')}` })
    }
    result.push({ rel: 'alternate', hreflang: 'x-default', href: frHref })
    return result
  })

  useHead({ link: () => links.value })
}

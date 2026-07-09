// Le dashboard (routes non localisées) suit User.locale ; les pages publiques restent pilotées
// par l'URL (on ne force pas la locale sur une route localisée, suffixe ___locale).
export default defineNuxtPlugin((nuxtApp) => {
  // Best-effort : un échec de bascule de langue ne doit JAMAIS faire remonter une erreur
  // (appelé dans l'action de login — un throw ici casserait la connexion).
  const apply = async () => {
    try {
      const user = useAuthStore().currentUser
      const i18n = nuxtApp.$i18n as { locale: { value: string }, setLocale: (l: 'fr' | 'en') => Promise<void> }
      const route = useRoute()
      const isLocalizedRoute = String(route.name ?? '').includes('___')
      if (user?.locale && !isLocalizedRoute && i18n?.locale?.value !== user.locale) {
        await i18n.setLocale(user.locale)
      }
    }
    catch {}
  }

  apply()

  return {
    provide: {
      applyUserLocale: apply,
    },
  }
})

export default defineNuxtRouteMiddleware(async (to) => {
  // Route non matchée (URL inconnue) : laisser la page d'erreur répondre en 404 — sinon le
  // guard « route protégée » ci-dessous la redirige vers /login (soft-404 côté Google).
  if (to.matched?.length === 0) return

  // Le site PUBLIC vit entièrement sous /fr et /en ; les pages protégées (dashboard, onboarding,
  // settings…) sont à la RACINE (defineI18nRoute(false)). Donc une route localisée ne doit
  // JAMAIS forcer /login : soit c'est une page publique, soit elle n'existe pas (404). Ce garde
  // couvre aussi les routes catch-all que @nuxtjs/i18n génère pour les slugs traduits
  // (/fr/outils/:pathMatch…), qui n'ont pas meta.auth: false et partaient à tort vers /login.
  const isLocalizedPath = /^\/(fr|en)(\/|$)/.test(to.path)

  const authStore = useAuthStore()
  const requiresAuth = to.meta.auth !== false && !isLocalizedPath

  if (!requiresAuth) {
    // Route publique — on hydrate le store seulement si le cookie flag existe
    if (!authStore.isAuthenticated) {
      const loggedIn = useCookie(LOGGED_IN_COOKIE_NAME)
      if (loggedIn.value) {
        try { await authStore.fetchMe() }
        catch { loggedIn.value = null }
      }
    }
    // Rediriger si deja connecte (login/register)
    if (to.meta.redirectIfAuth && authStore.isAuthenticated) {
      return navigateTo('/dashboard/sites')
    }
    return
  }

  // Route protegee — on hydrate le store si pas encore fait
  if (!authStore.isAuthenticated) {
    try {
      await authStore.fetchMe()
    }
    catch {
      return navigateTo('/login')
    }
  }

  // Redirect to onboarding if user has no organization
  const orgStore = useOrganizationStore()
  if (orgStore.organizations.length === 0 && !to.path.startsWith('/onboarding')) {
    return navigateTo('/onboarding')
  }
})

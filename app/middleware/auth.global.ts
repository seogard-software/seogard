export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.auth !== false

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

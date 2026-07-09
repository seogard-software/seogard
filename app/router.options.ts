import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  // @nuxtjs/i18n génère une route catch-all `/[locale]/outils/:pathMatch(.*)` pour les pages au
  // slug traduit (outils→tools). Elle ne redirige rien d'utile et rend un 200 vide sur tout
  // sous-chemin invalide (soft-404) — on la retire pour que /fr/outils/xxx fasse un vrai 404.
  routes: routes => routes.filter(r => !/^\/(?:fr|en)\/outils\/:pathMatch/.test(r.path ?? '')),

  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
}

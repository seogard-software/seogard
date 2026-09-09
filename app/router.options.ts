import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  // @nuxtjs/i18n génère une route catch-all `/[locale]/outils/:pathMatch(.*)` pour les pages au
  // slug traduit (outils→tools). Elle ne redirige rien d'utile et rend un 200 vide sur tout
  // sous-chemin invalide (soft-404) — on la retire pour que /fr/outils/xxx fasse un vrai 404.
  routes: routes => routes.filter(r => !/^\/(?:fr|en)\/outils\/:pathMatch/.test(r.path ?? '')),
  // Garder le scroll Nuxt : il attend la transition de page, respecte scroll-margin-top
  // pour les ancres et restaure la position lors d'un retour navigateur.
}

// Utilitaires partagés (front/back) pour le maillage interne du blog.

// Taille de page unique pour TOUT le blog (listing, pagination, hubs, sitemap, API).
// Source unique : ne jamais redéclarer « 12 » ailleurs.
export const BLOG_PAGE_SIZE = 12

export interface BreadcrumbItem {
  /** Libellé affiché et repris dans le JSON-LD. */
  name: string
  /** URL absolue de l'étape (item du BreadcrumbList). */
  url: string
}

/**
 * Slugifie un nom de catégorie en segment d'URL ASCII, déterministe.
 * Ex. « Référencement & GEO » → « referencement-geo ».
 * Sert d'ancre pour /blog/categorie/[slug] (lookup inverse : on slugifie
 * toutes les catégories distinctes et on matche le param).
 */
export function categorySlug(name: string): string {
  return name
    .normalize('NFD') // décompose les accents (é → e + ´)
    .replace(/[̀-ͯ]/g, '') // retire les diacritiques combinés
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // tout le reste → tiret
    .replace(/^-+|-+$/g, '') // pas de tiret en début/fin
}

export type PaginationItem = number | 'ellipsis'

/**
 * Calcule la fenêtre de pagination numérotée : toujours la 1ʳᵉ et la dernière page,
 * plus la page courante ± 1, avec des ellipses pour les trous. Garantit qu'aucune
 * page n'est à plus d'un clic d'une autre proche → faible profondeur de crawl.
 * Retourne [] si une seule page (pas de pagination à afficher).
 */
export function paginationWindow(current: number, total: number): PaginationItem[] {
  if (total <= 1) return []
  const pages = new Set<number>([1, total])
  for (const p of [current - 1, current, current + 1]) {
    if (p >= 1 && p <= total) pages.add(p)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const result: PaginationItem[] = []
  let prev = 0
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('ellipsis')
    result.push(p)
    prev = p
  }
  return result
}

/**
 * Construit un objet JSON-LD BreadcrumbList (schema.org) à partir d'étapes
 * ordonnées (de la racine à la page courante). Position commence à 1.
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url,
    })),
  }
}

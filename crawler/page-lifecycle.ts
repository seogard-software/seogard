import { Types } from 'mongoose'

// Fin du cycle de vie d'une page retirée proprement : 410 (« parti pour de bon ») + hors
// sitemap depuis PURGE_GONE_AFTER_DAYS → Google a digéré la suppression (fourchette officielle
// 4-8 semaines de recrawls), plus rien à surveiller → la page sort du monitoring (suppression
// franche : page + snapshots + alertes ; ré-entrée automatique si l'URL revient au sitemap).
// Seuil UNIQUE — ne jamais dupliquer cette valeur ailleurs.
export const PURGE_GONE_AFTER_DAYS = 60

/** Date charnière : une sortie de sitemap antérieure à ce point a dépassé la fenêtre de purge. */
export function purgeCutoff(now: Date): Date {
  return new Date(now.getTime() - PURGE_GONE_AFTER_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Filtre MongoDB des pages purgeables d'un site. Conditions cumulatives (doctrine) :
 * statut actuel 410 (retrait terminal explicite) ET hors sitemap depuis ≥ 60 jours.
 * Un 404, un 3xx, une page encore au sitemap ou sortie trop récemment ne matchent JAMAIS.
 */
export function purgeableFilter(siteId: string, now: Date): Record<string, unknown> {
  return {
    siteId: new Types.ObjectId(siteId),
    lastStatusCode: 410,
    outOfSitemapSince: { $ne: null, $lte: purgeCutoff(now) },
  }
}

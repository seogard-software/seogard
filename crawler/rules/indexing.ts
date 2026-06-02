import type { PageMeta } from '../fetcher'
import { registerRule } from './engine'

function includesNoindex(v: string | null | undefined): boolean {
  return v?.toLowerCase().includes('noindex') ?? false
}

// noindex effectif, toutes sources confondues : balise <meta robots>, balise <meta googlebot>,
// et en-tête HTTP X-Robots-Tag ("noindex" ou "googlebot: noindex").
function effectiveNoindex(meta: PageMeta): boolean {
  return includesNoindex(meta.robots) || includesNoindex(meta.robotsGooglebot) || includesNoindex(meta.xRobotsTag)
}

registerRule({
  id: 'noindex_added',
  run(ctx) {
    if (!ctx.oldMeta) return [] // pas de baseline au 1er crawl → pas de faux positif

    // Source "meta robots" : toujours suivie en base (y compris les anciennes données, avant le
    // suivi de l'en-tête X-Robots-Tag).
    const newMetaRobots = includesNoindex(ctx.newMeta.robots)
    const oldMetaRobots = includesNoindex(ctx.oldMeta.robots)

    // Sources additionnelles : <meta googlebot> + en-tête X-Robots-Tag. Suivies dans l'ancien
    // crawl uniquement s'il en avait déjà la trace (proxy : xRobotsTag !== undefined).
    const oldTracked = (ctx.oldMeta as Partial<PageMeta>).xRobotsTag !== undefined
    const newExtra = includesNoindex(ctx.newMeta.robotsGooglebot) || includesNoindex(ctx.newMeta.xRobotsTag)
    const oldExtra = oldTracked && (includesNoindex(ctx.oldMeta.robotsGooglebot) || includesNoindex(ctx.oldMeta.xRobotsTag))

    const newHas = newMetaRobots || newExtra
    const oldHas = oldMetaRobots || oldExtra
    if (!newHas || oldHas) return [] // un seul état « page en noindex », pas de double alerte

    // Sécurité migration : si le noindex provient UNIQUEMENT des sources ajoutées et que l'ancien
    // crawl ne les suivait pas, on ne peut pas affirmer un AJOUT → on établit la baseline sans
    // alerter (zéro faux positif). Un vrai ajout ultérieur sera bien détecté au crawl suivant.
    if (!newMetaRobots && !oldTracked) return []

    const sources: string[] = []
    if (newMetaRobots) sources.push('balise meta robots')
    if (includesNoindex(ctx.newMeta.robotsGooglebot)) sources.push('balise meta googlebot')
    if (includesNoindex(ctx.newMeta.xRobotsTag)) sources.push('en-tête HTTP X-Robots-Tag')

    return [{
      type: 'noindex_added',
      severity: 'critical',
      message: `noindex ajouté (${sources.join(', ')}) — la page va être désindexée`,
      previousValue: ctx.oldMeta.robots ?? ctx.oldMeta.xRobotsTag ?? null,
      currentValue: ctx.newMeta.robots ?? ctx.newMeta.xRobotsTag ?? ctx.newMeta.robotsGooglebot ?? null,
    }]
  },
})

registerRule({
  id: 'robots_txt_changed',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (ctx.newMeta.robots === ctx.oldMeta.robots) return []

    // Si la page est en noindex (toutes sources), c'est noindex_added qui parle — pas de double alerte.
    if (effectiveNoindex(ctx.newMeta)) return []

    return [{
      type: 'robots_txt_changed',
      severity: 'warning',
      message: 'Robots meta tag changed',
      previousValue: ctx.oldMeta.robots,
      currentValue: ctx.newMeta.robots,
    }]
  },
})

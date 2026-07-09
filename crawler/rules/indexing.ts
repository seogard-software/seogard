import type { PageMeta } from '../fetcher'
import { registerRule } from './engine'
import { isInSitemap } from './helpers'

function includesNoindex(v: string | null | undefined): boolean {
  if (!v) return false
  const value = v.toLowerCase()
  if (value.includes('noindex')) return true
  // « none » = noindex + nofollow (directive robots officielle) — reconnu UNIQUEMENT comme
  // segment complet séparé par des virgules : « max-image-preview:none » (directive à valeur,
  // page parfaitement indexable) ne doit JAMAIS matcher. Conséquence assumée : la forme rare
  // « X-Robots-Tag: googlebot: none » n'est pas détectée (faux négatif conservateur — l'inverse,
  // un faux positif sur noindex_added critique, est inacceptable).
  return value.split(',').some(part => part.trim() === 'none')
}

// noindex effectif, toutes sources confondues : balise <meta robots>, balise <meta googlebot>,
// et en-tête HTTP X-Robots-Tag ("noindex" ou "googlebot: noindex").
export function effectiveNoindex(meta: PageMeta): boolean {
  return includesNoindex(meta.robots) || includesNoindex(meta.robotsGooglebot) || includesNoindex(meta.xRobotsTag)
}

// Sources du noindex, pour la donnée brute de l'alerte (jamais de chaîne composée à parser).
function noindexSources(meta: PageMeta): string {
  const sources: string[] = []
  if (includesNoindex(meta.robots)) sources.push('meta robots')
  if (includesNoindex(meta.robotsGooglebot)) sources.push('meta googlebot')
  if (includesNoindex(meta.xRobotsTag)) sources.push('x-robots-tag')
  return sources.join(', ')
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
    if (newMetaRobots) sources.push('meta robots tag')
    if (includesNoindex(ctx.newMeta.robotsGooglebot)) sources.push('meta googlebot tag')
    if (includesNoindex(ctx.newMeta.xRobotsTag)) sources.push('X-Robots-Tag HTTP header')

    return [{
      type: 'noindex_added',
      severity: 'critical',
      message: `noindex added (${sources.join(', ')}) — the page will be deindexed`,
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

// rec_sitemap_noindex_conflict : page déclarée au sitemap MAIS porteuse d'un noindex — signaux
// contradictoires (« indexe-la » vs « ignore-la ») : crawl budget gaspillé + warnings GSC.
// Règle d'ÉTAT INSTALLÉ : fire dès le 1er crawl (comble le trou de noindex_added, qui exige une
// transition — une page noindex depuis toujours ne déclenchait jamais rien). Recommendation :
// re-fire tant que le conflit existe, auto-résolue quand il disparaît (retrait du sitemap OU du
// noindex). Phase SSR uniquement : le noindex se lit dans le HTML brut + en-têtes.
registerRule({
  id: 'rec_sitemap_noindex_conflict',
  run(ctx) {
    if (ctx.renderedMeta) return [] // phase CSR : déjà évalué en SSR (et inSitemap n'y est pas fourni)
    if (!isInSitemap(ctx)) return [] // hors sitemap : pas de contradiction
    if (!effectiveNoindex(ctx.newMeta)) return []
    return [{
      type: 'rec_sitemap_noindex_conflict',
      severity: 'warning',
      message: 'Page declared in the sitemap but carries a noindex directive — contradictory signals sent to Google',
      previousValue: null,
      currentValue: noindexSources(ctx.newMeta),
    }]
  },
})

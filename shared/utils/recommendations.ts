import { ALERT_TYPE_LABELS } from './constants'

// Recos site-level : elles ne fire qu'une fois (sur la home) mais impactent TOUT le domaine —
// et c'est l'angle GEO/IA qu'on met en avant. On les classe donc devant les recos page-level,
// même très répandues. Set explicite (reflet de leur portée réelle, pas une table de poids).
const SITE_LEVEL_RECOS = new Set(['rec_llms_txt_missing', 'rec_ai_crawlers_blocked'])

// Le bénéfice métier (hint) des recos site-level est résolu PAR LOCALE au rendu du
// template email (emails.recoHints.<ruleId>) — jamais figé ici.
const SEVERITY_RANK: Record<string, number> = { warning: 0, info: 1 }

export interface RecoInput {
  ruleId: string
  pageUrl: string
  severity: string
}

export interface TopReco {
  ruleId: string
  label: string
  pagesAffected: number
  siteLevel: boolean
  hint: string | null
}

/**
 * Priorise les recommandations pour la ligne discrète de l'email : groupage par règle (une reco
 * "Longueur du title" peut toucher 340 pages → une seule entrée), puis classement site-level →
 * reach → sévérité. Renvoie le top `limit` + le nombre total d'alertes de recommandation.
 */
export function rankRecommendations(recos: RecoInput[], limit = 2): { topRecos: TopReco[], recoCount: number } {
  const byRule = new Map<string, { pages: Set<string>, severity: string }>()
  for (const r of recos) {
    const group = byRule.get(r.ruleId) ?? { pages: new Set<string>(), severity: r.severity }
    group.pages.add(r.pageUrl)
    byRule.set(r.ruleId, group)
  }

  const ranked = [...byRule.entries()]
    .map(([ruleId, group]) => ({
      ruleId,
      label: ALERT_TYPE_LABELS[ruleId] ?? ruleId,
      pagesAffected: group.pages.size,
      siteLevel: SITE_LEVEL_RECOS.has(ruleId),
      hint: null,
      severity: group.severity,
    }))
    .sort((a, b) =>
      Number(b.siteLevel) - Number(a.siteLevel)
      || b.pagesAffected - a.pagesAffected
      || (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9),
    )

  return {
    topRecos: ranked.slice(0, limit).map(({ ruleId, label, pagesAffected, siteLevel, hint }) => ({ ruleId, label, pagesAffected, siteLevel, hint })),
    recoCount: recos.length,
  }
}

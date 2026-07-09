import type { Locale } from './i18n'

export interface LangItem {
  code: Locale
  active: boolean
  /** Chemin traduit de la page courante dans cette langue (issu de switchLocalePath). */
  to: string
}

/**
 * Construit la liste des langues à afficher dans le sélecteur. Logique PURE (testée hors composant).
 * Toutes les pages publiques sont bilingues → on affiche les langues avec un chemin traduit valide
 * (la courante toujours incluse). On ne fabrique JAMAIS l'URL nous-mêmes : `path(code)` =
 * switchLocalePath, qui renvoie le slug traduit (/en/pricing depuis /fr/tarifs), jamais un /en/tarifs.
 */
export function buildLanguageItems(opts: {
  codes: Locale[]
  current: Locale
  path: (code: Locale) => string
}): LangItem[] {
  return opts.codes
    .map(code => ({ code, active: code === opts.current, to: opts.path(code) }))
    .filter(i => i.active || i.to)
}

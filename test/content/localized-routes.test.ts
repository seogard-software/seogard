import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { LOCALIZED_PATHS, localizedPath } from '../../shared/utils/i18n'

// TRIPWIRE : les slugs traduits par locale (outils→tools, tarifs→pricing) vivent à DEUX
// endroits — LOCALIZED_PATHS (consommé par sitemap + llms) et le defineI18nRoute({ paths })
// de chaque page (macro, ne peut pas importer la constante). Ce test casse le build si les
// deux divergent, ou si une page listée n'a plus son defineI18nRoute.

// routeName (clé LOCALIZED_PATHS) → fichier page correspondant
const PAGE_FILES: Record<string, string> = {
  'outils-monitoring': 'app/pages/outils/monitoring.vue',
  'outils-audit': 'app/pages/outils/audit.vue',
  'tarifs': 'app/pages/tarifs.vue',
}

describe('slugs traduits par locale — synchro LOCALIZED_PATHS ↔ defineI18nRoute', () => {
  it('chaque entrée LOCALIZED_PATHS a son fichier de page connu', () => {
    for (const key of Object.keys(LOCALIZED_PATHS)) {
      expect(PAGE_FILES[key], `pas de fichier connu pour ${key}`).toBeTruthy()
    }
  })

  it.each(Object.entries(LOCALIZED_PATHS))('%s : la page déclare exactement fr+en', (key, paths) => {
    const src = readFileSync(PAGE_FILES[key]!, 'utf8')
    const m = src.match(/defineI18nRoute\(\{\s*paths:\s*(\{[^}]*\})\s*\}\)/)
    expect(m, `${PAGE_FILES[key]} : defineI18nRoute({ paths }) introuvable`).toBeTruthy()
    expect(m![1]).toContain(`fr: '${paths.fr}'`)
    expect(m![1]).toContain(`en: '${paths.en}'`)
  })

  it('localizedPath : FR inchangé, EN traduit, page inconnue = fallback', () => {
    expect(localizedPath('/tarifs', 'fr')).toBe('/tarifs')
    expect(localizedPath('/tarifs', 'en')).toBe('/pricing')
    expect(localizedPath('/outils/monitoring', 'en')).toBe('/tools/monitoring')
    expect(localizedPath('/scanner', 'en')).toBe('/scanner') // pas dans la map → identique
  })
})

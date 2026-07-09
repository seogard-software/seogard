import { describe, it, expect } from 'vitest'
import { buildLanguageItems } from '../../shared/utils/language-switcher'

// switchLocalePath simulé : slugs traduits (fr → en) pour la page /fr/tarifs.
const tarifsPath = (code: 'fr' | 'en') => (code === 'fr' ? '/fr/tarifs' : '/en/pricing')

describe('buildLanguageItems — sélecteur de langue', () => {
  it('page normale : les 2 langues, EN pointe vers le slug TRADUIT (pas /en/tarifs)', () => {
    const items = buildLanguageItems({ codes: ['fr', 'en'], current: 'fr', path: tarifsPath })
    expect(items.map(i => i.code)).toEqual(['fr', 'en'])
    const en = items.find(i => i.code === 'en')!
    expect(en.active).toBe(false)
    expect(en.to).toBe('/en/pricing') // slug traduit, jamais /en/tarifs
    expect(items.find(i => i.code === 'fr')!.active).toBe(true)
  })

  it('langue sans chemin traduit valide : exclue (sauf la courante)', () => {
    const path = (code: 'fr' | 'en') => (code === 'fr' ? '/fr/x' : '')
    const items = buildLanguageItems({ codes: ['fr', 'en'], current: 'fr', path })
    expect(items.map(i => i.code)).toEqual(['fr'])
  })

  it('sur la version EN, la langue active est bien EN', () => {
    const items = buildLanguageItems({ codes: ['fr', 'en'], current: 'en', path: tarifsPath })
    expect(items.find(i => i.code === 'en')!.active).toBe(true)
    expect(items.find(i => i.code === 'fr')!.active).toBe(false)
  })
})

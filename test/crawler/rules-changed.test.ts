import { describe, it, expect } from 'vitest'
import { runRule, type RuleContext } from '../../crawler/rules/engine'
// Enregistrement des règles (side-effect)
import '../../crawler/rules/meta'
import '../../crawler/rules/heading'

// Fixture minimale : les règles _changed ne lisent que oldMeta / newMeta.
function ctx(oldMeta: Record<string, unknown>, newMeta: Record<string, unknown>): RuleContext {
  return { oldMeta, newMeta } as unknown as RuleContext
}
const h1 = (text: string) => ({ headings: [{ level: 1, text }] })

describe('règles _changed — normalisation anti-faux-positifs (encodage / espaces)', () => {
  // ── meta_title_changed ──
  it('meta_title_changed : encodage (Café vs Caf&eacute;) → NE fire PAS', () => {
    expect(runRule('meta_title_changed', ctx({ title: 'Café' }, { title: 'Caf&eacute;' }))).toHaveLength(0)
  })
  it('meta_title_changed : espace en trop → NE fire PAS', () => {
    expect(runRule('meta_title_changed', ctx({ title: 'Accueil' }, { title: 'Accueil ' }))).toHaveLength(0)
    expect(runRule('meta_title_changed', ctx({ title: 'Mon titre' }, { title: 'Mon  titre' }))).toHaveLength(0)
  })
  it('meta_title_changed : vrai changement → fire', () => {
    expect(runRule('meta_title_changed', ctx({ title: 'Accueil' }, { title: 'Boutique' }))).toHaveLength(1)
  })

  // ── meta_description_changed ──
  it('meta_description_changed : encodage → NE fire PAS', () => {
    expect(runRule('meta_description_changed', ctx({ description: "L'outil & co" }, { description: 'L&#39;outil &amp; co' }))).toHaveLength(0)
  })
  it('meta_description_changed : espace → NE fire PAS', () => {
    expect(runRule('meta_description_changed', ctx({ description: 'Une description' }, { description: '  Une description  ' }))).toHaveLength(0)
  })
  it('meta_description_changed : vrai changement → fire', () => {
    expect(runRule('meta_description_changed', ctx({ description: 'Avant' }, { description: 'Après, tout neuf' }))).toHaveLength(1)
  })

  // ── canonical_changed ──
  it('canonical_changed : &amp; encodé dans la query string → NE fire PAS', () => {
    expect(runRule('canonical_changed', ctx(
      { canonical: 'https://x.com/p?a=1&b=2' },
      { canonical: 'https://x.com/p?a=1&amp;b=2' },
    ))).toHaveLength(0)
  })
  it('canonical_changed : URL réellement différente → fire', () => {
    expect(runRule('canonical_changed', ctx(
      { canonical: 'https://x.com/page-a' },
      { canonical: 'https://x.com/page-b' },
    ))).toHaveLength(1)
  })

  // ── h1_changed ──
  it('h1_changed : encodage → NE fire PAS', () => {
    expect(runRule('h1_changed', ctx(h1('Café crème'), h1('Caf&eacute; crème')))).toHaveLength(0)
  })
  it('h1_changed : espace → NE fire PAS', () => {
    expect(runRule('h1_changed', ctx(h1('Bienvenue'), h1('Bienvenue ')))).toHaveLength(0)
  })
  it('h1_changed : vrai changement → fire', () => {
    expect(runRule('h1_changed', ctx(h1('Bienvenue'), h1('Nos produits')))).toHaveLength(1)
  })
})

describe('règles _changed — anti sur-normalisation + valeurs brutes', () => {
  it('changement de CASSE → fire (la casse n\'est PAS masquée)', () => {
    expect(runRule('meta_title_changed', ctx({ title: 'Accueil' }, { title: 'accueil' }))).toHaveLength(1)
    expect(runRule('h1_changed', ctx(h1('Bienvenue'), h1('bienvenue')))).toHaveLength(1)
  })

  it('espace insécable (\\u00A0) traité comme un espace normal → NE fire PAS', () => {
    const nbsp = String.fromCharCode(160) // espace insécable \u00A0
    expect(runRule('meta_title_changed', ctx({ title: 'Mon titre' }, { title: `Mon${nbsp}titre` }))).toHaveLength(0)
  })

  it('quand ça fire, previousValue / currentValue gardent les valeurs BRUTES (non normalisées)', () => {
    const res = runRule('meta_title_changed', ctx({ title: 'Ancien titre' }, { title: 'Nouveau &amp; co' }))
    expect(res).toHaveLength(1)
    expect(res[0]?.previousValue).toBe('Ancien titre')
    expect(res[0]?.currentValue).toBe('Nouveau &amp; co') // entité NON décodée dans l'affichage
  })
})

import { describe, it, expect } from 'vitest'
import frRules from '../../i18n/locales/fr/rules.json' with { type: 'json' }
import { RAW_RULES } from '../../shared/utils/rules-list'

// TRIPWIRE anti-accents-strippés (incident 2026-07 : 31 fiches FR livrées en masse sans diacritiques).
// Le tripwire no-hardcoded-french ne scanne QUE les .vue → il ne voit pas rules.json. Ici on vérifie
// l'INVERSE : chaque fiche FR est du vrai français accentué. Un paragraphe français de plusieurs
// centaines de lettres sans le moindre accent = texte strippé → build cassé.
// (Seuil très permissif : le vrai français tourne à 3-5 % de lettres accentuées ; on échoue sous 1 %.)

const ACCENTED = /[àâäéèêëîïôöùûüÿçœæ]/gi
const LETTERS = /[a-zàâäéèêëîïôöùûüÿçœæ]/gi

interface Fiche {
  tldr?: string
  seoTitle?: string
  h1?: string
  metaDescription?: string
  scanHook?: string
  whenNotAProblem?: string[]
  actionSteps?: string[]
  exemple?: { note?: string }
  faq?: { q: string, a: string }[]
}

const knowledge = frRules.knowledge as Record<string, Fiche>

// Texte FR en prose d'une fiche (hors code de l'exemple, qui peut légitimement avoir peu d'accents).
function proseOf(k: Fiche): string {
  return [
    k.tldr, k.seoTitle, k.h1, k.metaDescription, k.scanHook, k.exemple?.note,
    ...(k.whenNotAProblem ?? []),
    ...(k.actionSteps ?? []),
    ...(k.faq ?? []).flatMap(f => [f.q, f.a]),
  ].filter(Boolean).join(' ')
}

describe('fiches FR — vrai français accentué (anti-strip)', () => {
  it.each(RAW_RULES.map(r => [r.id]))('%s : la fiche FR n\'est pas strippée de ses accents', (id) => {
    const k = knowledge[id]
    if (!k?.tldr) return // règle sans fiche rédigée (skip)
    const prose = proseOf(k)
    const letters = (prose.match(LETTERS) ?? []).length
    if (letters < 300) return // trop court pour conclure
    const accents = (prose.match(ACCENTED) ?? []).length
    const ratio = accents / letters
    expect(ratio, `${id} : ${accents} accents sur ${letters} lettres (ratio ${(ratio * 100).toFixed(2)}%) — français strippé ?`).toBeGreaterThan(0.01)
  })
})

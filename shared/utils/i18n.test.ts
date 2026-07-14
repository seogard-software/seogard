import { describe, it, expect } from 'vitest'
import { localeFromAcceptLanguage, toLocale, isLocale } from './i18n'

// localeFromAcceptLanguage = source unique de la locale d'un nouvel inscrit (email + OAuth).
// Règle : français détecté explicitement → 'fr' ; tout le reste (anglais + langues non gérées) → 'en'
// (défaut EN volontaire pour l'audience internationale). Distinct de DEFAULT_LOCALE (fr, SEO).
describe('localeFromAcceptLanguage', () => {
  it('rend "fr" seulement quand le navigateur préfère le français', () => {
    expect(localeFromAcceptLanguage('fr-FR,fr;q=0.9')).toBe('fr')
    expect(localeFromAcceptLanguage('FR')).toBe('fr') // insensible à la casse
    expect(localeFromAcceptLanguage('  fr-CA ')).toBe('fr') // insensible aux espaces
  })

  it('rend "en" pour l anglais', () => {
    expect(localeFromAcceptLanguage('en-AU,en;q=0.9')).toBe('en') // le cas Marko (Australie)
    expect(localeFromAcceptLanguage('en-US')).toBe('en')
  })

  it('rend "en" (défaut international) pour toute langue non gérée', () => {
    expect(localeFromAcceptLanguage('de-DE')).toBe('en')
    expect(localeFromAcceptLanguage('fa-IR')).toBe('en') // farsi (Iran)
    expect(localeFromAcceptLanguage('es')).toBe('en')
  })

  it('rend "en" (défaut) quand l en-tête est absent / vide', () => {
    expect(localeFromAcceptLanguage('')).toBe('en')
    expect(localeFromAcceptLanguage(null)).toBe('en')
    expect(localeFromAcceptLanguage(undefined)).toBe('en')
  })

  it('ne renvoie jamais une valeur hors du type Locale', () => {
    for (const input of ['en', 'fr', '', 'xx', null, undefined]) {
      expect(isLocale(localeFromAcceptLanguage(input))).toBe(true)
    }
  })

  it('toLocale reste inchangé (coercition d une valeur stockée)', () => {
    expect(toLocale('en')).toBe('en')
    expect(toLocale('zz')).toBe('fr')
    expect(toLocale(undefined)).toBe('fr')
  })
})

import type { Locale } from '../../shared/utils/i18n'
import { DEFAULT_LOCALE } from '../../shared/utils/i18n'

// Traduction CÔTÉ SERVEUR (emails, rapports .md/PDF, erreurs) — lit les MÊMES fichiers de
// locale que le front (i18n/locales/<locale>/*.json), importés statiquement (bundlés par
// Nitro, zéro I/O runtime). Clés en dot-notation « domaine.chemin.clé » ; interpolation
// {param} ; fallback : locale demandée → FR → la clé elle-même (jamais de throw : un email
// doit partir même si une clé manque).
import frCommon from '../../i18n/locales/fr/common.json' with { type: 'json' }
import frEmails from '../../i18n/locales/fr/emails.json' with { type: 'json' }
import frReport from '../../i18n/locales/fr/report.json' with { type: 'json' }
import frRules from '../../i18n/locales/fr/rules.json' with { type: 'json' }
import frErrors from '../../i18n/locales/fr/errors.json' with { type: 'json' }
import enCommon from '../../i18n/locales/en/common.json' with { type: 'json' }
import enEmails from '../../i18n/locales/en/emails.json' with { type: 'json' }
import enReport from '../../i18n/locales/en/report.json' with { type: 'json' }
import enRules from '../../i18n/locales/en/rules.json' with { type: 'json' }
import enErrors from '../../i18n/locales/en/errors.json' with { type: 'json' }

type Messages = Record<string, unknown>

const MESSAGES: Record<Locale, Record<string, Messages>> = {
  fr: { common: frCommon, emails: frEmails, report: frReport, rules: frRules, errors: frErrors },
  en: { common: enCommon, emails: enEmails, report: enReport, rules: enRules, errors: enErrors },
}

function resolve(locale: Locale, key: string): string | undefined {
  const [domain, ...path] = key.split('.')
  let node: unknown = MESSAGES[locale]?.[domain!]
  // Les fichiers partagés avec le front sont enveloppés dans leur domaine ({ errors: {...} }) —
  // les fichiers serveur purs (emails, report, rules) sont à plat. On déballe si besoin.
  if (node != null && typeof node === 'object' && domain! in (node as Messages)) {
    const inner = (node as Messages)[domain!]
    if (inner != null && typeof inner === 'object') node = inner
  }
  for (const segment of path) {
    if (node == null || typeof node !== 'object') return undefined
    node = (node as Messages)[segment]
  }
  return typeof node === 'string' ? node : undefined
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const template = resolve(locale, key) ?? (locale !== DEFAULT_LOCALE ? resolve(DEFAULT_LOCALE, key) : undefined) ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole))
}

/**
 * Pluriel : résout `${key}_one` / `${key}_other` selon la règle de la locale
 * (fr : n > 1 → other ; en : n ≠ 1 → other) et injecte {count} — un params.count
 * explicite (ex. nombre déjà formaté pour l'affichage) a priorité sur le nombre brut.
 */
export function tc(locale: Locale, key: string, count: number, params?: Record<string, string | number>): string {
  const form = locale === 'fr' ? (count > 1 ? 'other' : 'one') : (count === 1 ? 'one' : 'other')
  return t(locale, `${key}_${form}`, { count, ...params })
}

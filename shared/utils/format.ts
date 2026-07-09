import type { Locale } from './i18n'
import { DEFAULT_LOCALE } from './i18n'

// Séparateur décimal du format compact par locale (43,2k en FR, 43.2k en EN).
const DECIMAL_SEPARATOR: Record<Locale, string> = { fr: ',', en: '.' }
// Tag BCP 47 par locale pour les API Intl (toLocaleDateString/toLocaleString) — SOURCE UNIQUE.
export const INTL_LOCALE: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US' }

/**
 * Format a number for display, in the given locale:
 * - < 1000: as-is (e.g. "42", "999")
 * - 1000-9999: locale thousands separator (e.g. "1 234" fr / "1,234" en)
 * - 10000+: compact with 1 decimal (e.g. "43,2k" fr / "43.2k" en)
 */
export function formatNumber(n: number | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  if (n == null) return '—'
  if (n < 1_000) return n.toString()
  if (n < 10_000) return n.toLocaleString(INTL_LOCALE[locale])

  const sep = DECIMAL_SEPARATOR[locale]

  if (n < 1_000_000) {
    const k = n / 1_000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace('.', sep)}k`
  }

  const m = n / 1_000_000
  return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', sep)}M`
}

/**
 * Format a number for display:
 * - < 1000: as-is (e.g. "42", "999")
 * - 1000-9999: with space (e.g. "1 234")
 * - 10000+: compact with 1 decimal (e.g. "43,2k", "1,3M")
 */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n < 1_000) return n.toString()
  if (n < 10_000) return n.toLocaleString('fr-FR')

  if (n < 1_000_000) {
    const k = n / 1_000
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1).replace('.', ',')}k`
  }

  const m = n / 1_000_000
  return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1).replace('.', ',')}M`
}

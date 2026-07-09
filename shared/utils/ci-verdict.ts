import type { CiStrictness } from '../types/site'

export interface CiAlertCounts { critical: number, warning: number, info: number }
export interface CiVerdict { pass: boolean, message: string }

// Verdict CI/CD selon la strictness (de la ZONE) et les alertes du crawl.
// strict   : bloque dès 1 critical OU 1 warning.
// standard : bloque dès 1 critical.
// relaxed  : bloque à partir de 5 critical.
export function computeCiVerdict(strictness: CiStrictness, counts: CiAlertCounts): CiVerdict {
  const { critical, warning } = counts
  switch (strictness) {
    case 'strict': {
      const pass = critical === 0 && warning === 0
      return { pass, message: pass ? 'No alerts detected' : `${critical} critical, ${warning} warning(s)` }
    }
    case 'relaxed': {
      const pass = critical < 5
      return { pass, message: pass ? `${critical} critical alert(s) (threshold: 5)` : `${critical} critical alert(s) — threshold of 5 exceeded` }
    }
    default: { // standard
      const pass = critical === 0
      return { pass, message: pass ? 'No critical regression detected' : `${critical} critical alert(s) detected` }
    }
  }
}

// Médiane d'une série numérique. Robuste aux valeurs aberrantes (contrairement à la
// moyenne) → utilisée pour afficher une valeur perf synthétique stable (LCP/CLS/TTFB
// varient fortement d'un crawl à l'autre, un pic isolé ne doit pas fausser la carte).
// Retourne null pour une série vide.
export function median(nums: number[]): number | null {
  if (nums.length === 0) return null
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

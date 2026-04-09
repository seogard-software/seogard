/**
 * Zone pattern matching utilities
 *
 * Syntax:
 *   "**"           → matches everything
 *   "/blog/**"     → matches /blog/ and all sub-paths recursively
 *   "/blog/*"      → matches /blog/something (one level only)
 *   ["/a/**", "/b/**"] → matches either /a/ or /b/ sub-paths
 */

/**
 * Converts a single pattern to a regex source string.
 * "**"          → ".*"
 * "/blog/**"    → "\/blog\/.*"
 * "/produits/*" → "\/produits\/[^/]+"
 */
function patternToRegexSource(pattern: string): string {
  if (pattern === '**') return '.*'

  // Check if pattern uses only single * (not **) — needs end anchor
  const hasGlobstar = pattern.includes('**')

  // Escape regex chars except * which we handle
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]+')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*')

  // If no globstar, add end anchor so /blog/* doesn't match /blog/a/b
  return hasGlobstar ? escaped : `${escaped}$`
}

/**
 * Converts an array of patterns to a single RegExp.
 * Used for MongoDB queries and client-side matching.
 */
export function patternsToRegex(patterns: string[]): RegExp {
  if (patterns.length === 0) return /(?!)/  // match nothing
  if (patterns.length === 1 && patterns[0] === '**') return /^/  // match everything

  const parts = patterns.map(patternToRegexSource)
  return new RegExp(`^(${parts.join('|')})`)
}

/**
 * Returns the regex source string for storage in DB (_patternsRegex field).
 * Avoids recompiling on every query.
 */
export function patternsToRegexSource(patterns: string[]): string {
  if (patterns.length === 0) return '(?!)'
  if (patterns.length === 1 && patterns[0] === '**') return '^'

  const parts = patterns.map(patternToRegexSource)
  return `^(${parts.join('|')})`
}

/**
 * Checks if a pathname matches any of the patterns (client-side).
 */
export function matchesPatterns(pathname: string, patterns: string[]): boolean {
  return patternsToRegex(patterns).test(pathname)
}

/**
 * Normalizes a pattern: trims trailing slash, preserves user intent.
 * "/blog"    → "/blog"    (exact page match)
 * "/blog/"   → "/blog"    (trailing slash cleaned)
 * "/blog/**" → "/blog/**" (sub-paths, unchanged)
 */
export function normalizePattern(pattern: string): string {
  if (pattern === '**') return pattern
  if (!pattern.includes('*')) {
    return pattern.endsWith('/') ? pattern.slice(0, -1) : pattern
  }
  return pattern
}

/**
 * Validates a pattern string.
 * Must start with "/" or be "**".
 */
export function isValidPattern(pattern: string): boolean {
  if (pattern === '**') return true
  if (!pattern.startsWith('/')) return false
  if (pattern.length < 2) return false
  return true
}

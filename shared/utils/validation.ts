export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    // Le constructeur URL de Chromium ACCEPTE les espaces du hostname (encodés %20) là où
    // Node rejette : « https://pas une url » passait côté navigateur. Un hostname réel =
    // labels alphanumériques/tirets séparés par des points (localhost et IP inclus).
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i.test(parsed.hostname)
  }
  catch {
    return false
  }
}

export function normalizeUrl(url: string): string {
  const parsed = new URL(url)
  return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/$/, '')
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

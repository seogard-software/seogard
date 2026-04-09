export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
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

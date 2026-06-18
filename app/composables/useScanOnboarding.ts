// Onboarding « scan » (barre Analyser) : orchestre URL → (inscription si déconnecté) → site
// créé/retrouvé + crawl auto → overview. L'URL est persistée dans localStorage pour survivre aux
// redirections externes (OAuth / SAML / SSO) ; la reprise au retour est faite par la page
// /dashboard/sites (point d'atterrissage du callback). Le crawl auto est déclenché côté serveur.

const PENDING_KEY = 'seogard:pendingScan'

export interface ScanResult {
  existing?: boolean
  created?: boolean
  siteId: string
  defaultZoneId: string | null
}

export function useScanOnboarding() {
  // Router capturé au setup : navigateTo() perd le contexte Nuxt après un await (ex. le $fetch
  // ci-dessous) ; router.push n'en a pas besoin → navigation fiable depuis un async.
  const router = useRouter()

  // Garde sur `typeof localStorage` (et non import.meta.client) : équivalent SSR/client ET testable.
  function persistPending(url: string) {
    if (typeof localStorage !== 'undefined') localStorage.setItem(PENDING_KEY, url)
  }
  function readPending(): string | null {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(PENDING_KEY) : null
  }
  function clearPending() {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(PENDING_KEY)
  }

  // Appelle /api/scan (création OU site déjà présent) et renvoie le chemin de l'overview du site.
  async function scanPath(url: string): Promise<string> {
    const res = await $fetch<ScanResult>('/api/scan', { method: 'POST', body: { url } })
    return `/dashboard/sites/${res.siteId}`
  }

  // Lance le scan et navigue vers le site renvoyé (router pré-capturé → pas de perte de contexte).
  async function runScan(url: string): Promise<void> {
    const path = await scanPath(url)
    clearPending()
    await router.push(path)
  }

  return { persistPending, readPending, clearPending, scanPath, runScan }
}

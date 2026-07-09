import type { Locale } from './i18n'
import { DEFAULT_LOCALE } from './i18n'
import { INTL_LOCALE } from './format'

// Source de verite unique — prix par page crawlée
// La valeur par défaut (0.01) est overridée par NUXT_PUBLIC_PRICE_PER_PAGE en prod
// via runtimeConfig.public.pricePerPage (défini dans nuxt.config.ts)
export const CLOUD_PRICE_PER_PAGE_DEFAULT = 0.01

export function getCloudPricePerPage(): number {
  try {
    // Nuxt runtime config (client + server, valeur runtime)
    const config = useRuntimeConfig()
    return Number(config.public.pricePerPage) || CLOUD_PRICE_PER_PAGE_DEFAULT
  }
  catch {
    // Hors contexte Nuxt (crawler, scripts, tests)
    return Number(process.env.NUXT_PUBLIC_PRICE_PER_PAGE) || CLOUD_PRICE_PER_PAGE_DEFAULT
  }
}

export function calculateCloudPrice(pages: number): number {
  return pages * getCloudPricePerPage()
}

// Nombre issu de pricing.ts ; seul le séparateur décimal dépend de la langue (0,01 fr / 0.01 en).
// La devise ($ / €) reste dans les chaînes de traduction, pas ici.
export function formatCloudPrice(locale: 'fr' | 'en' = 'fr'): string {
  const raw = String(getCloudPricePerPage())
  return locale === 'en' ? raw : raw.replace('.', ',')
}

export const PRICE_EXAMPLES = [1_000, 5_000, 10_000, 50_000] as const

// label (nb de pages) ET price formatés dans la locale demandée (llms-full = EN, CGV = FR).
export function getPriceExamples(locale: Locale = DEFAULT_LOCALE) {
  const intl = INTL_LOCALE[locale]
  return PRICE_EXAMPLES.map(pages => ({
    pages,
    label: pages.toLocaleString(intl),
    price: calculateCloudPrice(pages).toLocaleString(intl, { minimumFractionDigits: 0 }),
  }))
}

// ── Landing pricing table ──

// `key` = clé i18n stable : le libellé FR vit dans les locales sous
// `landing.pricing.features.<key>` (rulesCount attend un paramètre {count} = RULES_COUNT).
export interface PricingRow {
  key: string
  selfHosted: boolean
  cloud: boolean
  enterprise: boolean
}

export const PRICING_ROWS: PricingRow[] = [
  // Shared features (all plans)
  { key: 'ssrDiff', selfHosted: true, cloud: true, enterprise: true },
  { key: 'rulesCount', selfHosted: true, cloud: true, enterprise: true },
  { key: 'alerts', selfHosted: true, cloud: true, enterprise: true },
  { key: 'diff', selfHosted: true, cloud: true, enterprise: true },
  { key: 'metaDetection', selfHosted: true, cloud: true, enterprise: true },
  { key: 'statusDetection', selfHosted: true, cloud: true, enterprise: true },
  { key: 'severity', selfHosted: true, cloud: true, enterprise: true },
  { key: 'monitoring', selfHosted: true, cloud: true, enterprise: true },
  { key: 'dashboard', selfHosted: true, cloud: true, enterprise: true },
  { key: 'history', selfHosted: true, cloud: true, enterprise: true },
  { key: 'sitemapDiscovery', selfHosted: true, cloud: true, enterprise: true },
  { key: 'cicd', selfHosted: true, cloud: true, enterprise: true },
  { key: 'api', selfHosted: true, cloud: true, enterprise: true },
  { key: 'unlimited', selfHosted: true, cloud: true, enterprise: true },
  // Cloud + Enterprise
  { key: 'managedInfra', selfHosted: false, cloud: true, enterprise: true },
  { key: 'autoUpdates', selfHosted: false, cloud: true, enterprise: true },
  { key: 'backups', selfHosted: false, cloud: true, enterprise: true },
  { key: 'prioritySupport', selfHosted: false, cloud: true, enterprise: true },
  { key: 'sla', selfHosted: false, cloud: true, enterprise: true },
  { key: 'multiOrg', selfHosted: false, cloud: true, enterprise: true },
  { key: 'onboarding', selfHosted: false, cloud: true, enterprise: true },
  // Enterprise-only
  { key: 'sso', selfHosted: false, cloud: true, enterprise: true },
  { key: 'customSetup', selfHosted: false, cloud: false, enterprise: true },
  { key: 'customDev', selfHosted: false, cloud: false, enterprise: true },
  { key: 'accountManager', selfHosted: false, cloud: false, enterprise: true },
  { key: 'training', selfHosted: false, cloud: false, enterprise: true },
  { key: 'customDeploy', selfHosted: false, cloud: false, enterprise: true },
  { key: 'customBilling', selfHosted: false, cloud: false, enterprise: true },
]

export const PRICING_SHARED_COUNT = PRICING_ROWS.filter(r => r.selfHosted && r.cloud && r.enterprise).length
export const PRICING_CLOUD_COUNT = PRICING_ROWS.filter(r => !r.selfHosted && r.cloud && r.enterprise).length

// ── Subscription helpers ──

export function canUseCrawls(status: string | undefined, userTrialEndsAt?: Date | string | null): boolean {
  if (status === 'active') return true
  if (status === 'past_due') return true
  if (status === 'trialing') {
    if (!userTrialEndsAt) return false
    return new Date(userTrialEndsAt).getTime() > Date.now()
  }
  return false
}

export function getTrialDaysLeft(trialEndsAt: string | Date | null | undefined): number {
  if (!trialEndsAt) return 0
  const ms = new Date(trialEndsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

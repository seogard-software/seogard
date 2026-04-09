// Source de verite unique — prix par page crawlée
// La valeur par défaut (0.007) est overridée par NUXT_PUBLIC_PRICE_PER_PAGE en prod
// via runtimeConfig.public.pricePerPage (défini dans nuxt.config.ts)
export const CLOUD_PRICE_PER_PAGE_DEFAULT = 0.007

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

export function formatCloudPrice(): string {
  // Pas d'arrondi — affiche la valeur brute (ex: "0,007")
  return String(getCloudPricePerPage()).replace('.', ',')
}

export const PRICE_EXAMPLES = [
  { pages: 1_000, label: '1 000' },
  { pages: 5_000, label: '5 000' },
  { pages: 10_000, label: '10 000' },
  { pages: 50_000, label: '50 000' },
] as const

export function getPriceExamples() {
  return PRICE_EXAMPLES.map(ex => ({
    ...ex,
    price: calculateCloudPrice(ex.pages).toLocaleString('fr-FR', { minimumFractionDigits: 0 }),
  }))
}

// ── Landing pricing table ──

export interface PricingRow {
  label: string
  selfHosted: boolean
  cloud: boolean
  enterprise: boolean
}

export const PRICING_ROWS: PricingRow[] = [
  // Shared features (all plans)
  { label: 'Comparaison HTML brut vs rendu JS', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Des centaines de règles SEO + GEO (visibilité IA)', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Alertes instantanées et intelligentes (Email, Slack, Teams, Jira)', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Diff exact avant/après sur chaque régression', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Détection meta disparues, canonicals cassés, noindex', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Détection erreurs 5xx, soft 404, changements de status', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Sévérité intelligente (critique, warning, info)', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Monitoring continu illimité', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Dashboard temps réel avec suivi de crawl en direct', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Historique complet de chaque page sur 12 mois', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Découverte automatique des pages via sitemap', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Webhook CI/CD intégré', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Accès API REST complet', selfHosted: true, cloud: true, enterprise: true },
  { label: 'Sites et utilisateurs illimités', selfHosted: true, cloud: true, enterprise: true },
  // Cloud + Enterprise
  { label: 'Infrastructure gérée, zéro maintenance', selfHosted: false, cloud: true, enterprise: true },
  { label: 'Mises à jour automatiques', selfHosted: false, cloud: true, enterprise: true },
  { label: 'Backups quotidiens', selfHosted: false, cloud: true, enterprise: true },
  { label: 'Support prioritaire', selfHosted: false, cloud: true, enterprise: true },
  { label: 'SLA 99.9%', selfHosted: false, cloud: true, enterprise: true },
  { label: 'Dashboard multi-organisations', selfHosted: false, cloud: true, enterprise: true },
  { label: 'Onboarding assisté', selfHosted: false, cloud: true, enterprise: true },
  // Enterprise-only
  { label: 'SSO / SAML', selfHosted: false, cloud: true, enterprise: true },
  { label: 'Setup et configuration sur mesure', selfHosted: false, cloud: false, enterprise: true },
  { label: 'Développements spécifiques à la demande', selfHosted: false, cloud: false, enterprise: true },
  { label: 'Account manager dédié', selfHosted: false, cloud: false, enterprise: true },
  { label: 'Formation équipe incluse', selfHosted: false, cloud: false, enterprise: true },
  { label: 'Déploiement dans votre infrastructure', selfHosted: false, cloud: false, enterprise: true },
  { label: 'Facturation personnalisée', selfHosted: false, cloud: false, enterprise: true },
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

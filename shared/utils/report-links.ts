import type { ZoneReport } from '../types/zone-report'

// Liens & noms de fichiers du rapport d'une zone — SOURCE UNIQUE (page, email, downloads, stockage).
// Évite de hardcoder ces chemins/noms à plusieurs endroits.

/** Chemin de la page rapport (historique des crawls) d'une zone. */
export function zoneReportPath(siteId: string, zoneId: string): string {
  return `/dashboard/sites/${siteId}/zones/${zoneId}/report`
}

/** Chemin de téléchargement du rapport figé d'un crawl (.md ou .pdf). */
export function crawlReportDownloadPath(siteId: string, zoneId: string, crawlId: string, format: 'md' | 'pdf'): string {
  return `/api/sites/${siteId}/zones/${zoneId}/report.${format}?crawlId=${crawlId}`
}

/** Clé de stockage objet (R2/S3) d'un fichier rapport figé. */
export function crawlReportStorageKey(siteId: string, zoneId: string, crawlId: string, format: 'md' | 'pdf'): string {
  return `reports/${siteId}/${zoneId}/${crawlId}.${format}`
}

/** Nom de fichier téléchargé : seogard-rapport-{domaine}-{zone}-{date}.{ext} (date = celle du crawl). */
export function reportFilename(report: ZoneReport, ext: 'md' | 'pdf'): string {
  const slug = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'zone'
  const date = (report.meta.crawlCompletedAt ?? report.meta.generatedAt).slice(0, 10)
  return `seogard-rapport-${slug(report.meta.siteDomain)}-${slug(report.meta.zoneName)}-${date}.${ext}`
}

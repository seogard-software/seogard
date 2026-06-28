// Logique PURE de comparaison « pages connues vs sitemap courant » (testable sans DB).
// Décide UNIQUEMENT le marquage d'appartenance (quelles URL viennent de quitter le sitemap, lesquelles
// y reviennent). Le COUNT, le nonOkCount et l'email sont calculés en FIN de crawl (finalizeCrawl) sur
// des statuts FRAIS — pas ici. À n'appeler QUE si le sitemap a été récupéré avec succès (garde côté appelant).

export interface SitemapPageSnapshot {
  url: string
  outOfSitemapSince?: Date | null
}

export interface SitemapDiff {
  /** Pages qui étaient hors-sitemap et y reviennent → effacer outOfSitemapSince. */
  returnedUrls: string[]
  /** Nouvelles disparues à horodater (outOfSitemapSince). */
  toMarkUrls: string[]
}

export function computeSitemapDiff(existing: SitemapPageSnapshot[], sitemapUrls: string[]): SitemapDiff {
  const sitemapSet = new Set(sitemapUrls)
  const removed = existing.filter(p => !sitemapSet.has(p.url))

  const returnedUrls = existing.filter(p => p.outOfSitemapSince && sitemapSet.has(p.url)).map(p => p.url)
  const toMarkUrls = removed.filter(p => !p.outOfSitemapSince).map(p => p.url)

  return { returnedUrls, toMarkUrls }
}

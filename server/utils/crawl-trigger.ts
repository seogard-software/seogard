import type { Types } from 'mongoose'
import { Crawl } from '../database/models'

export type CrawlTrigger = 'manual' | 'webhook' | 'scheduled'

// Crée un crawl pour un site sur une ZONE — zoneId OBLIGATOIRE : un crawl appartient toujours
// à une zone (la zone par défaut « Toutes les pages » existe dès la création du site pour ça).
// L'appelant fournit la zone de son contexte ; zone par défaut = site entier côté crawler.
// SOURCE UNIQUE de création de crawl : CTA dashboard (manual), webhook CI/CD (webhook),
// scheduler (scheduled), API interne prospect (manual).
export async function triggerSiteCrawl(
  siteId: Types.ObjectId | string,
  zoneId: Types.ObjectId | string,
  trigger: CrawlTrigger = 'manual',
) {
  const crawl = await Crawl.create({
    siteId,
    zoneId,
    trigger,
    status: 'pending',
  })
  if (!crawl) throw createError({ statusCode: 500, message: 'Database insert failed' })

  return crawl
}

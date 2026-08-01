import mongoose from 'mongoose'
import { MonitoredPage, Alert, PageSnapshot } from '../server/database/models'
import { normalizePageUrl } from '../shared/utils/sitemap'

/**
 * Aligne les URLs de page racine sur la cle unique (avec slash final).
 *
 * Sans ca, chaque crawl recree une fiche fantome : la file dépile l'URL sans slash,
 * la phase SSR normalise avec slash et ne retrouve pas la fiche existante.
 *
 *   yarn tsx scripts/migrate-page-url-key.ts            # simulation
 *   yarn tsx scripts/migrate-page-url-key.ts --apply    # ecriture
 *
 * Idempotent : une fois passe, plus aucune racine sans slash, donc aucun effet.
 */

const apply = process.argv.includes('--apply')

async function main(): Promise<void> {
  const uri = process.env.DATABASE_URL
  if (!uri) throw new Error('DATABASE_URL est requis')
  await mongoose.connect(uri)

  const stale = await MonitoredPage.find({ pathname: '/', url: { $not: /\/$/ } })
    .select('_id siteId url lastCheckedAt')
    .lean()

  const counters = { pages: 0, fusionnees: 0, renommees: 0, alertesDeplacees: 0, alertesEnDouble: 0, snapshotsRattaches: 0 }

  for (const page of stale) {
    const target = normalizePageUrl(page.url)
    if (target === page.url) continue
    counters.pages++

    const existing = await MonitoredPage.findOne({ siteId: page.siteId, url: target }).select('_id').lean()

    // Les alertes de la fiche fantome rejoignent la cle cible. Une alerte OUVERTE
    // deja presente sur la cible gagne : l'index unique (siteId, pageUrl, ruleId)
    // interdit le doublon, et c'est la cible qui est reellement crawlee.
    const alerts = await Alert.find({ siteId: page.siteId, pageUrl: page.url }).select('_id ruleId status').lean()
    for (const alert of alerts) {
      const clash = alert.status === 'open'
        && await Alert.exists({ siteId: page.siteId, pageUrl: target, ruleId: alert.ruleId, status: 'open' })

      if (clash) {
        counters.alertesEnDouble++
        if (apply) await Alert.deleteOne({ _id: alert._id })
      }
      else {
        counters.alertesDeplacees++
        if (apply) await Alert.updateOne({ _id: alert._id }, { $set: { pageUrl: target } })
      }
    }

    if (existing) {
      counters.fusionnees++
      // Les snapshots sont RATTACHES a la fiche cible, jamais supprimes : ils portent
      // l'historique. Aucun index unique sur (pageId, crawlId), donc pas de collision.
      counters.snapshotsRattaches += await PageSnapshot.countDocuments({ pageId: page._id })
      if (apply) {
        await PageSnapshot.updateMany({ pageId: page._id }, { $set: { pageId: existing._id } })
        await MonitoredPage.deleteOne({ _id: page._id })
      }
    }
    else {
      counters.renommees++
      if (apply) await MonitoredPage.updateOne({ _id: page._id }, { $set: { url: target } })
    }
  }

  const restant = apply
    ? await MonitoredPage.countDocuments({ pathname: '/', url: { $not: /\/$/ } })
    : counters.pages

  console.info(JSON.stringify({ mode: apply ? 'ecriture' : 'simulation', ...counters, restantApres: restant }, null, 2))
  await mongoose.disconnect()
}

main().catch(async (error: unknown) => {
  console.error((error as Error).message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})

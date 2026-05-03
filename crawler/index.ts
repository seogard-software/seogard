import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from './db'
import { Site, Crawl, MonitoredPage, Organization, User, Zone, Lead  } from '../server/database/models'
import { extractPathname } from '../server/database/models/monitored-page'
import { createLogger } from './logger'
import { initBrowser, closeBrowser, getBrowser } from './renderer'
import { initCrawl, processPages } from './worker'
import { sendSitemapBlockedNotification, sendSitemapInvalidHostnameNotification, sendEstimateEmail  } from './notifications'
import { getRedis, disconnectRedis, getActiveCrawls, addActiveCrawl, removeActiveCrawl, claimDistributionLock, clearDistributionLock, pushPages, getRemainingPages, getProgress } from './redis'
import { discoverPages, setBrowser } from './sitemap'
import { discoverSitemapHttp } from '../shared/utils/sitemap'
import { matchesPatterns } from '../shared/utils/zone'
import { calculateCloudPrice } from '../shared/utils/pricing'

const log = createLogger('main')

const POLL_INTERVAL_MS = 1_000

async function main() {
  log.info({ pollIntervalMs: POLL_INTERVAL_MS }, 'crawler worker starting')

  await connectDB()
  await initBrowser()
  setBrowser(getBrowser()!) // share browser with sitemap module
  getRedis() // connect early

  // Graceful shutdown
  const shutdown = async () => {
    log.info('shutting down...')
    await closeBrowser()
    await disconnectRedis()
    await mongoose.disconnect()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  // Index round-robin : chaque worker retient quel crawl il a traité en dernier
  // pour alterner équitablement entre les crawls actifs
  let rrIndex = 0
  let lastCleanup = 0

  // === BOUCLE PRINCIPALE DU WORKER ===
  // Chaque itération :
  // 1. Nettoie les crawls terminés (toutes les 30s)
  // 2. Distribue les nouveaux crawls en attente (pending → Redis)
  // 3. Traite des pages du crawl suivant (round-robin)
  // 4. Si rien à faire → dort 1 seconde
  while (true) {
    try {
      // --- Priorité A : Traiter les crawls actifs (round-robin) ---
      const activeCrawls = await getActiveCrawls()

      if (activeCrawls.length > 0) {

        // Nettoyage : retire les crawls terminés/annulés du set Redis
        // Throttled à 1 fois par 30s par worker pour ne pas spammer MongoDB
        if (Date.now() - lastCleanup > 30_000) {
          lastCleanup = Date.now()
          for (const crawlId of activeCrawls) {
            const crawlDoc = await Crawl.findById(crawlId).select('status').lean()
            if (!crawlDoc || crawlDoc.status === 'completed' || crawlDoc.status === 'failed' || crawlDoc.status === 'cancelled') {
              log.warn({ crawlId, status: crawlDoc?.status ?? 'not found' }, 'active crawl in Redis is stale — removing')
              await removeActiveCrawl(crawlId)
              continue
            }

            // Vérifie si toutes les pages ont été dépilées de Redis → crawl terminé
            const remaining = await getRemainingPages(crawlId)
            if (remaining === 0) {
              const progress = await getProgress(crawlId)
              if (progress.total > 0 && progress.dequeued >= progress.total) {
                await removeActiveCrawl(crawlId)
                log.info({ crawlId, dequeued: progress.dequeued, scanned: progress.scanned, total: progress.total }, 'crawl fully complete')
              }
            }
          }
        }

        // Cherche quels crawls actifs ont encore des pages dans Redis
        const crawlsWithPages: string[] = []
        for (const crawlId of await getActiveCrawls()) {
          const remaining = await getRemainingPages(crawlId)
          if (remaining > 0) crawlsWithPages.push(crawlId)
        }

        // Vérifie s'il y a un nouveau crawl en attente (pending) dans MongoDB
        // Même si des crawls tournent déjà — on distribue le nouveau immédiatement
        // C'est ce qui permet de lancer 2 crawls en parallèle
        const pendingCrawl = await pickCrawl()
        if (pendingCrawl) {
          log.info({ crawlId: pendingCrawl._id, siteId: pendingCrawl.siteId }, 'picked pending crawl while others active, distributing')
          await distributeCrawl(pendingCrawl._id.toString(), pendingCrawl.siteId.toString())
        }

        if (crawlsWithPages.length > 0) {
          // Round-robin : trie les IDs pour un ordre déterministe entre les itérations
          // Puis prend le crawl suivant dans la rotation
          // Exemple : crawls [A, B, C] → itération 1=A, itération 2=B, itération 3=C, itération 4=A...
          crawlsWithPages.sort()
          rrIndex = rrIndex % crawlsWithPages.length
          const crawlId = crawlsWithPages[rrIndex]
          rrIndex++

          // Traite des pages de ce crawl pendant 10s (multi-crawl) ou 30s (crawl seul)
          // Puis revient ici pour checker les pending et switcher de crawl
          await processPages(crawlId)
          continue
        }

        // Des crawls actifs existent mais pas de pages prêtes — en cours de distribution
        await sleep(500)
        continue
      }

      // --- Priorité B : Prendre un nouveau crawl depuis MongoDB (aucun crawl actif) ---
      const crawl = await pickCrawl()

      if (crawl) {
        log.info({ crawlId: crawl._id, siteId: crawl.siteId }, 'picked crawl, distributing pages to Redis')
        await distributeCrawl(crawl._id.toString(), crawl.siteId.toString())
        continue
      }

      // --- Priority C: Process discovery jobs (polled from MongoDB) ---
      const DISCOVERY_TIMEOUT_MS = 10 * 60 * 1000
      const discoverySite = await Site.findOneAndUpdate(
        {
          $or: [
            { discovering: 'pending' },
            { discovering: 'running', discoveryStartedAt: { $lt: new Date(Date.now() - DISCOVERY_TIMEOUT_MS) } },
          ],
        },
        { discovering: 'running', discoveryStartedAt: new Date() },
        { sort: { createdAt: 1 }, returnDocument: 'after', projection: { _id: 1, url: 1 } },
      )

      if (discoverySite) {
        log.info({ siteId: discoverySite._id }, 'picked discovery job')
        await runDiscovery(discoverySite._id.toString(), discoverySite.url)
        continue
      }

      // --- Priority D: Process estimate jobs (polled from MongoDB) ---
      const estimateLead = await Lead.findOneAndUpdate(
        { status: 'pending' },
        { status: 'processing' },
        { sort: { createdAt: 1 }, returnDocument: 'after' },
      )

      if (estimateLead) {
        log.info({ url: estimateLead.url, email: estimateLead.email }, 'picked estimate job')
        await runEstimate(estimateLead._id.toString(), estimateLead.url, estimateLead.email!, estimateLead.ip ?? 'unknown')
        continue
      }

      // Nothing to do — sleep
      log.debug('queue empty, sleeping')
      await sleep(POLL_INTERVAL_MS)
    }
    catch (error) {
      log.error({ errorCode: 'WORKER_LOOP_ERROR', error: (error as Error).message }, 'worker loop error')
      await sleep(5_000)
    }
  }
}

/**
 * Orchestrator: discover pages and push them all to Redis for distributed processing.
 */
async function distributeCrawl(crawlId: string, siteId: string): Promise<void> {
  // Atomically claim the distribution lock — only one worker distributes at a time
  const claimed = await claimDistributionLock(crawlId)
  if (!claimed) {
    // Another worker is already distributing — revert this crawl to pending
    await Crawl.findByIdAndUpdate(crawlId, { status: 'pending', startedAt: null })
    log.info({ crawlId }, 'distribution lock taken by another worker, reverting to pending')
    return
  }

  try {

  const site = await Site.findById(siteId)
  if (!site) {
    log.error({ siteId, errorCode: 'SITE_NOT_FOUND' }, 'site not found')
    return
  }

  await Crawl.findByIdAndUpdate(crawlId, { status: 'running', startedAt: new Date() })

  // Init crawl metadata in worker
  await initCrawl(crawlId, siteId, site.name)

  // Discover all pages from sitemap (with page limit enforcement)
  const { urls: pageUrls, pagesSkipped, sitemapBlocked, foreignHostnames, foreignUrlCount } = await syncMonitoredPages(siteId, site.url, site.orgId.toString())

  // Filter URLs by zone pattern
  const crawlDoc = await Crawl.findById(crawlId).select('zoneId').lean()
  let filteredUrls = pageUrls

  if (crawlDoc?.zoneId) {
    const zone = await Zone.findById(crawlDoc.zoneId).select('patterns isDefault').lean()
    if (zone && !zone.isDefault) {
      filteredUrls = pageUrls.filter((url) => {
        try { return matchesPatterns(new URL(url).pathname, zone.patterns) }
        catch { return false }
      })
      log.info({ crawlId, siteId, totalPages: pageUrls.length, zonePages: filteredUrls.length, patterns: zone.patterns }, 'filtered pages by zone pattern')
    }
  }

  // Store total page count + skipped + sitemapBlocked for progress tracking
  await Crawl.findByIdAndUpdate(crawlId, { pagesTotal: filteredUrls.length, pagesSkipped, sitemapBlocked })

  // Always sync sitemapBlocked flag on Site (clears the banner when fixed)
  await Site.updateOne({ _id: siteId }, { sitemapBlocked })

  // If sitemap was blocked by WAF, notify the site owner immediately
  if (sitemapBlocked) {
    log.warn({ crawlId, siteId, siteName: site.name }, 'sitemap blocked by WAF, notifying site owner')
    try {
      if (site.notifyEmail) {
        const org = await Organization.findById(site.orgId).select('ownerId').lean()
        const user = org ? await User.findById(org.ownerId).select('email') : null
        if (user) {
          await sendSitemapBlockedNotification(user.email, site.name, site.url)
        }
      }
    }
    catch (error) {
      log.error({ crawlId, siteId, errorCode: 'SITEMAP_BLOCKED_NOTIFICATION_ERROR', error: (error as Error).message }, 'failed to send sitemap blocked notification')
    }
  }

  // Sitemap with foreign hostname (e.g. Astro build.local). Notify only on
  // first detection — flag is cleared when fixed so a future regression renotifies.
  const hasForeignHosts = foreignHostnames.length > 0
  if (hasForeignHosts !== site.sitemapInvalidHostname) {
    await Site.updateOne({ _id: siteId }, { sitemapInvalidHostname: hasForeignHosts })
    if (hasForeignHosts) {
      log.warn({ crawlId, siteId, siteName: site.name, foreignHostnames }, 'sitemap has foreign hostnames, notifying site owner')
      try {
        if (site.notifyEmail) {
          const org = await Organization.findById(site.orgId).select('ownerId').lean()
          const user = org ? await User.findById(org.ownerId).select('email') : null
          if (user) {
            await sendSitemapInvalidHostnameNotification(user.email, site.name, site.url, foreignHostnames, foreignUrlCount)
          }
        }
      }
      catch (error) {
        log.error({ crawlId, siteId, errorCode: 'SITEMAP_INVALID_HOST_NOTIFICATION_ERROR', error: (error as Error).message }, 'failed to send sitemap invalid hostname notification')
      }
    }
  }

  // Zero pages → mark completed immediately
  if (filteredUrls.length === 0) {
    await Crawl.findByIdAndUpdate(crawlId, { status: 'completed', completedAt: new Date(), pagesScanned: 0 })
    log.info({ crawlId, siteId }, 'crawl completed — 0 pages to process')
    return
  }

  // Push filtered URLs to Redis — all workers will consume them
  await pushPages(crawlId, siteId, filteredUrls)

  // Add to active crawls set (multiple crawls can run simultaneously)
  await addActiveCrawl(crawlId)

  log.info({ crawlId, siteId, totalPages: filteredUrls.length, sitemapBlocked }, 'pages distributed to Redis, all workers will process')

  // This worker also starts processing immediately
  await processPages(crawlId)

  } catch (err) {
    // Distribution failed — mark crawl as failed so it doesn't stay orphaned in 'running'
    await Crawl.findByIdAndUpdate(crawlId, { status: 'failed', error: (err as Error).message })
    log.error({ crawlId, siteId, errorCode: 'DISTRIBUTE_ERROR', error: (err as Error).message }, 'crawl distribution failed')
  } finally {
    // Always release distribution lock — even on error
    await clearDistributionLock(crawlId)
  }
}

/**
 * Atomically pick and claim a pending crawl.
 */
async function pickCrawl() {
  return Crawl.findOneAndUpdate(
    { status: 'pending' },
    { status: 'running', startedAt: new Date() },
    { sort: { createdAt: 1 }, returnDocument: 'after', projection: { _id: 1, siteId: 1 } },
  )
}

async function syncMonitoredPages(siteId: string, siteUrl: string, orgId: string): Promise<{ urls: string[], pagesSkipped: number, sitemapBlocked: boolean, foreignHostnames: string[], foreignUrlCount: number }> {
  const { urls: sitemapUrls, sitemapBlocked, foreignHostnames, foreignUrlCount } = await discoverPages(siteUrl)

  const existingPages = await MonitoredPage.find({ siteId }).select('url').lean()
  const existingUrls = new Set(existingPages.map(p => p.url))

  log.info({ siteId, existingPages: existingUrls.size, sitemapPages: sitemapUrls.length }, 'sync monitored pages')

  const newUrls = sitemapUrls.filter(url => !existingUrls.has(url))

  if (newUrls.length > 0) {
    try {
      await MonitoredPage.insertMany(
        newUrls.map((url) => {
          let pathname = '/'
          try { pathname = new URL(url).pathname } catch {}
          return { siteId, url, pathname }
        }),
        { ordered: false },
      )
    }
    catch (error: any) {
      if (error?.code !== 11000) throw error
    }
    log.info({ siteId, newPages: newUrls.length, totalPages: existingUrls.size + newUrls.length }, 'new pages discovered')
  }

  return {
    urls: [...existingUrls, ...newUrls],
    pagesSkipped: 0,
    sitemapBlocked,
    foreignHostnames,
    foreignUrlCount,
  }
}

/**
 * Discovery: fetch sitemap URLs and register them as MonitoredPages.
 * Runs on worker (not Nuxt) so it survives server restarts.
 */
async function runDiscovery(siteId: string, siteUrl: string): Promise<void> {
  try {
    const { urls, sitemapBlocked } = await discoverPages(siteUrl)

    if (urls.length > 0) {
      const BATCH_SIZE = 1000
      for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batch = urls.slice(i, i + BATCH_SIZE)
        const ops = batch.map(url => ({
          updateOne: {
            filter: { siteId, url },
            update: { $setOnInsert: { siteId, url, pathname: extractPathname(url) } },
            upsert: true,
          },
        }))
        await MonitoredPage.bulkWrite(ops, { ordered: false })
      }
      log.info({ siteId, pagesRegistered: urls.length, sitemapBlocked }, 'discovery completed')
    }
    else {
      log.info({ siteId }, 'discovery found no pages')
    }

    await Site.updateOne({ _id: siteId }, { discovering: 'idle', discoveryStartedAt: null, sitemapBlocked })
  }
  catch (err) {
    log.error({ siteId, errorCode: 'DISCOVERY_ERROR', error: (err as Error).message }, 'discovery failed')
    await Site.updateOne({ _id: siteId }, { discovering: 'idle', discoveryStartedAt: null })
  }
}

/**
 * Estimate: discover sitemap pages, calculate price, send email, update Lead.
 * Runs on worker for reliability (no timeout, survives Nuxt restarts).
 */
async function runEstimate(leadId: string, url: string, email: string, ip: string): Promise<void> {
  try {
    const result = await discoverSitemapHttp(url)

    if (!result.found) {
      log.warn({ url, email }, 'estimate: sitemap not found, skipping email')
      await Lead.findByIdAndUpdate(leadId, { status: 'failed' })
      return
    }

    const pageCount = result.urls.length
    const price = calculateCloudPrice(pageCount)
    const formattedPrice = `${price.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`

    await Lead.findByIdAndUpdate(leadId, {
      pageCount,
      estimatedPrice: price,
      sitemapUrl: result.sitemapUrl,
      status: 'completed',
    })

    await sendEstimateEmail(email, {
      url,
      pageCount,
      price: formattedPrice,
      sitemapUrl: result.sitemapUrl,
    })

    log.info({ url, email, pageCount }, 'estimate email sent')
  }
  catch (err) {
    log.error({ url, email, errorCode: 'ESTIMATE_ERROR', error: (err as Error).message }, 'estimate failed')
    await Lead.findByIdAndUpdate(leadId, { status: 'failed' }).catch(() => {})
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch((error) => {
  log.fatal({ errorCode: 'WORKER_CRASH', error: error.message }, 'crawler worker crashed')
  process.exit(1)
})

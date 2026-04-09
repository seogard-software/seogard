import { Types } from 'mongoose'
import { Site, Crawl, MonitoredPage, Alert, PageSnapshot, User, Organization, Zone, OrgMember, MutedRule } from '../server/database/models'
import { createLogger } from './logger'
import { fetchPage, fetchSiteContext, toMetaCore, type PageMeta, type SiteContext } from './fetcher'
import { renderPage } from './renderer'
import { compareSnapshots, type AlertData } from './comparator'
import { isSsrBlocked } from './rules/helpers'
import { sendEmailNotification, sendCrawlerBlockedNotification } from './notifications'
import { popPageBatch, incrementProgress, incrementBlocked, incrementFailed, incrementAlerts, getProgress, getRemainingPages } from './redis'
import { getRuleCategory, STATE_RULES, RECOMMENDATION_RULES } from '../shared/utils/constants'

const log = createLogger('worker')

function normalizePageUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Ensure root URLs have trailing slash: https://example.com → https://example.com/
    if (parsed.pathname === '') parsed.pathname = '/'
    return parsed.toString()
  }
  catch { return url }
}

// In-memory crawl context (set by initCrawl, shared across processPages calls)
const crawlContexts = new Map<string, { siteId: string, siteName: string, startedAt: number, siteContext?: SiteContext, oldSiteContext?: SiteContext, mutedRuleIds?: Set<string> }>()

/**
 * Called by the orchestrator worker to register crawl metadata.
 */
export async function initCrawl(crawlId: string, siteId: string, siteName: string): Promise<void> {
  crawlContexts.set(crawlId, { siteId, siteName, startedAt: Date.now() })
}

/**
 * Upsert alerts: one active alert per (siteId, pageUrl, ruleId).
 * If an open alert already exists for this combo, update it. Otherwise insert a new one.
 * Muted rules (site-wide) are filtered out before upserting.
 */
async function upsertAlerts(siteId: string, crawlId: string, alerts: AlertData[], mutedRuleIds?: Set<string>): Promise<void> {
  if (alerts.length === 0) return

  // Filter out muted rules (use cached set from crawl context)
  const mutedSet = mutedRuleIds ?? new Set<string>()
  const filtered = alerts.filter(a => !mutedSet.has(a.type))
  if (filtered.length === 0) return

  const now = new Date()
  const bulkOps = filtered.map(a => ({
    updateOne: {
      filter: { siteId, pageUrl: a.pageUrl, ruleId: a.type, status: 'open' },
      update: {
        $set: {
          lastCrawlId: crawlId, lastDetectedAt: now,
          severity: a.severity, message: a.message,
          previousValue: a.previousValue, currentValue: a.currentValue,
        },
        $setOnInsert: {
          siteId, pageUrl: a.pageUrl, ruleId: a.type,
          category: a.category, status: 'open',
          firstCrawlId: crawlId, firstDetectedAt: now,
        },
        $inc: { occurrences: 1 },
      },
      upsert: true,
    },
  }))
  try {
    await Alert.bulkWrite(bulkOps, { ordered: false })
    // Compteur Redis pour le suivi temps reel (polling frontend)
    await incrementAlerts(crawlId, filtered.length)
  }
  catch (error) {
    log.error({ siteId, crawlId, alertCount: alerts.length, errorCode: 'UPSERT_ALERTS_ERROR', error: (error as Error).message }, 'bulkWrite alerts failed')
  }
}

/**
 * Consume pages from Redis queue and process them.
 * Called by ALL workers — each pops a batch, processes it, repeats until queue is empty.
 */
export async function processPages(crawlId: string): Promise<void> {
  // Get crawl context (may not exist if this worker didn't start the crawl)
  let ctx = crawlContexts.get(crawlId)

  if (!ctx) {
    // Fetch from MongoDB
    const crawl = await Crawl.findById(crawlId).select('siteId')
    if (!crawl) {
      log.error({ crawlId, errorCode: 'CRAWL_NOT_FOUND' }, 'crawl not found')
      return
    }

    const site = await Site.findById(crawl.siteId).select('name')
    ctx = { siteId: crawl.siteId.toString(), siteName: site?.name || 'Unknown', startedAt: Date.now() }
    crawlContexts.set(crawlId, ctx)
  }

  const { siteId } = ctx
  // Fetch site-level GEO context once per crawl (llms.txt, robots.txt AI crawlers)
  if (!ctx.siteContext) {
    try {
      const site = await Site.findById(siteId).select('url siteContext').lean()
      if (site?.url) {
        ctx.siteContext = await fetchSiteContext(site.url)
        // Load previous site context for regression detection
        ctx.oldSiteContext = (site as any).siteContext ?? undefined
        log.info({ siteId, hasLlmsTxt: ctx.siteContext.hasLlmsTxt, aiCrawlersBlocked: ctx.siteContext.aiCrawlersBlocked }, 'site GEO context fetched')
      }
    }
    catch (error) {
      log.warn({ siteId, errorCode: 'SITE_CONTEXT_ERROR', error: (error as Error).message }, 'failed to fetch site GEO context')
    }
  }

  // Cache muted rules une seule fois par crawl (au lieu de par batch)
  if (!ctx.mutedRuleIds) {
    const muted = await MutedRule.find({ siteId: new Types.ObjectId(siteId) }).select('ruleId').lean()
    ctx.mutedRuleIds = new Set(muted.map(m => m.ruleId as string))
    if (ctx.mutedRuleIds.size > 0) {
      log.info({ siteId, mutedRules: [...ctx.mutedRuleIds] }, 'muted rules cached for crawl')
    }
  }

  // Nombre de pages traitees en parallele par worker
  // SSR = fetch HTTP brut (leger, I/O bound), CSR = render Playwright (lourd, 1 tab Chromium par page)
  // Configurable via env pour ajuster selon les ressources du serveur
  const ssrConcurrency = Number(process.env.SSR_CONCURRENCY) || 10
  const csrConcurrency = Number(process.env.CSR_CONCURRENCY) || 5
  const batchSize = ssrConcurrency
  const DB_SYNC_INTERVAL_MS = 10_000 // sync to MongoDB every 10s
  let lastSyncAt = Date.now()

  async function syncProgress() {
    const progress = await getProgress(crawlId)
    await Crawl.findByIdAndUpdate(crawlId, {
      pagesScanned: progress.scanned,
      pagesBlocked: progress.blocked,
      pagesFailed: progress.failed,
      alertsGenerated: progress.alerts,
    })
    log.info({ crawlId, dequeued: progress.dequeued, scanned: progress.scanned, blocked: progress.blocked, failed: progress.failed, total: progress.total }, 'crawl progress')
    lastSyncAt = Date.now()
  }

  // --- Durée de travail sur ce crawl avant de revenir au main loop ---
  // 15 secondes puis retour au main loop pour checker les pending et switcher de crawl
  // Court = meilleur equilibrage entre crawls et reaction rapide aux nouveaux crawls
  // On ne met JAMAIS Infinity — sinon un nouveau crawl lance apres ne demarre jamais
  const startedAt = Date.now()
  const timeLimitMs = 15_000

  while (Date.now() - startedAt < timeLimitMs) {
    // Vérifie si le crawl a été annulé par l'utilisateur
    const crawlCheck = await Crawl.findById(crawlId).select('status').lean()
    if (crawlCheck?.status === 'cancelled') break

    // Récupère un batch de pages depuis Redis (10 pages en parallèle)
    // Si la queue est vide, le crawl est terminé pour ce worker
    const urls = await popPageBatch(crawlId, batchSize)
    if (urls.length === 0) break

    // Phase 1 — SSR fetch (parallel)
    const ssrResults: { pageUrl: string, result: PageProcessResult }[] = []
    let batchBlocked = 0
    let batchFailed = 0

    const results = await Promise.allSettled(
      urls.map(pageUrl => processPageSSR(siteId, crawlId, pageUrl, { current: ctx.siteContext, old: ctx.oldSiteContext }, ctx.mutedRuleIds)),
    )

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'fulfilled') {
        if (result.value.ssrBlocked) {
          batchBlocked++
        }
        else {
          // Toutes les pages passent en CSR pour detecter les divergences SSR/CSR
          ssrResults.push({ pageUrl: urls[i], result: result.value })
        }
      }
      else {
        batchFailed++
        log.warn({ crawlId, pageUrl: urls[i], errorCode: 'PAGE_SSR_ERROR', error: result.reason?.message }, 'SSR failed')
      }
    }

    // Phase 2 — CSR render for changed/new pages (limited concurrency)
    for (let i = 0; i < ssrResults.length; i += csrConcurrency) {
      const batch = ssrResults.slice(i, i + csrConcurrency)

      await Promise.allSettled(
        batch.map(async ({ pageUrl, result }) => {
          try {
            await processPageCSR(siteId, crawlId, pageUrl, result, ctx.mutedRuleIds)
          }
          catch (error) {
            log.warn({ crawlId, pageUrl, errorCode: 'CSR_PROCESS_ERROR', error: (error as Error).message }, 'CSR failed')
          }
        }),
      )
    }

    // Update Redis progress counters
    await incrementProgress(crawlId, urls.length)
    if (batchBlocked > 0) await incrementBlocked(crawlId, batchBlocked)
    if (batchFailed > 0) await incrementFailed(crawlId, batchFailed)

    // Sync to MongoDB every 10 seconds
    if (Date.now() - lastSyncAt >= DB_SYNC_INTERVAL_MS) {
      await syncProgress()
    }
  }

  // Final progress sync
  const finalProgress = await getProgress(crawlId)
  await Crawl.findByIdAndUpdate(crawlId, {
    pagesScanned: finalProgress.scanned,
    pagesBlocked: finalProgress.blocked,
    pagesFailed: finalProgress.failed,
    alertsGenerated: finalProgress.alerts,
  })

  // Check if crawl is fully complete (all pages processed by all workers)
  const remaining = await getRemainingPages(crawlId)

  if (remaining === 0) {
    await finalizeCrawl(crawlId, siteId)
  }
}

/**
 * Called once when crawl is fully complete. Handles final stats, auto-resolve, notifications.
 */
async function finalizeCrawl(crawlId: string, siteId: string): Promise<void> {
  const ctx = crawlContexts.get(crawlId)
  const durationMs = ctx ? Date.now() - ctx.startedAt : 0

  try {
    // Lire les compteurs finaux depuis Redis (pas de countDocuments MongoDB)
    const finalProgress = await getProgress(crawlId)

    await Crawl.findByIdAndUpdate(crawlId, {
      status: 'completed',
      completedAt: new Date(),
      pagesScanned: finalProgress.scanned,
      alertsGenerated: finalProgress.alerts,
      pagesBlocked: finalProgress.blocked,
      pagesFailed: finalProgress.failed,
    })

    // Save site context for next crawl's regression detection
    const siteUpdate: Record<string, unknown> = { lastCrawlAt: new Date() }
    if (ctx?.siteContext) {
      siteUpdate.siteContext = {
        hasLlmsTxt: ctx.siteContext.hasLlmsTxt,
        aiCrawlersBlocked: ctx.siteContext.aiCrawlersBlocked,
      }
    }
    await Site.findByIdAndUpdate(siteId, siteUpdate)

    log.info({ crawlId, siteId, siteName: ctx?.siteName, pagesScanned: finalProgress.scanned, alertsGenerated: finalProgress.alerts, durationMs }, 'crawl completed')

    // Auto-resolve STATE alerts whose page was crawled but problem not re-detected
    try {
      const processedSnapshots = await PageSnapshot.find({ crawlId }).select('pageId').lean()
      const processedPageIds = processedSnapshots.map(s => s.pageId.toString())
      const processedPages = await MonitoredPage.find({ _id: { $in: processedPageIds } }).select('url').lean()
      const processedUrls = new Set(processedPages.map(p => p.url))

      const openStateAlerts = await Alert.find({
        siteId,
        ruleId: { $in: [...STATE_RULES, ...RECOMMENDATION_RULES] },
        status: 'open',
      }).select('_id pageUrl lastCrawlId').lean()

      const toResolve = openStateAlerts.filter(a =>
        processedUrls.has(a.pageUrl) && a.lastCrawlId.toString() !== crawlId,
      )

      if (toResolve.length > 0) {
        await Alert.updateMany(
          { _id: { $in: toResolve.map(a => a._id) } },
          { status: 'resolved', resolvedAt: new Date(), resolvedBy: 'auto' },
        )
        log.info({ siteId, autoResolved: toResolve.length }, 'auto-resolved state alerts')
      }
      // EVENT alerts are NEVER auto-resolved
    }
    catch (error) {
      log.error({ crawlId, siteId, errorCode: 'AUTO_RESOLVE_ERROR', error: (error as Error).message }, 'auto-resolve failed')
    }

    // Send notifications (zone-scoped)
    try {
      const site = await Site.findById(siteId)
      if (site) {
        const crawlForNotif = await Crawl.findById(crawlId).select('zoneId pagesBlocked pagesTotal').lean()
        const zone = crawlForNotif?.zoneId ? await Zone.findById(crawlForNotif.zoneId).select('name isDefault').lean() : null
        const zoneName = zone && !zone.isDefault ? zone.name : null
        const zoneId = crawlForNotif?.zoneId?.toString() || null

        const allAlerts = await Alert.find({ siteId, lastCrawlId: crawlId }).lean()
        const criticalOrWarning = allAlerts.filter(a => a.severity === 'critical' || a.severity === 'warning')

        if (criticalOrWarning.length > 0) {
          await sendNotifications(site, allAlerts.map(a => ({
            pageUrl: a.pageUrl,
            type: a.ruleId,
            severity: a.severity as 'critical' | 'warning' | 'info',
            message: a.message,
            previousValue: a.previousValue || null,
            currentValue: a.currentValue || null,
          })), { zoneName, zoneId })
        }

        // Send "crawler blocked" notification if >10% pages blocked
        if (crawlForNotif && crawlForNotif.pagesTotal > 0 && crawlForNotif.pagesBlocked > 0) {
          const blockedRatio = crawlForNotif.pagesBlocked / crawlForNotif.pagesTotal
          if (blockedRatio > 0.1) {
            const org = await Organization.findById(site.orgId).select('ownerId').lean()
            const user = org ? await User.findById(org.ownerId).select('email') : null
            if (user) {
              await sendCrawlerBlockedNotification(user.email, site.name, crawlForNotif.pagesBlocked, crawlForNotif.pagesTotal)
            }
          }
        }
      }
    }
    catch (error) {
      log.error({ crawlId, siteId, errorCode: 'NOTIFICATION_ERROR', error: (error as Error).message }, 'notifications failed')
    }
  }
  catch (error) {
    log.error({ crawlId, siteId, errorCode: 'FINALIZE_CRAWL_ERROR', error: (error as Error).message, durationMs }, 'finalize crawl failed')
    await Crawl.findByIdAndUpdate(crawlId, {
      status: 'failed',
      completedAt: new Date(),
      error: (error as Error).message,
    }).catch(() => {})
  }
  finally {
    crawlContexts.delete(crawlId)
  }
}

// --- Page processing ---

interface PageProcessResult {
  isFirstCrawl: boolean
  alerts: AlertData[]
  pageId: string
  ssrContentLength: number
  ssrMeta: Record<string, string | null>
  ssrBlocked: boolean
}

async function processPageSSR(siteId: string, crawlId: string, rawPageUrl: string, siteCtx?: { current?: SiteContext, old?: SiteContext }, mutedRuleIds?: Set<string>): Promise<PageProcessResult> {
  // Normalize: ensure trailing slash on root URLs (https://example.com → https://example.com/)
  const pageUrl = normalizePageUrl(rawPageUrl)
  const fetchResult = await fetchPage(pageUrl)

  let page = await MonitoredPage.findOne({ siteId, url: pageUrl })
  if (!page) {
    page = await MonitoredPage.create({ siteId, url: pageUrl, pathname: new URL(pageUrl).pathname })
  }

  const isFirstCrawl = page.lastCheckedAt === null

  // Detect SSR blocked by anti-bot (only on subsequent crawls)
  const ssrBlocked = !isFirstCrawl && isSsrBlocked(fetchResult.statusCode, fetchResult.contentLength, fetchResult.meta)

  if (ssrBlocked) {
    log.warn({ pageUrl, ssrContentLength: fetchResult.contentLength }, 'SSR blocked by anti-bot, skipping page')

    await upsertAlerts(siteId, crawlId, [{
      type: 'ssr_blocked',
      severity: 'warning',
      message: 'SSR blocked by anti-bot — page skipped, previous data preserved',
      previousValue: null,
      currentValue: `${fetchResult.contentLength}b`,
      pageUrl,
      category: 'state',
    }], mutedRuleIds)

    return {
      isFirstCrawl,
      alerts: [],
      pageId: page._id.toString(),
      ssrContentLength: fetchResult.contentLength,
      ssrMeta: fetchResult.meta,
      ssrBlocked: true,
    }
  }

  const pageAlerts = compareSnapshots({
    pageUrl,
    finalUrl: fetchResult.finalUrl,
    oldMeta: page.lastMeta as any,
    newMeta: fetchResult.meta,
    oldStatusCode: page.lastStatusCode,
    newStatusCode: fetchResult.statusCode,
    renderedMeta: null,
    ssrContentLength: fetchResult.contentLength,
    csrContentLength: null,
    siteContext: siteCtx?.current ? {
      hasLlmsTxt: siteCtx.current.hasLlmsTxt,
      oldHasLlmsTxt: siteCtx.old?.hasLlmsTxt,
      aiCrawlersBlocked: siteCtx.current.aiCrawlersBlocked,
      oldAiCrawlersBlocked: siteCtx.old?.aiCrawlersBlocked,
      robotsTxtRaw: siteCtx.current.robotsTxtRaw,
    } : undefined,
  })

  if (pageAlerts.length > 0) {
    await upsertAlerts(siteId, crawlId, pageAlerts, mutedRuleIds)
  }

  // Stocker MetaCore (version allegee sans les tableaux volumineux : links, images)
  // Les rules de comparaison recoivent le PageMeta complet du fetch courant (en RAM)
  const metaCore = toMetaCore(fetchResult.meta)

  await PageSnapshot.create({
    pageId: page._id,
    crawlId,
    statusCode: fetchResult.statusCode,
    meta: metaCore,
    ssrContentLength: fetchResult.contentLength,
    csrContentLength: null,
  })

  // Don't overwrite good data with rate-limited response
  if (fetchResult.statusCode !== 429) {
    await MonitoredPage.findByIdAndUpdate(page._id, {
      lastStatusCode: fetchResult.statusCode,
      lastMeta: metaCore,
      lastCheckedAt: new Date(),
    })
  }

  return {
    isFirstCrawl,
    alerts: pageAlerts,
    pageId: page._id.toString(),
    ssrContentLength: fetchResult.contentLength,
    ssrMeta: fetchResult.meta,
    ssrBlocked: false,
  }
}

async function processPageCSR(siteId: string, crawlId: string, pageUrl: string, ssrData: PageProcessResult, mutedRuleIds?: Set<string>): Promise<void> {
  const renderResult = await renderPage(pageUrl)

  const csrAlerts = compareSnapshots({
    pageUrl,
    oldMeta: null,
    newMeta: ssrData.ssrMeta as PageMeta,
    oldStatusCode: null,
    newStatusCode: 200,
    renderedMeta: renderResult.renderedMeta,
    ssrContentLength: ssrData.ssrContentLength,
    csrContentLength: renderResult.csrContentLength,
  })

  if (csrAlerts.length > 0) {
    await upsertAlerts(siteId, crawlId, csrAlerts, mutedRuleIds)
  }

  await PageSnapshot.findOneAndUpdate(
    { pageId: ssrData.pageId, crawlId },
    { csrRendered: true, csrContentLength: renderResult.csrContentLength },
  )

  await MonitoredPage.findByIdAndUpdate(ssrData.pageId, {
    lastRenderedAt: new Date(),
  })
}

async function sendNotifications(
  site: InstanceType<typeof Site>,
  allAlerts: AlertData[],
  zoneInfo?: { zoneName: string | null, zoneId: string | null },
): Promise<void> {
  const criticalCount = allAlerts.filter(a => a.severity === 'critical').length
  const warningCount = allAlerts.filter(a => a.severity === 'warning').length

  const notification = {
    siteId: site._id.toString(),
    siteName: site.name,
    siteUrl: site.url,
    alertCount: allAlerts.length,
    criticalCount,
    warningCount,
    zoneName: zoneInfo?.zoneName || null,
    zoneId: zoneInfo?.zoneId || null,
    alerts: allAlerts.map(a => ({
      pageUrl: a.pageUrl,
      type: a.type,
      severity: a.severity,
      message: a.message,
    })),
  }

  if (site.notifyEmail && criticalCount > 0) {
    // Collect recipients: org owner + zone admin/member (not viewer)
    const emails = new Set<string>()

    const org = await Organization.findById(site.orgId).select('ownerId').lean()
    if (org) {
      const owner = await User.findById(org.ownerId).select('email').lean()
      if (owner) emails.add(owner.email)
    }

    // If zone-scoped, also notify admin/member of this zone
    if (zoneInfo?.zoneId) {
      const members = await OrgMember.find({
        orgId: site.orgId,
        'zoneRoles.zoneId': zoneInfo.zoneId,
        'zoneRoles.role': { $in: ['admin', 'member'] },
      }).select('userId').lean()

      if (members.length > 0) {
        const users = await User.find({ _id: { $in: members.map(m => m.userId) } }).select('email').lean()
        for (const u of users) emails.add(u.email)
      }
    }

    const emailList = Array.from(emails)
    for (let i = 0; i < emailList.length; i++) {
      await sendEmailNotification(emailList[i], notification)
    }
  }

}

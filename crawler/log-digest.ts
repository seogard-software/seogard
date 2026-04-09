/**
 * Log Digest — Daily summary of warn/error/fatal logs from Docker workers.
 *
 * Usage (crontab on Hetzner host):
 *   0 8 * * * cd /home/deploy/seogard && docker compose -f docker-compose.workers.yml logs --since 24h --no-color 2>&1 | docker compose -f docker-compose.workers.yml run --rm -T log-digest
 *
 * Reads Pino JSON logs from stdin, filters warn+, groups, sends email via Resend.
 * If no warn/error/fatal logs → exits silently (no email sent).
 */

import { logDigestTemplate } from '../server/utils/email-templates'

interface PinoLog {
  level: string
  msg: string
  time: string
  service?: string
  module?: string
  errorCode?: string
  error?: string
  url?: string
  pageUrl?: string
  crawlId?: string
  siteId?: string
  [key: string]: unknown
}

interface LogGroup {
  level: string
  module: string
  errorCode: string
  message: string
  count: number
  lastSeen: string
  samples: string[]
}

const WARN_LEVELS = new Set(['warn', 'error', 'fatal'])

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

function extractJson(line: string): string | null {
  // Docker compose logs format: "service-N  | {json}" or just "{json}"
  const jsonStart = line.indexOf('{')
  if (jsonStart === -1) return null
  return line.substring(jsonStart)
}

function parseLogs(raw: string): PinoLog[] {
  const logs: PinoLog[] = []
  for (const line of raw.split('\n')) {
    const jsonStr = extractJson(line.trim())
    if (!jsonStr) continue
    try {
      const parsed = JSON.parse(jsonStr)
      if (parsed.level && WARN_LEVELS.has(parsed.level)) {
        logs.push(parsed)
      }
    }
    catch {
      // Not valid JSON — skip (Docker metadata lines, etc.)
    }
  }
  return logs
}

function groupLogs(logs: PinoLog[]): LogGroup[] {
  const groups = new Map<string, LogGroup>()

  for (const log of logs) {
    const key = `${log.level}:${log.module || 'unknown'}:${log.errorCode || log.msg || 'unknown'}`
    const existing = groups.get(key)
    if (existing) {
      existing.count++
      existing.lastSeen = log.time || existing.lastSeen
      if (existing.samples.length < 3) {
        const sample = log.pageUrl || log.url || log.error || ''
        if (sample && !existing.samples.includes(sample)) {
          existing.samples.push(sample)
        }
      }
    }
    else {
      groups.set(key, {
        level: log.level,
        module: log.module || 'unknown',
        errorCode: log.errorCode || '',
        message: log.msg || '',
        count: 1,
        lastSeen: log.time || new Date().toISOString(),
        samples: (log.pageUrl || log.url || log.error) ? [log.pageUrl || log.url || log.error || ''] : [],
      })
    }
  }

  // Sort: fatal first, then error, then warn. Within same level, by count desc.
  const levelOrder: Record<string, number> = { fatal: 0, error: 1, warn: 2 }
  return [...groups.values()].sort((a, b) => {
    const levelDiff = (levelOrder[a.level] ?? 3) - (levelOrder[b.level] ?? 3)
    return levelDiff !== 0 ? levelDiff : b.count - a.count
  })
}

const DIGEST_RECIPIENTS = (process.env.LOG_DIGEST_RECIPIENTS || '').split(',').map(e => e.trim()).filter(Boolean)

async function sendDigest(groups: LogGroup[], totalWarn: number, totalError: number, totalFatal: number): Promise<void> {
  if (DIGEST_RECIPIENTS.length === 0) {
    process.stderr.write('LOG_DIGEST_RECIPIENTS not set, skipping digest\n')
    return
  }

  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    process.stderr.write('RESEND_API_KEY not set, cannot send digest\n')
    process.exit(1)
  }

  const domain = (() => { try { return new URL(process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io').hostname } catch { return 'seogard.io' } })()
  const fromEmail = process.env.FROM_EMAIL || `Seogard <alerts@${domain}>`
  const { subject, html } = logDigestTemplate({
    groups: groups.slice(0, 30),
    totalWarn,
    totalError,
    totalFatal,
  })

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to: DIGEST_RECIPIENTS, subject, html }),
  })

  if (!response.ok) {
    const err = await response.text()
    process.stderr.write(`Resend error: ${err}\n`)
    process.exit(1)
  }

  const result = await response.json() as { id?: string }
  process.stdout.write(`Log digest sent to ${DIGEST_RECIPIENTS.join(', ')} (id: ${result.id})\n`)
}

async function main() {
  const raw = await readStdin()
  const logs = parseLogs(raw)

  if (logs.length === 0) {
    process.stdout.write('No warn/error/fatal logs in the last 24h — no email sent.\n')
    process.exit(0)
  }

  const totalWarn = logs.filter(l => l.level === 'warn').length
  const totalError = logs.filter(l => l.level === 'error').length
  const totalFatal = logs.filter(l => l.level === 'fatal').length
  const groups = groupLogs(logs)

  process.stdout.write(`Found ${logs.length} warn+ logs (${totalFatal} fatal, ${totalError} error, ${totalWarn} warn) in ${groups.length} groups\n`)

  await sendDigest(groups, totalWarn, totalError, totalFatal)
}

main().catch(err => {
  process.stderr.write(`Log digest failed: ${err}\n`)
  process.exit(1)
})

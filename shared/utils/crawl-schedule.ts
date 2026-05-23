import type { CrawlScheduleFrequency } from '../types/zone'

export interface CrawlScheduleConfig {
  enabled: boolean
  frequency: CrawlScheduleFrequency
  dayOfWeek: number | null
  dayOfMonth: number | null
  lastDayOfMonth: boolean
  hour: number
  lastCrawledAt: string | Date | null
  nextCrawlAt: string | Date | null
}

const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function startOfHourUtc(date: Date, hour: number): Date {
  const d = new Date(date)
  d.setUTCHours(hour, 0, 0, 0)
  return d
}

function daysInMonth(year: number, monthZeroBased: number): number {
  return new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate()
}

function resolveMonthlyDay(target: Date, schedule: Pick<CrawlScheduleConfig, 'dayOfMonth' | 'lastDayOfMonth'>): number {
  const year = target.getUTCFullYear()
  const month = target.getUTCMonth()
  const lastDay = daysInMonth(year, month)
  if (schedule.lastDayOfMonth) return lastDay
  const requested = schedule.dayOfMonth ?? 1
  return Math.min(requested, lastDay)
}

/**
 * Compute the next UTC instant a crawl should run, starting strictly after `from`.
 * Pure function — no I/O, safe to test in isolation.
 */
export function computeNextCrawlAt(schedule: Pick<CrawlScheduleConfig, 'frequency' | 'dayOfWeek' | 'dayOfMonth' | 'lastDayOfMonth' | 'hour' | 'lastCrawledAt'>, from: Date): Date {
  const hour = schedule.hour

  if (schedule.frequency === 'daily') {
    const today = startOfHourUtc(from, hour)
    if (today > from) return today
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    return tomorrow
  }

  if (schedule.frequency === 'weekly' || schedule.frequency === 'biweekly') {
    const targetDow = schedule.dayOfWeek ?? 1
    const candidate = startOfHourUtc(from, hour)
    const currentDow = candidate.getUTCDay()
    let delta = (targetDow - currentDow + 7) % 7
    if (delta === 0 && candidate <= from) delta = 7
    candidate.setUTCDate(candidate.getUTCDate() + delta)

    if (schedule.frequency === 'biweekly') {
      const last = schedule.lastCrawledAt ? new Date(schedule.lastCrawledAt) : null
      if (last) {
        // Snap to the second occurrence if we'd otherwise fire 7 days after the last run.
        const diffDays = Math.round((candidate.getTime() - last.getTime()) / 86_400_000)
        if (diffDays < 14) candidate.setUTCDate(candidate.getUTCDate() + 7)
      }
    }
    return candidate
  }

  // monthly
  const baseMonth = startOfHourUtc(from, hour)
  baseMonth.setUTCDate(resolveMonthlyDay(baseMonth, schedule))
  if (baseMonth > from) return baseMonth
  // bump to next month
  const next = new Date(baseMonth)
  next.setUTCMonth(next.getUTCMonth() + 1, 1)
  next.setUTCHours(hour, 0, 0, 0)
  next.setUTCDate(resolveMonthlyDay(next, schedule))
  return next
}

/**
 * Validate a schedule payload coming from the API. Returns null if valid,
 * or a user-facing error message otherwise.
 */
export function validateSchedule(payload: Partial<CrawlScheduleConfig>): string | null {
  if (typeof payload.enabled !== 'boolean') return 'enabled doit être un booléen'
  if (typeof payload.hour !== 'number' || payload.hour < 0 || payload.hour > 23) {
    return 'L\'heure doit être comprise entre 0 et 23 (UTC)'
  }

  const freq = payload.frequency
  if (freq !== 'daily' && freq !== 'weekly' && freq !== 'biweekly' && freq !== 'monthly') {
    return 'Fréquence invalide'
  }

  if (freq === 'weekly' || freq === 'biweekly') {
    if (typeof payload.dayOfWeek !== 'number' || payload.dayOfWeek < 0 || payload.dayOfWeek > 6) {
      return 'Le jour de la semaine doit être compris entre 0 (dim) et 6 (sam)'
    }
  }

  if (freq === 'monthly') {
    const wantsLast = payload.lastDayOfMonth === true
    const dom = payload.dayOfMonth
    if (!wantsLast) {
      if (typeof dom !== 'number' || dom < 1 || dom > 31) {
        return 'Le jour du mois doit être compris entre 1 et 31'
      }
    }
  }

  return null
}

export function formatNextCrawlLabel(date: Date | string | null | undefined): string {
  if (!date) return 'Pas encore planifié'
  const d = typeof date === 'string' ? new Date(date) : date
  const day = DAYS_FR[d.getUTCDay()]
  const num = d.getUTCDate()
  const month = MONTHS_FR[d.getUTCMonth()]
  const hh = String(d.getUTCHours()).padStart(2, '0')
  return `${day} ${num} ${month} à ${hh}:00 UTC`
}

export function formatLastCrawlLabel(date: Date | string | null | undefined, now: Date = new Date()): string {
  if (!date) return 'Pas encore exécuté'
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - d.getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`
  const days = Math.round(hours / 24)
  if (days < 30) return `il y a ${days} jour${days > 1 ? 's' : ''}`
  const months = Math.round(days / 30)
  return `il y a ${months} mois`
}

import type { CrawlScheduleFrequency } from '../types/zone'
import type { Locale } from './i18n'
import { DEFAULT_LOCALE } from './i18n'

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

// ── Libellés par locale — code PARTAGÉ front/back : pas d'accès au helper serveur t(),
// les chaînes vivent donc ici, dans des Records par locale. Défaut fr (les consommateurs
// front existants restent inchangés).

const DAYS: Record<Locale, string[]> = {
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}

const MONTHS: Record<Locale, string[]> = {
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

type RelativeUnit = 'minute' | 'hour' | 'day' | 'month'

// Temps relatif + placeholders : le pluriel suit une logique PROPRE à chaque locale
// (fr : n > 1, « mois » invariable ; en : n ≠ 1) — plus de suffixe manuel partagé.
const LABELS: Record<Locale, {
  notScheduled: string
  notRun: string
  justNow: string
  nextAt: (day: string, dayNum: number, month: string, hour: string) => string
  ago: (n: number, unit: RelativeUnit) => string
}> = {
  fr: {
    notScheduled: 'Pas encore planifié',
    notRun: 'Pas encore exécuté',
    justNow: 'À l\'instant',
    nextAt: (day, dayNum, month, hour) => `${day} ${dayNum} ${month} à ${hour}:00 UTC`,
    ago: (n, unit) => {
      const base: Record<RelativeUnit, string> = { minute: 'minute', hour: 'heure', day: 'jour', month: 'mois' }
      const label = unit === 'month' ? base.month : `${base[unit]}${n > 1 ? 's' : ''}`
      return `il y a ${n} ${label}`
    },
  },
  en: {
    notScheduled: 'Not scheduled yet',
    notRun: 'Not run yet',
    justNow: 'Just now',
    nextAt: (day, dayNum, month, hour) => `${day}, ${month} ${dayNum} at ${hour}:00 UTC`,
    ago: (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`,
  },
}

const VALIDATION_MESSAGES: Record<Locale, Record<'enabled' | 'hour' | 'frequency' | 'dayOfWeek' | 'dayOfMonth', string>> = {
  fr: {
    enabled: 'enabled doit être un booléen',
    hour: 'L\'heure doit être comprise entre 0 et 23 (UTC)',
    frequency: 'Fréquence invalide',
    dayOfWeek: 'Le jour de la semaine doit être compris entre 0 (dim) et 6 (sam)',
    dayOfMonth: 'Le jour du mois doit être compris entre 1 et 31',
  },
  en: {
    enabled: 'enabled must be a boolean',
    hour: 'Hour must be between 0 and 23 (UTC)',
    frequency: 'Invalid frequency',
    dayOfWeek: 'Day of week must be between 0 (Sun) and 6 (Sat)',
    dayOfMonth: 'Day of month must be between 1 and 31',
  },
}

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
 * or a user-facing error message (in the given locale) otherwise.
 */
export function validateSchedule(payload: Partial<CrawlScheduleConfig>, locale: Locale = DEFAULT_LOCALE): string | null {
  const messages = VALIDATION_MESSAGES[locale]
  if (typeof payload.enabled !== 'boolean') return messages.enabled
  if (typeof payload.hour !== 'number' || payload.hour < 0 || payload.hour > 23) {
    return messages.hour
  }

  const freq = payload.frequency
  if (freq !== 'daily' && freq !== 'weekly' && freq !== 'biweekly' && freq !== 'monthly') {
    return messages.frequency
  }

  if (freq === 'weekly' || freq === 'biweekly') {
    if (typeof payload.dayOfWeek !== 'number' || payload.dayOfWeek < 0 || payload.dayOfWeek > 6) {
      return messages.dayOfWeek
    }
  }

  if (freq === 'monthly') {
    const wantsLast = payload.lastDayOfMonth === true
    const dom = payload.dayOfMonth
    if (!wantsLast) {
      if (typeof dom !== 'number' || dom < 1 || dom > 31) {
        return messages.dayOfMonth
      }
    }
  }

  return null
}

export function formatNextCrawlLabel(date: Date | string | null | undefined, locale: Locale = DEFAULT_LOCALE): string {
  const labels = LABELS[locale]
  if (!date) return labels.notScheduled
  const d = typeof date === 'string' ? new Date(date) : date
  const day = DAYS[locale][d.getUTCDay()]
  const num = d.getUTCDate()
  const month = MONTHS[locale][d.getUTCMonth()]
  const hh = String(d.getUTCHours()).padStart(2, '0')
  return labels.nextAt(day!, num, month!, hh)
}

export function formatLastCrawlLabel(date: Date | string | null | undefined, now: Date = new Date(), locale: Locale = DEFAULT_LOCALE): string {
  const labels = LABELS[locale]
  if (!date) return labels.notRun
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - d.getTime()
  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return labels.justNow
  if (minutes < 60) return labels.ago(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return labels.ago(hours, 'hour')
  const days = Math.round(hours / 24)
  if (days < 30) return labels.ago(days, 'day')
  const months = Math.round(days / 30)
  return labels.ago(months, 'month')
}

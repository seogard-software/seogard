import { describe, expect, it } from 'vitest'
import { computeNextCrawlAt, formatLastCrawlLabel, formatNextCrawlLabel, validateSchedule } from './crawl-schedule'

function utc(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute))
}

describe('computeNextCrawlAt — daily', () => {
  it('returns today at the configured hour when current time is earlier', () => {
    const next = computeNextCrawlAt(
      { frequency: 'daily', dayOfWeek: null, dayOfMonth: null, lastDayOfMonth: false, hour: 3, lastCrawledAt: null },
      utc(2026, 5, 23, 1, 0),
    )
    expect(next.toISOString()).toBe('2026-05-23T03:00:00.000Z')
  })

  it('returns tomorrow when the configured hour has already passed today', () => {
    const next = computeNextCrawlAt(
      { frequency: 'daily', dayOfWeek: null, dayOfMonth: null, lastDayOfMonth: false, hour: 3, lastCrawledAt: null },
      utc(2026, 5, 23, 5, 0),
    )
    expect(next.toISOString()).toBe('2026-05-24T03:00:00.000Z')
  })
})

describe('computeNextCrawlAt — weekly', () => {
  it('returns the next occurrence of the target day of week', () => {
    // 2026-05-23 is Saturday (dow=6). Target Wednesday (3) → next is Wed 2026-05-27
    const next = computeNextCrawlAt(
      { frequency: 'weekly', dayOfWeek: 3, dayOfMonth: null, lastDayOfMonth: false, hour: 9, lastCrawledAt: null },
      utc(2026, 5, 23, 12, 0),
    )
    expect(next.toISOString()).toBe('2026-05-27T09:00:00.000Z')
  })

  it('skips to next week when today is the target day but the hour has passed', () => {
    // 2026-05-27 is Wednesday (dow=3). Hour 9 has passed → next Wed 2026-06-03
    const next = computeNextCrawlAt(
      { frequency: 'weekly', dayOfWeek: 3, dayOfMonth: null, lastDayOfMonth: false, hour: 9, lastCrawledAt: null },
      utc(2026, 5, 27, 10, 0),
    )
    expect(next.toISOString()).toBe('2026-06-03T09:00:00.000Z')
  })

  it('stays today when current hour is before the target hour on the right day', () => {
    const next = computeNextCrawlAt(
      { frequency: 'weekly', dayOfWeek: 3, dayOfMonth: null, lastDayOfMonth: false, hour: 9, lastCrawledAt: null },
      utc(2026, 5, 27, 6, 0),
    )
    expect(next.toISOString()).toBe('2026-05-27T09:00:00.000Z')
  })
})

describe('computeNextCrawlAt — biweekly', () => {
  it('behaves like weekly when no previous run is recorded', () => {
    const next = computeNextCrawlAt(
      { frequency: 'biweekly', dayOfWeek: 3, dayOfMonth: null, lastDayOfMonth: false, hour: 9, lastCrawledAt: null },
      utc(2026, 5, 23, 12, 0),
    )
    expect(next.toISOString()).toBe('2026-05-27T09:00:00.000Z')
  })

  it('skips one week when the natural weekly target is less than 14 days after the last run', () => {
    const next = computeNextCrawlAt(
      { frequency: 'biweekly', dayOfWeek: 3, dayOfMonth: null, lastDayOfMonth: false, hour: 9, lastCrawledAt: utc(2026, 5, 20, 9, 0) },
      utc(2026, 5, 23, 12, 0),
    )
    expect(next.toISOString()).toBe('2026-06-03T09:00:00.000Z')
  })
})

describe('computeNextCrawlAt — monthly', () => {
  it('returns the configured day this month when still ahead', () => {
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: 15, lastDayOfMonth: false, hour: 4, lastCrawledAt: null },
      utc(2026, 5, 10, 12, 0),
    )
    expect(next.toISOString()).toBe('2026-05-15T04:00:00.000Z')
  })

  it('rolls to next month when the configured day has passed', () => {
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: 5, lastDayOfMonth: false, hour: 4, lastCrawledAt: null },
      utc(2026, 5, 20, 12, 0),
    )
    expect(next.toISOString()).toBe('2026-06-05T04:00:00.000Z')
  })

  it('clamps to the last day when the requested day exceeds the month length', () => {
    // February 2026 has 28 days, request day 31 → expect 28th
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: 31, lastDayOfMonth: false, hour: 4, lastCrawledAt: null },
      utc(2026, 2, 1, 12, 0),
    )
    expect(next.toISOString()).toBe('2026-02-28T04:00:00.000Z')
  })

  it('honors lastDayOfMonth override regardless of dayOfMonth', () => {
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: 5, lastDayOfMonth: true, hour: 4, lastCrawledAt: null },
      utc(2026, 5, 10, 12, 0),
    )
    expect(next.toISOString()).toBe('2026-05-31T04:00:00.000Z')
  })

  it('lastDayOfMonth in February (28 days, non-leap)', () => {
    // 2026 is not a leap year — February has 28 days
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: null, lastDayOfMonth: true, hour: 3, lastCrawledAt: null },
      utc(2026, 2, 10, 12, 0),
    )
    expect(next.toISOString()).toBe('2026-02-28T03:00:00.000Z')
  })

  it('lastDayOfMonth in February (29 days, leap year)', () => {
    // 2028 is a leap year — February has 29 days
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: null, lastDayOfMonth: true, hour: 3, lastCrawledAt: null },
      utc(2028, 2, 10, 12, 0),
    )
    expect(next.toISOString()).toBe('2028-02-29T03:00:00.000Z')
  })

  it('lastDayOfMonth in a 30-day month (April)', () => {
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: null, lastDayOfMonth: true, hour: 3, lastCrawledAt: null },
      utc(2026, 4, 10, 12, 0),
    )
    expect(next.toISOString()).toBe('2026-04-30T03:00:00.000Z')
  })

  it('lastDayOfMonth rolls to next last day when current month is already done', () => {
    // We are on 2026-05-31 23:00 → 03:00 of the day has passed → roll to June's last day (30th)
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: null, lastDayOfMonth: true, hour: 3, lastCrawledAt: null },
      utc(2026, 5, 31, 23, 0),
    )
    expect(next.toISOString()).toBe('2026-06-30T03:00:00.000Z')
  })

  it('lastDayOfMonth rolls to February correctly when current month is January', () => {
    // From January 31 23:00 → next = Feb 28 (2027 is not a leap year)
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: null, lastDayOfMonth: true, hour: 3, lastCrawledAt: null },
      utc(2027, 1, 31, 23, 0),
    )
    expect(next.toISOString()).toBe('2027-02-28T03:00:00.000Z')
  })

  it('lastDayOfMonth same day before hour returns today (the 31st)', () => {
    // We are on 2026-05-31 01:00 → 03:00 today still ahead → return today
    const next = computeNextCrawlAt(
      { frequency: 'monthly', dayOfWeek: null, dayOfMonth: null, lastDayOfMonth: true, hour: 3, lastCrawledAt: null },
      utc(2026, 5, 31, 1, 0),
    )
    expect(next.toISOString()).toBe('2026-05-31T03:00:00.000Z')
  })

  it('lastDayOfMonth chains correctly month by month', () => {
    // Simulate 3 consecutive runs : May 31 → June 30 → July 31
    const sched = { frequency: 'monthly' as const, dayOfWeek: null, dayOfMonth: null, lastDayOfMonth: true, hour: 3, lastCrawledAt: null }
    const may = computeNextCrawlAt(sched, utc(2026, 5, 1, 0))
    expect(may.toISOString()).toBe('2026-05-31T03:00:00.000Z')

    const june = computeNextCrawlAt({ ...sched, lastCrawledAt: may }, may)
    expect(june.toISOString()).toBe('2026-06-30T03:00:00.000Z')

    const july = computeNextCrawlAt({ ...sched, lastCrawledAt: june }, june)
    expect(july.toISOString()).toBe('2026-07-31T03:00:00.000Z')
  })
})

describe('validateSchedule', () => {
  const base = {
    enabled: true,
    frequency: 'daily' as const,
    dayOfWeek: null,
    dayOfMonth: null,
    lastDayOfMonth: false,
    hour: 3,
  }

  it('accepts a valid daily schedule', () => {
    expect(validateSchedule(base)).toBeNull()
  })

  it('rejects out-of-range hour', () => {
    expect(validateSchedule({ ...base, hour: 24 })).toMatch(/heure/i)
    expect(validateSchedule({ ...base, hour: -1 })).toMatch(/heure/i)
  })

  it('rejects weekly without a valid dayOfWeek', () => {
    expect(validateSchedule({ ...base, frequency: 'weekly', dayOfWeek: null })).toMatch(/jour de la semaine/i)
    expect(validateSchedule({ ...base, frequency: 'weekly', dayOfWeek: 9 })).toMatch(/jour de la semaine/i)
  })

  it('accepts monthly with lastDayOfMonth even when dayOfMonth is null', () => {
    expect(validateSchedule({ ...base, frequency: 'monthly', dayOfMonth: null, lastDayOfMonth: true })).toBeNull()
  })

  it('rejects monthly without dayOfMonth nor lastDayOfMonth', () => {
    expect(validateSchedule({ ...base, frequency: 'monthly', dayOfMonth: null, lastDayOfMonth: false })).toMatch(/jour du mois/i)
  })

  it('rejects an unknown frequency', () => {
    expect(validateSchedule({ ...base, frequency: 'hourly' as never })).toMatch(/fréquence/i)
  })
})

describe('formatNextCrawlLabel', () => {
  it('formats a UTC date as a human label', () => {
    expect(formatNextCrawlLabel(utc(2026, 5, 30, 3))).toMatch(/samedi 30 mai à 03:00 UTC/i)
  })

  it('returns a placeholder when null', () => {
    expect(formatNextCrawlLabel(null)).toMatch(/planifié/i)
  })
})

describe('formatLastCrawlLabel', () => {
  it('returns a placeholder when null', () => {
    expect(formatLastCrawlLabel(null)).toMatch(/exécuté/i)
  })

  it('returns minutes for sub-hour deltas', () => {
    const now = utc(2026, 5, 23, 12, 30)
    expect(formatLastCrawlLabel(utc(2026, 5, 23, 12, 0), now)).toBe('il y a 30 minutes')
  })

  it('returns days for multi-day deltas', () => {
    const now = utc(2026, 5, 23, 12, 0)
    expect(formatLastCrawlLabel(utc(2026, 5, 17, 12, 0), now)).toBe('il y a 6 jours')
  })
})

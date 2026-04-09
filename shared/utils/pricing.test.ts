import { describe, it, expect } from 'vitest'
import {
  canUseCrawls,
  getTrialDaysLeft,
  calculateCloudPrice,
  formatCloudPrice,
  getPriceExamples,
  CLOUD_PRICE_PER_PAGE_DEFAULT,
  getCloudPricePerPage,
  PRICING_ROWS,
  PRICING_SHARED_COUNT,
  PRICING_CLOUD_COUNT,
  PRICE_EXAMPLES,
} from './pricing'

// ── canUseCrawls ──

describe('canUseCrawls', () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago

  it('returns true when status is active (ignores trialEndsAt)', () => {
    expect(canUseCrawls('active')).toBe(true)
    expect(canUseCrawls('active', null)).toBe(true)
    expect(canUseCrawls('active', pastDate)).toBe(true)
  })

  it('returns true when status is past_due (ignores trialEndsAt)', () => {
    expect(canUseCrawls('past_due')).toBe(true)
    expect(canUseCrawls('past_due', null)).toBe(true)
  })

  it('returns true when trialing with future trialEndsAt', () => {
    expect(canUseCrawls('trialing', futureDate)).toBe(true)
    expect(canUseCrawls('trialing', futureDate.toISOString())).toBe(true)
  })

  it('returns false when trialing with past trialEndsAt', () => {
    expect(canUseCrawls('trialing', pastDate)).toBe(false)
  })

  it('returns false when trialing with null trialEndsAt', () => {
    expect(canUseCrawls('trialing', null)).toBe(false)
    expect(canUseCrawls('trialing')).toBe(false)
  })

  it('returns false when canceled', () => {
    expect(canUseCrawls('canceled')).toBe(false)
    expect(canUseCrawls('canceled', futureDate)).toBe(false)
  })

  it('returns false when undefined', () => {
    expect(canUseCrawls(undefined)).toBe(false)
  })

  it('returns false when unpaid', () => {
    expect(canUseCrawls('unpaid')).toBe(false)
  })

  it('returns false when incomplete', () => {
    expect(canUseCrawls('incomplete')).toBe(false)
  })
})

// ── getTrialDaysLeft ──

describe('getTrialDaysLeft', () => {
  it('returns 0 for null', () => {
    expect(getTrialDaysLeft(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(getTrialDaysLeft(undefined)).toBe(0)
  })

  it('returns 0 for past date', () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(getTrialDaysLeft(past)).toBe(0)
  })

  it('returns correct days for future date', () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    expect(getTrialDaysLeft(future)).toBe(7)
  })

  it('returns 14 for 14 days from now', () => {
    const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    expect(getTrialDaysLeft(future)).toBe(14)
  })

  it('returns 1 for less than 24h remaining', () => {
    const future = new Date(Date.now() + 12 * 60 * 60 * 1000) // 12h
    expect(getTrialDaysLeft(future)).toBe(1)
  })

  it('works with ISO string', () => {
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    expect(getTrialDaysLeft(future.toISOString())).toBe(5)
  })
})

// ── calculateCloudPrice ──

describe('calculateCloudPrice', () => {
  it('calculates price for 1K pages', () => {
    expect(calculateCloudPrice(1_000)).toBe(1_000 * getCloudPricePerPage())
  })

  it('calculates price for 10K pages', () => {
    expect(calculateCloudPrice(10_000)).toBe(10_000 * getCloudPricePerPage())
  })

  it('calculates price for 50K pages', () => {
    expect(calculateCloudPrice(50_000)).toBe(50_000 * getCloudPricePerPage())
  })

  it('returns 0 for 0 pages', () => {
    expect(calculateCloudPrice(0)).toBe(0)
  })
})

// ── formatCloudPrice ──

describe('formatCloudPrice', () => {
  it('returns a formatted string', () => {
    const result = formatCloudPrice()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

// ── getPriceExamples ──

describe('getPriceExamples', () => {
  it('returns an array with correct length', () => {
    const examples = getPriceExamples()
    expect(examples).toHaveLength(PRICE_EXAMPLES.length)
  })

  it('each example has pages, label, and price', () => {
    const examples = getPriceExamples()
    for (const ex of examples) {
      expect(ex.pages).toBeGreaterThan(0)
      expect(ex.label).toBeTruthy()
      expect(ex.price).toBeTruthy()
    }
  })

  it('prices are consistent with CLOUD_PRICE_PER_PAGE', () => {
    const examples = getPriceExamples()
    for (const ex of examples) {
      const expected = calculateCloudPrice(ex.pages)
      const parsed = Number(ex.price.replace(/\s/g, '').replace(',', '.'))
      expect(parsed).toBe(expected)
    }
  })
})

// ── PRICING_ROWS ──

describe('PRICING_ROWS', () => {
  it('has rows with label and boolean flags', () => {
    expect(PRICING_ROWS.length).toBeGreaterThan(0)
    for (const row of PRICING_ROWS) {
      expect(row.label).toBeTruthy()
      expect(typeof row.selfHosted).toBe('boolean')
      expect(typeof row.cloud).toBe('boolean')
    }
  })

  it('all enterprise rows are true', () => {
    for (const row of PRICING_ROWS) {
      expect(row.enterprise).toBe(true)
    }
  })

  it('shared count matches rows where all three are true', () => {
    const shared = PRICING_ROWS.filter(r => r.selfHosted && r.cloud && r.enterprise).length
    expect(PRICING_SHARED_COUNT).toBe(shared)
  })

  it('cloud count matches cloud-only rows', () => {
    const cloudOnly = PRICING_ROWS.filter(r => !r.selfHosted && r.cloud && r.enterprise).length
    expect(PRICING_CLOUD_COUNT).toBe(cloudOnly)
  })

  it('rows are ordered: shared, then cloud-only, then enterprise-only', () => {
    const rows = PRICING_ROWS
    for (let i = 0; i < PRICING_SHARED_COUNT; i++) {
      expect(rows[i]!.selfHosted).toBe(true)
      expect(rows[i]!.cloud).toBe(true)
    }
    for (let i = PRICING_SHARED_COUNT; i < PRICING_SHARED_COUNT + PRICING_CLOUD_COUNT; i++) {
      expect(rows[i]!.selfHosted).toBe(false)
      expect(rows[i]!.cloud).toBe(true)
    }
  })
})

// ── getCloudPricePerPage ──

describe('getCloudPricePerPage', () => {
  it('returns a positive number', () => {
    expect(getCloudPricePerPage()).toBeGreaterThan(0)
  })

  it('defaults to CLOUD_PRICE_PER_PAGE_DEFAULT without env/runtimeConfig', () => {
    expect(getCloudPricePerPage()).toBe(CLOUD_PRICE_PER_PAGE_DEFAULT)
  })
})

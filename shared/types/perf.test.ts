import { describe, expect, it } from 'vitest'
import { rateCls, rateLcp, rateTtfb } from './perf'

describe('rateLcp (seuils Google 2,5s / 4,0s)', () => {
  it('good en dessous de 2500ms', () => {
    expect(rateLcp(0)).toBe('good')
    expect(rateLcp(2500)).toBe('good')
  })
  it('needs-improvement entre 2500 et 4000ms', () => {
    expect(rateLcp(2501)).toBe('needs-improvement')
    expect(rateLcp(4000)).toBe('needs-improvement')
  })
  it('poor au-delà de 4000ms', () => {
    expect(rateLcp(4001)).toBe('poor')
    expect(rateLcp(12000)).toBe('poor')
  })
})

describe('rateCls (seuils Google 0,1 / 0,25)', () => {
  it('good en dessous de 0,1', () => {
    expect(rateCls(0)).toBe('good')
    expect(rateCls(0.1)).toBe('good')
  })
  it('needs-improvement entre 0,1 et 0,25', () => {
    expect(rateCls(0.11)).toBe('needs-improvement')
    expect(rateCls(0.25)).toBe('needs-improvement')
  })
  it('poor au-delà de 0,25', () => {
    expect(rateCls(0.26)).toBe('poor')
    expect(rateCls(1)).toBe('poor')
  })
})

describe('rateTtfb (seuils Google 800ms / 1800ms)', () => {
  it('good en dessous de 800ms', () => {
    expect(rateTtfb(180)).toBe('good')
    expect(rateTtfb(800)).toBe('good')
  })
  it('needs-improvement entre 800 et 1800ms', () => {
    expect(rateTtfb(801)).toBe('needs-improvement')
    expect(rateTtfb(1800)).toBe('needs-improvement')
  })
  it('poor au-delà de 1800ms', () => {
    expect(rateTtfb(1801)).toBe('poor')
    expect(rateTtfb(5000)).toBe('poor')
  })
})

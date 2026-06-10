import { describe, it, expect } from 'vitest'
import { computeCiVerdict } from './ci-verdict'

describe('computeCiVerdict', () => {
  it('standard : bloque dès 1 critical', () => {
    expect(computeCiVerdict('standard', { critical: 0, warning: 3, info: 1 }).pass).toBe(true)
    expect(computeCiVerdict('standard', { critical: 2, warning: 5, info: 0 }).pass).toBe(false)
  })

  it('strict : bloque dès 1 critical OU 1 warning', () => {
    expect(computeCiVerdict('strict', { critical: 0, warning: 2, info: 0 }).pass).toBe(false)
    expect(computeCiVerdict('strict', { critical: 0, warning: 0, info: 3 }).pass).toBe(true) // info ne bloque pas
    expect(computeCiVerdict('strict', { critical: 1, warning: 0, info: 0 }).pass).toBe(false)
  })

  it('relaxed : bloque à partir de 5 critical', () => {
    expect(computeCiVerdict('relaxed', { critical: 4, warning: 10, info: 5 }).pass).toBe(true)
    expect(computeCiVerdict('relaxed', { critical: 5, warning: 0, info: 0 }).pass).toBe(false)
  })

  it('renvoie un message dans tous les cas', () => {
    expect(computeCiVerdict('standard', { critical: 0, warning: 0, info: 0 }).message).toBeTruthy()
    expect(computeCiVerdict('relaxed', { critical: 6, warning: 0, info: 0 }).message).toContain('5')
  })
})

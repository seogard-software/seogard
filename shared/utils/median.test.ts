import { describe, it, expect } from 'vitest'
import { median } from './median'

describe('median', () => {
  it('série impaire → valeur du milieu', () => {
    expect(median([3, 1, 2])).toBe(2)
    expect(median([724, 11684, 2216, 2020, 3520])).toBe(2216) // pic aberrant 11684 ignoré
  })

  it('série paire → moyenne des deux valeurs centrales', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })

  it('un seul élément', () => {
    expect(median([42])).toBe(42)
  })

  it('série vide → null', () => {
    expect(median([])).toBeNull()
  })

  it('robuste aux pics : la médiane n\'est pas tirée par une valeur aberrante (vs moyenne)', () => {
    const vals = [724, 11684, 2216, 2020, 3520]
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length // ~4033 (faussé par 11684)
    expect(median(vals)).toBeLessThan(avg)
    expect(median(vals)).toBe(2216)
  })

  it('ne mute pas le tableau d\'entrée', () => {
    const input = [3, 1, 2]
    median(input)
    expect(input).toEqual([3, 1, 2])
  })
})

import { describe, it, expect } from 'vitest'
import { patternsToRegex, patternsToRegexSource, matchesPatterns, isValidPattern, normalizePattern } from './zone'

describe('patternsToRegex', () => {
  it('matches everything with **', () => {
    const regex = patternsToRegex(['**'])
    expect(regex.test('/')).toBe(true)
    expect(regex.test('/blog/article')).toBe(true)
    expect(regex.test('/any/deep/path')).toBe(true)
  })

  it('matches path prefix with /**', () => {
    const regex = patternsToRegex(['/blog/**'])
    expect(regex.test('/blog/')).toBe(true)
    expect(regex.test('/blog/article')).toBe(true)
    expect(regex.test('/blog/seo/tips')).toBe(true)
    expect(regex.test('/produits/xyz')).toBe(false)
    expect(regex.test('/')).toBe(false)
  })

  it('matches single level with /*', () => {
    const regex = patternsToRegex(['/blog/*'])
    expect(regex.test('/blog/article')).toBe(true)
    expect(regex.test('/blog/seo/tips')).toBe(false)
    expect(regex.test('/blog/')).toBe(false)
  })

  it('matches multiple patterns (OR)', () => {
    const regex = patternsToRegex(['/colis/**', '/envoi/**'])
    expect(regex.test('/colis/abc')).toBe(true)
    expect(regex.test('/envoi/xyz')).toBe(true)
    expect(regex.test('/blog/post')).toBe(false)
  })

  it('matches nothing with empty array', () => {
    const regex = patternsToRegex([])
    expect(regex.test('/')).toBe(false)
    expect(regex.test('/anything')).toBe(false)
  })

  it('escapes regex special characters in paths', () => {
    const regex = patternsToRegex(['/page.html'])
    expect(regex.test('/page.html')).toBe(true)
    expect(regex.test('/pagexhtml')).toBe(false)
  })

  it('matches exact path without wildcard', () => {
    const regex = patternsToRegex(['/blog'])
    expect(regex.test('/blog')).toBe(true)
    expect(regex.test('/blog/article')).toBe(false)
    expect(regex.test('/blog/')).toBe(false)
  })

  it('matches exact path + sub-paths when both patterns given', () => {
    const regex = patternsToRegex(['/blog', '/blog/**'])
    expect(regex.test('/blog')).toBe(true)
    expect(regex.test('/blog/article')).toBe(true)
    expect(regex.test('/blog/seo/tips')).toBe(true)
    expect(regex.test('/produits')).toBe(false)
  })
})

describe('patternsToRegexSource', () => {
  it('returns storable regex source string', () => {
    const source = patternsToRegexSource(['/blog/**'])
    expect(typeof source).toBe('string')
    const regex = new RegExp(source)
    expect(regex.test('/blog/article')).toBe(true)
    expect(regex.test('/produits/xyz')).toBe(false)
  })

  it('handles ** pattern', () => {
    const source = patternsToRegexSource(['**'])
    expect(source).toBe('^')
  })
})

describe('matchesPatterns', () => {
  it('delegates to patternsToRegex correctly', () => {
    expect(matchesPatterns('/blog/article', ['/blog/**'])).toBe(true)
    expect(matchesPatterns('/produits/xyz', ['/blog/**'])).toBe(false)
    expect(matchesPatterns('/colis/abc', ['/colis/**', '/envoi/**'])).toBe(true)
    expect(matchesPatterns('/envoi/xyz', ['/colis/**', '/envoi/**'])).toBe(true)
    expect(matchesPatterns('/', ['**'])).toBe(true)
  })
})

describe('normalizePattern', () => {
  it('preserves exact paths without wildcard', () => {
    expect(normalizePattern('/imprimante')).toBe('/imprimante')
    expect(normalizePattern('/blog')).toBe('/blog')
    expect(normalizePattern('/produits/hp')).toBe('/produits/hp')
  })

  it('strips trailing slash', () => {
    expect(normalizePattern('/imprimante/')).toBe('/imprimante')
  })

  it('does not modify patterns that already have wildcards', () => {
    expect(normalizePattern('/blog/**')).toBe('/blog/**')
    expect(normalizePattern('/blog/*')).toBe('/blog/*')
  })

  it('does not modify **', () => {
    expect(normalizePattern('**')).toBe('**')
  })
})

describe('isValidPattern', () => {
  it('accepts **', () => {
    expect(isValidPattern('**')).toBe(true)
  })

  it('accepts paths starting with /', () => {
    expect(isValidPattern('/blog/**')).toBe(true)
    expect(isValidPattern('/produits/*')).toBe(true)
    expect(isValidPattern('/a')).toBe(true)
  })

  it('rejects patterns not starting with /', () => {
    expect(isValidPattern('blog/**')).toBe(false)
    expect(isValidPattern('')).toBe(false)
  })

  it('rejects single /', () => {
    expect(isValidPattern('/')).toBe(false)
  })
})

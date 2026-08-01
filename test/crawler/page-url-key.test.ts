import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { normalizePageUrl } from '../../shared/utils/sitemap'
import { normalizeSiteUrl } from '../../shared/utils/validation'

const ROOT = resolve(__dirname, '../..')

describe('normalizePageUrl — clé unique d une page', () => {
  it('la racine porte toujours le slash, avec ou sans', () => {
    expect(normalizePageUrl('https://x.com')).toBe('https://x.com/')
    expect(normalizePageUrl('https://x.com/')).toBe('https://x.com/')
  })

  it('deux écritures de la racine donnent la MÊME clé', () => {
    // Le bug : phase SSR sous 'https://x.com/', phase CSR sous 'https://x.com'.
    expect(normalizePageUrl('https://x.com')).toBe(normalizePageUrl('https://x.com/'))
  })

  it('le hostname est mis en minuscule', () => {
    expect(normalizePageUrl('https://X.COM/Blog')).toBe('https://x.com/Blog')
  })

  it('la casse du chemin est préservée (significative sous Linux)', () => {
    expect(normalizePageUrl('https://x.com/Blog/Article')).toBe('https://x.com/Blog/Article')
  })

  it('le fragment est retiré', () => {
    expect(normalizePageUrl('https://x.com/blog#section')).toBe('https://x.com/blog')
  })

  it('la query est conservée', () => {
    expect(normalizePageUrl('https://x.com/search?q=seo')).toBe('https://x.com/search?q=seo')
  })

  it('une URL invalide est rendue telle quelle', () => {
    expect(normalizePageUrl('pas-une-url')).toBe('pas-une-url')
  })
})

describe('normalizeSiteUrl — identité d un site, distincte', () => {
  it('retire le slash final', () => {
    expect(normalizeSiteUrl('https://x.com/')).toBe('https://x.com')
  })

  it('produit une forme DIFFÉRENTE de la clé de page — les deux ne sont pas interchangeables', () => {
    expect(normalizeSiteUrl('https://x.com/')).not.toBe(normalizePageUrl('https://x.com/'))
  })
})

/** Empêche la réapparition d un 5e normaliseur : deux homonymes au comportement
 *  opposé sont à l origine du bug. */
describe('un seul normaliseur d URL de page', () => {
  const scan = (dir: string): string[] => {
    const out: string[] = []
    const walk = (current: string) => {
      for (const entry of readdirSync(current)) {
        const full = join(current, entry)
        if (statSync(full).isDirectory()) walk(full)
        else if (/\.ts$/.test(entry) && !/\.test\.ts$/.test(entry)) out.push(full)
      }
    }
    walk(join(ROOT, dir))
    return out
  }

  it('aucune définition locale de normalizePageUrl hors shared/utils/sitemap.ts', () => {
    const offenders = ['crawler', 'server']
      .flatMap(scan)
      .filter(file => /function\s+normalizePageUrl\b/.test(readFileSync(file, 'utf8')))

    expect(offenders, 'Réutiliser normalizePageUrl de shared/utils/sitemap').toEqual([])
  })

  it('aucune fonction normalizeUrl ne subsiste (nom ambigu, supprimé)', () => {
    const offenders = ['crawler', 'server', 'shared']
      .flatMap(scan)
      .filter(file => /function\s+normalizeUrl\b/.test(readFileSync(file, 'utf8')))

    expect(offenders, 'Utiliser normalizePageUrl (page) ou normalizeSiteUrl (site)').toEqual([])
  })
})

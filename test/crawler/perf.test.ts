import { describe, expect, it } from 'vitest'
import { aggregateWeights, classifyResourceType, resolveTtfb } from '../../crawler/perf'

describe('classifyResourceType', () => {
  it('classe par initiatorType en priorité', () => {
    expect(classifyResourceType('https://x.com/a', 'css')).toBe('css')
    expect(classifyResourceType('https://x.com/a', 'script')).toBe('js')
    expect(classifyResourceType('https://x.com/a', 'img')).toBe('img')
  })

  it('classe par extension quand initiatorType est générique', () => {
    expect(classifyResourceType('https://x.com/style.css', 'link')).toBe('css')
    expect(classifyResourceType('https://x.com/app.js', 'other')).toBe('js')
    expect(classifyResourceType('https://x.com/photo.webp', 'other')).toBe('img')
    expect(classifyResourceType('https://x.com/font.woff2', 'other')).toBe('font')
  })

  it('met le reste dans other', () => {
    expect(classifyResourceType('https://x.com/data.json', 'fetch')).toBe('other')
  })
})

describe('aggregateWeights', () => {
  it('agrège le poids par type et ajoute le HTML', () => {
    const resources = [
      { name: 'app.js', initiatorType: 'script', transferSize: 200 * 1024, encodedBodySize: 200 * 1024 },
      { name: 'style.css', initiatorType: 'css', transferSize: 50 * 1024, encodedBodySize: 50 * 1024 },
      { name: 'hero.webp', initiatorType: 'img', transferSize: 300 * 1024, encodedBodySize: 300 * 1024 },
      { name: 'font.woff2', initiatorType: 'other', transferSize: 40 * 1024, encodedBodySize: 40 * 1024 },
    ]
    const w = aggregateWeights(resources, 20 * 1024)

    expect(w.weightHtmlKb).toBe(20)
    expect(w.weightJsKb).toBe(200)
    expect(w.weightCssKb).toBe(50)
    expect(w.weightImgKb).toBe(300)
    expect(w.weightFontKb).toBe(40)
    expect(w.weightTotalKb).toBe(610) // 20 + 200 + 50 + 300 + 40
    expect(w.requestCount).toBe(5) // 4 ressources + 1 document
  })

  it('utilise encodedBodySize en fallback quand transferSize vaut 0 (cross-origin)', () => {
    const resources = [
      { name: 'cdn.js', initiatorType: 'script', transferSize: 0, encodedBodySize: 100 * 1024 },
    ]
    const w = aggregateWeights(resources, 0)
    expect(w.weightJsKb).toBe(100)
  })

  it('gère une page sans ressource', () => {
    const w = aggregateWeights([], 15 * 1024)
    expect(w.weightTotalKb).toBe(15)
    expect(w.requestCount).toBe(1)
  })
})

describe('resolveTtfb', () => {
  it('utilise le responseStart de la navigation (render chaud) et l\'arrondit', () => {
    expect(resolveTtfb(236.7, 4000)).toBe(237)
  })

  it('retombe sur le TTFB SSR si responseStart est null (navigation timing absente)', () => {
    expect(resolveTtfb(null, 4000)).toBe(4000)
  })

  it('retombe sur le TTFB SSR si responseStart vaut 0 (mesure invalide)', () => {
    expect(resolveTtfb(0, 850)).toBe(850)
  })
})

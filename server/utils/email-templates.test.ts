import { describe, expect, it } from 'vitest'
import { crawlReportTemplate, welcomeTemplate, sitemapEstimateTemplate } from './email-templates'

const base = {
  siteName: 'le-code.dev',
  siteId: 's1',
  zoneName: null,
  zoneId: null,
  regressions: [] as { pageUrl: string, severity: string, message: string }[],
  fixed: [] as { pageUrl: string, message: string }[],
  topRecos: [] as { ruleId: string, label: string, pagesAffected: number, siteLevel: boolean, hint: string | null }[],
  recoCount: 0,
}

describe('crawlReportTemplate — sujet (monitoring-first, FR)', () => {
  it('régressions seules → 🔴', () => {
    const { subject } = crawlReportTemplate({
      ...base,
      regressions: [{ pageUrl: '/a', severity: 'critical', message: 'x' }, { pageUrl: '/b', severity: 'warning', message: 'y' }],
    })
    expect(subject).toBe('🔴 2 régressions détectées — le-code.dev')
  })

  it('régressions + réparées → 🔴 … · réparées', () => {
    const { subject } = crawlReportTemplate({
      ...base,
      regressions: [{ pageUrl: '/a', severity: 'critical', message: 'x' }],
      fixed: [{ pageUrl: '/b', message: 'z' }],
    })
    expect(subject).toBe('🔴 1 régression détectée · 1 réparée — le-code.dev')
  })

  it('réparées seules → 🟢 (bonne nouvelle)', () => {
    const { subject } = crawlReportTemplate({
      ...base,
      fixed: [{ pageUrl: '/a', message: 'z' }, { pageUrl: '/b', message: 'w' }],
    })
    expect(subject).toBe('🟢 2 régressions réparées — le-code.dev')
  })

  it('le label inclut la zone', () => {
    const { subject } = crawlReportTemplate({
      ...base,
      zoneName: 'Blog',
      regressions: [{ pageUrl: '/a', severity: 'critical', message: 'x' }],
    })
    expect(subject).toContain('— le-code.dev › Blog')
  })

  it('pas de jargon anglais "critical/warning" dans le sujet', () => {
    const { subject } = crawlReportTemplate({
      ...base,
      regressions: [{ pageUrl: '/a', severity: 'critical', message: 'x' }],
    })
    expect(subject.toLowerCase()).not.toContain('critical')
    expect(subject.toLowerCase()).not.toContain('warning')
  })

})

describe('crawlReportTemplate — corps', () => {
  it('ligne reco ABSENTE si recoCount = 0', () => {
    const { html } = crawlReportTemplate({
      ...base,
      regressions: [{ pageUrl: '/a', severity: 'critical', message: 'x' }],
    })
    expect(html).not.toContain('Recommandation')
  })

  it('ligne reco : top reco nommée + reste en compteur (recoCount - pages affichées)', () => {
    const { html } = crawlReportTemplate({
      ...base,
      regressions: [{ pageUrl: '/a', severity: 'critical', message: 'x' }],
      topRecos: [{ ruleId: 'rec_llms_txt_missing', label: '/llms.txt manquant', pagesAffected: 1, siteLevel: true, hint: 'visibilité IA (ChatGPT, Claude, Perplexity)' }],
      recoCount: 23,
    })
    expect(html).toContain('/llms.txt manquant')
    expect(html).toContain('visibilité IA')
    expect(html).toContain('+ 22 autres recommandations') // 23 - 1
  })

  it('régressions listées, critiques AVANT warnings', () => {
    const { html } = crawlReportTemplate({
      ...base,
      regressions: [
        { pageUrl: '/w', severity: 'warning', message: 'WARN_MSG' },
        { pageUrl: '/c', severity: 'critical', message: 'CRIT_MSG' },
      ],
    })
    expect(html.indexOf('CRIT_MSG')).toBeLessThan(html.indexOf('WARN_MSG'))
  })

  it('plafonne à 8 régressions + « +N autres »', () => {
    const regressions = Array.from({ length: 11 }, (_, i) => ({ pageUrl: `/p${i}`, severity: 'warning', message: `M${i}` }))
    const { html } = crawlReportTemplate({ ...base, regressions })
    expect(html).toContain('+3 autres régressions') // 11 - 8
  })
})

describe('i18n des templates (chaînes dans i18n/locales/<locale>/emails.json)', () => {
  it('rendu en fr → contient le texte FR attendu', () => {
    const { subject, html } = welcomeTemplate('fr')
    expect(subject).toBe('Votre essai Seogard est actif — commencez votre premier crawl')
    expect(html).toContain('Bienvenue sur Seogard')
    expect(html).toContain('lang="fr"')
  })

  it('rendu en en (locale traduite) → sujet EN acté, jamais de clé brute ni de FR', () => {
    const en = welcomeTemplate('en')
    expect(en.subject).toBe("You're in. Here's how to catch your first regression.")
    expect(en.html).not.toContain('Bienvenue sur Seogard')
    expect(en.html).not.toContain('emails.welcome.') // jamais de clé brute dans un email
  })
})

describe('sitemapEstimateTemplate — locale du prospect (lead public)', () => {
  const data = { url: 'exemple.com', pageCount: 1234, price: '', sitemapUrl: 'https://exemple.com/sitemap.xml' }

  it('FR : sujet français + nombre au format FR (espace)', () => {
    const { subject } = sitemapEstimateTemplate({ ...data, price: '12 €' }, 'fr')
    expect(subject).toContain('Votre estimation')
    expect(subject).toMatch(/1.234 pages/) // 1<espace fine insécable>234
    expect(subject).not.toContain('1,234') // jamais le format EN
  })

  it('EN : sujet anglais + nombre au format EN (virgule)', () => {
    const { subject, html } = sitemapEstimateTemplate({ ...data, price: '$12' }, 'en')
    expect(subject).toContain('Your estimate')
    expect(subject).toContain('1,234 pages') // séparateur virgule EN
    expect(html).not.toContain('Votre estimation')
    expect(html).not.toContain('emails.sitemapEstimate.') // aucune clé brute
  })
})

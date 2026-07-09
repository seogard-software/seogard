import { describe, it, expect } from 'vitest'
import { t } from '../../server/utils/i18n'

describe('helper serveur t(locale, key, params)', () => {
  it('retombe sur la clé elle-même quand elle est absente (un email part toujours)', () => {
    expect(t('fr', 'emails.cle.inexistante')).toBe('emails.cle.inexistante')
    expect(t('en', 'report.autre.cle')).toBe('report.autre.cle')
  })

  it('interpole les paramètres {nommés} et laisse intacts les inconnus', () => {
    // La clé absente sert de template : on vérifie le moteur d interpolation directement.
    expect(t('fr', '{count} pages sur {site}', { count: 12, site: 'seogard.io' })).toBe('12 pages sur seogard.io')
    expect(t('fr', '{connu} et {inconnu}', { connu: 'ok' })).toBe('ok et {inconnu}')
  })
})

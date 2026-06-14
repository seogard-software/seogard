import { describe, it, expect } from 'vitest'
import { activityVerdict } from './crawl-snapshot'

describe('activityVerdict', () => {
  it('sévérité max des régressions du crawl', () => {
    expect(activityVerdict(2, 1, 3)).toBe('critical')
    expect(activityVerdict(0, 3, 3)).toBe('warning')
    expect(activityVerdict(0, 0, 1)).toBe('info')
    expect(activityVerdict(0, 0, 0)).toBe('stable')
  })
})

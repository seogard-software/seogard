import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isSelfHosted, isCloud } from './deployment'

describe('deployment helpers', () => {
  const originalEnv = process.env.NUXT_PUBLIC_SELF_HOSTED

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.NUXT_PUBLIC_SELF_HOSTED
    else process.env.NUXT_PUBLIC_SELF_HOSTED = originalEnv
  })

  it('returns self-hosted when NUXT_PUBLIC_SELF_HOSTED=true', () => {
    process.env.NUXT_PUBLIC_SELF_HOSTED = 'true'
    expect(isSelfHosted()).toBe(true)
    expect(isCloud()).toBe(false)
  })

  it('returns cloud when NUXT_PUBLIC_SELF_HOSTED=false', () => {
    process.env.NUXT_PUBLIC_SELF_HOSTED = 'false'
    expect(isSelfHosted()).toBe(false)
    expect(isCloud()).toBe(true)
  })

  it('returns cloud when NUXT_PUBLIC_SELF_HOSTED is not set', () => {
    delete process.env.NUXT_PUBLIC_SELF_HOSTED
    expect(isSelfHosted()).toBe(false)
    expect(isCloud()).toBe(true)
  })

  it('returns cloud when NUXT_PUBLIC_SELF_HOSTED is empty string', () => {
    process.env.NUXT_PUBLIC_SELF_HOSTED = ''
    expect(isSelfHosted()).toBe(false)
    expect(isCloud()).toBe(true)
  })
})

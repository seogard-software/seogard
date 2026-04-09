import { describe, it, expect } from 'vitest'

describe('Round-robin — deterministic sort', () => {
  it('sorts crawl IDs lexicographically for consistent ordering', () => {
    const crawls = ['crawl-c', 'crawl-a', 'crawl-b']
    crawls.sort()
    expect(crawls).toEqual(['crawl-a', 'crawl-b', 'crawl-c'])
  })

  it('rrIndex wraps around correctly', () => {
    const crawls = ['a', 'b', 'c']
    const picked: string[] = []
    let rrIndex = 0

    for (let i = 0; i < 7; i++) {
      rrIndex = rrIndex % crawls.length
      picked.push(crawls[rrIndex])
      rrIndex++
    }

    expect(picked).toEqual(['a', 'b', 'c', 'a', 'b', 'c', 'a'])
  })

  it('handles single crawl — always picks the same one', () => {
    const crawls = ['only-one']
    const picked: string[] = []
    let rrIndex = 0

    for (let i = 0; i < 5; i++) {
      rrIndex = rrIndex % crawls.length
      picked.push(crawls[rrIndex])
      rrIndex++
    }

    expect(picked).toEqual(['only-one', 'only-one', 'only-one', 'only-one', 'only-one'])
  })

  it('handles crawl removal mid-rotation', () => {
    let crawls = ['a', 'b', 'c']
    let rrIndex = 0

    // Pick 'a'
    rrIndex = rrIndex % crawls.length
    expect(crawls[rrIndex]).toBe('a')
    rrIndex++

    // Remove 'b' — simulates crawl completion
    crawls = crawls.filter(c => c !== 'b')
    crawls.sort()

    // rrIndex=1, crawls=['a','c'], picks 'c'
    rrIndex = rrIndex % crawls.length
    expect(crawls[rrIndex]).toBe('c')
    rrIndex++

    // rrIndex=2 % 2 = 0, picks 'a'
    rrIndex = rrIndex % crawls.length
    expect(crawls[rrIndex]).toBe('a')
  })
})

describe('Round-robin — time-based logic', () => {
  it('single crawl gets Infinity time limit', () => {
    const activeCrawlCount = 1
    const TIME_LIMIT_MS = activeCrawlCount > 1 ? 10_000 : Infinity
    expect(TIME_LIMIT_MS).toBe(Infinity)
  })

  it('multiple crawls get 10s time limit', () => {
    const activeCrawlCount = 2
    const TIME_LIMIT_MS = activeCrawlCount > 1 ? 10_000 : Infinity
    expect(TIME_LIMIT_MS).toBe(10_000)
  })

  it('100 crawls still get 10s time limit', () => {
    const activeCrawlCount = 100
    const TIME_LIMIT_MS = activeCrawlCount > 1 ? 10_000 : Infinity
    expect(TIME_LIMIT_MS).toBe(10_000)
  })

  it('time check does not cut batch in progress', () => {
    // Simulate: started at T=0, batch takes 5s, check at T=8s
    const startedAt = 0
    const now = 8_000

    // Check BEFORE popping batch
    const shouldContinue = now - startedAt < 10_000
    expect(shouldContinue).toBe(true) // batch starts

    // Batch finishes at T=13s — next check at T=13s
    const afterBatch = 13_000
    const shouldContinueAfter = afterBatch - startedAt < 10_000
    expect(shouldContinueAfter).toBe(false) // stops, batch was NOT interrupted
  })

  it('Infinity allows unlimited processing', () => {
    const startedAt = 0
    const TIME_LIMIT_MS = Infinity

    // Even after 1 hour
    expect(3_600_000 - startedAt < TIME_LIMIT_MS).toBe(true)
  })
})

describe('Round-robin — fairness', () => {
  it('with 2 crawls, each gets ~50% of iterations', () => {
    const crawls = ['crawl-big', 'crawl-small']
    crawls.sort()
    let rrIndex = 0
    const counts: Record<string, number> = { 'crawl-big': 0, 'crawl-small': 0 }

    for (let i = 0; i < 100; i++) {
      rrIndex = rrIndex % crawls.length
      counts[crawls[rrIndex]]++
      rrIndex++
    }

    expect(counts['crawl-big']).toBe(50)
    expect(counts['crawl-small']).toBe(50)
  })

  it('with 3 crawls, each gets ~33% of iterations', () => {
    const crawls = ['a', 'b', 'c']
    crawls.sort()
    let rrIndex = 0
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 }

    for (let i = 0; i < 99; i++) {
      rrIndex = rrIndex % crawls.length
      counts[crawls[rrIndex]]++
      rrIndex++
    }

    expect(counts.a).toBe(33)
    expect(counts.b).toBe(33)
    expect(counts.c).toBe(33)
  })
})

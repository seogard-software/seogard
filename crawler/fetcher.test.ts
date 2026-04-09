import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  }),
}))

import { fetchPage } from './fetcher'

function mockResponse(
  status: number,
  html = '<html><head><title>Test</title></head><body>Hello world content here</body></html>',
  headers: Record<string, string> = {},
  url = 'https://example.com',
) {
  return {
    status,
    url,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    text: () => Promise.resolve(html),
  } as unknown as Response
}

describe('fetchPage', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns result on 200 without retry', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(200))

    const result = await fetchPage('https://example.com')

    expect(result.statusCode).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('retries on 429 then returns 200', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(429))
      .mockResolvedValueOnce(mockResponse(200))

    const promise = fetchPage('https://example.com')
    await vi.advanceTimersByTimeAsync(2_000)
    const result = await promise

    expect(result.statusCode).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns 429 after exhausting retries', async () => {
    mockFetch.mockResolvedValue(mockResponse(429))

    const promise = fetchPage('https://example.com')
    await vi.advanceTimersByTimeAsync(1_000 + 2_000)
    const result = await promise

    expect(result.statusCode).toBe(429)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('retries on 503 then returns 200', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(503))
      .mockResolvedValueOnce(mockResponse(200))

    const promise = fetchPage('https://example.com')
    await vi.advanceTimersByTimeAsync(2_000)
    const result = await promise

    expect(result.statusCode).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns 503 after exhausting retries', async () => {
    mockFetch.mockResolvedValue(mockResponse(503))

    const promise = fetchPage('https://example.com')
    await vi.advanceTimersByTimeAsync(1_000 + 2_000)
    const result = await promise

    expect(result.statusCode).toBe(503)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('respects Retry-After header on 429', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(429, '<html><head><title>Test</title></head><body></body></html>', { 'retry-after': '3' }))
      .mockResolvedValueOnce(mockResponse(200))

    const promise = fetchPage('https://example.com')

    await vi.advanceTimersByTimeAsync(2_999)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    const result = await promise

    expect(result.statusCode).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('retries on network error then returns 200', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce(mockResponse(200))

    const promise = fetchPage('https://example.com')
    await vi.advanceTimersByTimeAsync(2_000)
    const result = await promise

    expect(result.statusCode).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws after exhausting retries on network error', async () => {
    mockFetch.mockRejectedValue(new Error('fetch failed'))

    const promise = fetchPage('https://example.com')
    const assertion = expect(promise).rejects.toThrow('fetch failed')

    await vi.advanceTimersByTimeAsync(1_000 + 2_000)
    await assertion

    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('handles mixed retryable statuses (503 → 429 → 200)', async () => {
    mockFetch
      .mockResolvedValueOnce(mockResponse(503))
      .mockResolvedValueOnce(mockResponse(429))
      .mockResolvedValueOnce(mockResponse(200))

    const promise = fetchPage('https://example.com')
    await vi.advanceTimersByTimeAsync(2_000 + 5_000)
    const result = await promise

    expect(result.statusCode).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('does not retry non-retryable statuses (404, 500)', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(404))
    const result404 = await fetchPage('https://example.com')
    expect(result404.statusCode).toBe(404)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    mockFetch.mockClear()
    mockFetch.mockResolvedValueOnce(mockResponse(500))
    const result500 = await fetchPage('https://example.com')
    expect(result500.statusCode).toBe(500)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

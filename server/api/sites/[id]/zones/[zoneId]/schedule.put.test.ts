import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mocks ---

const mockRequireZoneAccess = vi.fn()
const mockZoneFindOne = vi.fn()
const mockScheduleFindOne = vi.fn()
const mockScheduleFindOneAndUpdate = vi.fn()

vi.mock('~~/server/database/models', () => ({
  Zone: {
    findOne: (...args: unknown[]) => ({
      select: () => ({ lean: () => mockZoneFindOne(...args) }),
    }),
  },
  CrawlSchedule: {
    findOne: (...args: unknown[]) => ({ lean: () => mockScheduleFindOne(...args) }),
    findOneAndUpdate: (...args: unknown[]) => ({ lean: () => mockScheduleFindOneAndUpdate(...args) }),
  },
}))

vi.stubGlobal('defineEventHandler', (handler: Function) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('requireValidId', vi.fn(() => 'site123'))
vi.stubGlobal('requireZoneAccess', mockRequireZoneAccess)
vi.stubGlobal('getRouterParam', vi.fn(() => 'zone456'))
const readBodyMock = vi.fn()
vi.stubGlobal('readBody', readBodyMock)

describe('schedule.put', () => {
  let handler: Function
  const fakeEvent = {} as any

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRequireZoneAccess.mockResolvedValue({ site: { _id: 'site123' }, role: 'admin' })
    mockZoneFindOne.mockResolvedValue({ _id: 'zone456' })
    mockScheduleFindOne.mockResolvedValue(null)
    mockScheduleFindOneAndUpdate.mockImplementation((_filter, update) => {
      return Promise.resolve({ _id: 'sched1', ...update.$set })
    })
    const mod = await import('./schedule.put')
    handler = mod.default
  })

  it('rejects when admin access is denied', async () => {
    mockRequireZoneAccess.mockRejectedValue(new Error('forbidden'))
    await expect(handler(fakeEvent)).rejects.toThrow(/forbidden/i)
  })

  it('rejects when frequency is invalid', async () => {
    readBodyMock.mockResolvedValue({ enabled: true, frequency: 'hourly', hour: 3 })
    await expect(handler(fakeEvent)).rejects.toThrow(/fréquence/i)
  })

  it('rejects when hour is out of range', async () => {
    readBodyMock.mockResolvedValue({ enabled: true, frequency: 'daily', hour: 25 })
    await expect(handler(fakeEvent)).rejects.toThrow(/heure/i)
  })

  it('rejects when weekly is missing dayOfWeek', async () => {
    readBodyMock.mockResolvedValue({ enabled: true, frequency: 'weekly', dayOfWeek: null, hour: 3 })
    await expect(handler(fakeEvent)).rejects.toThrow(/jour de la semaine/i)
  })

  it('rejects when zone does not exist', async () => {
    readBodyMock.mockResolvedValue({ enabled: true, frequency: 'daily', hour: 3 })
    mockZoneFindOne.mockResolvedValue(null)
    await expect(handler(fakeEvent)).rejects.toThrow(/zone not found/i)
  })

  it('upserts a new schedule when none exists', async () => {
    readBodyMock.mockResolvedValue({
      enabled: true,
      frequency: 'daily',
      hour: 3,
      dayOfWeek: null,
      dayOfMonth: null,
      lastDayOfMonth: false,
    })

    const result = await handler(fakeEvent)

    expect(mockScheduleFindOneAndUpdate).toHaveBeenCalledOnce()
    const [filter, update, opts] = mockScheduleFindOneAndUpdate.mock.calls[0]
    expect(filter).toEqual({ zoneId: 'zone456', siteId: 'site123' })
    expect(opts).toMatchObject({ upsert: true, returnDocument: 'after' })
    expect(update.$set).toMatchObject({
      enabled: true,
      frequency: 'daily',
      hour: 3,
      dayOfWeek: null,
      dayOfMonth: null,
      lastDayOfMonth: false,
    })
    expect(update.$set.nextCrawlAt).toBeInstanceOf(Date)
    expect(result.schedule).toBeTruthy()
  })

  it('clears nextCrawlAt when the schedule is disabled', async () => {
    readBodyMock.mockResolvedValue({
      enabled: false,
      frequency: 'weekly',
      dayOfWeek: 5,
      hour: 3,
      dayOfMonth: null,
      lastDayOfMonth: false,
    })

    await handler(fakeEvent)

    const update = mockScheduleFindOneAndUpdate.mock.calls[0][1]
    expect(update.$set.enabled).toBe(false)
    expect(update.$set.nextCrawlAt).toBeNull()
  })

  it('preserves lastCrawledAt across updates', async () => {
    const previousRun = new Date('2026-05-10T03:00:00.000Z')
    mockScheduleFindOne.mockResolvedValue({
      _id: 'sched1',
      enabled: true,
      frequency: 'daily',
      hour: 3,
      lastCrawledAt: previousRun,
      nextCrawlAt: new Date('2026-05-24T03:00:00.000Z'),
    })
    readBodyMock.mockResolvedValue({
      enabled: true,
      frequency: 'daily',
      hour: 7,
      dayOfWeek: null,
      dayOfMonth: null,
      lastDayOfMonth: false,
    })

    await handler(fakeEvent)

    const update = mockScheduleFindOneAndUpdate.mock.calls[0][1]
    expect(update.$set.lastCrawledAt).toBe(previousRun)
  })
})

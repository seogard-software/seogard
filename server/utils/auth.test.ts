import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSetCookie = vi.fn()
const mockDeleteCookie = vi.fn()

vi.stubGlobal('setCookie', mockSetCookie)
vi.stubGlobal('deleteCookie', mockDeleteCookie)

vi.mock('./logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
  }),
}))

import {
  setAuthCookies,
  clearAuthCookies,
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from './auth'
import { LOGGED_IN_COOKIE_NAME } from '~~/shared/utils/constants'

const fakeEvent = { context: {} } as any

describe('setAuthCookies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets 3 cookies (auth, refresh, logged_in)', () => {
    setAuthCookies(fakeEvent, 'access_123', 'refresh_456')
    expect(mockSetCookie).toHaveBeenCalledTimes(3)
  })

  it('sets auth-token as httpOnly', () => {
    setAuthCookies(fakeEvent, 'access_123', 'refresh_456')

    expect(mockSetCookie).toHaveBeenCalledWith(
      fakeEvent,
      AUTH_COOKIE_NAME,
      'access_123',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    )
  })

  it('sets refresh-token as httpOnly', () => {
    setAuthCookies(fakeEvent, 'access_123', 'refresh_456')

    expect(mockSetCookie).toHaveBeenCalledWith(
      fakeEvent,
      REFRESH_COOKIE_NAME,
      'refresh_456',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    )
  })

  it('sets seogard_logged_in as NOT httpOnly', () => {
    setAuthCookies(fakeEvent, 'access_123', 'refresh_456')

    expect(mockSetCookie).toHaveBeenCalledWith(
      fakeEvent,
      LOGGED_IN_COOKIE_NAME,
      '1',
      expect.objectContaining({ httpOnly: false, path: '/' }),
    )
  })

  it('gives logged_in cookie same maxAge as refresh token (30 days)', () => {
    setAuthCookies(fakeEvent, 'access_123', 'refresh_456')

    const refreshCall = mockSetCookie.mock.calls.find(
      (c: any[]) => c[1] === REFRESH_COOKIE_NAME,
    )
    const loggedInCall = mockSetCookie.mock.calls.find(
      (c: any[]) => c[1] === LOGGED_IN_COOKIE_NAME,
    )

    expect(refreshCall![3].maxAge).toBe(loggedInCall![3].maxAge)
  })
})

describe('clearAuthCookies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes 3 cookies', () => {
    clearAuthCookies(fakeEvent)
    expect(mockDeleteCookie).toHaveBeenCalledTimes(3)
  })

  it('deletes auth-token', () => {
    clearAuthCookies(fakeEvent)
    expect(mockDeleteCookie).toHaveBeenCalledWith(fakeEvent, AUTH_COOKIE_NAME, { path: '/' })
  })

  it('deletes refresh-token', () => {
    clearAuthCookies(fakeEvent)
    expect(mockDeleteCookie).toHaveBeenCalledWith(fakeEvent, REFRESH_COOKIE_NAME, { path: '/' })
  })

  it('deletes seogard_logged_in', () => {
    clearAuthCookies(fakeEvent)
    expect(mockDeleteCookie).toHaveBeenCalledWith(fakeEvent, LOGGED_IN_COOKIE_NAME, { path: '/' })
  })
})

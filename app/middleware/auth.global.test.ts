import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LOGGED_IN_COOKIE_NAME } from '~~/shared/utils/constants'

const mockFetchMe = vi.fn()
const mockCookieRef = { value: null as string | null }

const mockStore = {
  isAuthenticated: false,
  fetchMe: mockFetchMe,
}

const mockOrgStore = {
  organizations: [{ _id: 'org1', name: 'Test', slug: 'test', role: 'owner' }],
}

vi.stubGlobal('defineNuxtRouteMiddleware', (fn: any) => fn)
vi.stubGlobal('useAuthStore', () => mockStore)
vi.stubGlobal('useOrganizationStore', () => mockOrgStore)
vi.stubGlobal('useCookie', (name: string) => {
  if (name === LOGGED_IN_COOKIE_NAME) return mockCookieRef
  return { value: null }
})
vi.stubGlobal('navigateTo', vi.fn((path: string) => path))
vi.stubGlobal('LOGGED_IN_COOKIE_NAME', LOGGED_IN_COOKIE_NAME)

// Import after stubs
const middleware = (await import('./auth.global')).default

function route(overrides: Record<string, any> = {}) {
  return { meta: {}, ...overrides } as any
}

const fromRoute = route()

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.isAuthenticated = false
    mockCookieRef.value = null
    mockFetchMe.mockResolvedValue(undefined)
  })

  describe('public routes (auth: false)', () => {
    it('does not call fetchMe when no logged_in cookie', async () => {
      await middleware(route({ meta: { auth: false } }), fromRoute)
      expect(mockFetchMe).not.toHaveBeenCalled()
    })

    it('calls fetchMe when logged_in cookie exists', async () => {
      mockCookieRef.value = '1'
      await middleware(route({ meta: { auth: false } }), fromRoute)
      expect(mockFetchMe).toHaveBeenCalledOnce()
    })

    it('clears cookie when fetchMe fails', async () => {
      mockCookieRef.value = '1'
      mockFetchMe.mockRejectedValue(new Error('401'))

      await middleware(route({ meta: { auth: false } }), fromRoute)

      expect(mockCookieRef.value).toBeNull()
    })

    it('does not call fetchMe if already authenticated', async () => {
      mockStore.isAuthenticated = true
      mockCookieRef.value = '1'

      await middleware(route({ meta: { auth: false } }), fromRoute)

      expect(mockFetchMe).not.toHaveBeenCalled()
    })

    it('redirects to /dashboard/sites when redirectIfAuth and authenticated', async () => {
      mockStore.isAuthenticated = true

      const result = await middleware(route({ meta: { auth: false, redirectIfAuth: true } }), fromRoute)

      expect(navigateTo).toHaveBeenCalledWith('/dashboard/sites')
      expect(result).toBe('/dashboard/sites')
    })

    it('does not redirect when redirectIfAuth but not authenticated', async () => {
      mockStore.isAuthenticated = false

      await middleware(route({ meta: { auth: false, redirectIfAuth: true } }), fromRoute)

      expect(navigateTo).not.toHaveBeenCalled()
    })
  })

  describe('protected routes (default)', () => {
    it('calls fetchMe when not authenticated', async () => {
      await middleware(route(), fromRoute)
      expect(mockFetchMe).toHaveBeenCalledOnce()
    })

    it('redirects to /login when fetchMe fails', async () => {
      mockFetchMe.mockRejectedValue(new Error('401'))

      const result = await middleware(route(), fromRoute)

      expect(navigateTo).toHaveBeenCalledWith('/login')
      expect(result).toBe('/login')
    })

    it('does not call fetchMe if already authenticated', async () => {
      mockStore.isAuthenticated = true

      await middleware(route(), fromRoute)

      expect(mockFetchMe).not.toHaveBeenCalled()
    })
  })
})

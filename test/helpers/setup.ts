import { vi } from 'vitest'

// Mock Nuxt auto-imports for unit tests
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('useRoute', vi.fn(() => ({ params: {}, query: {} })))
vi.stubGlobal('useRouter', vi.fn(() => ({ push: vi.fn() })))
vi.stubGlobal('navigateTo', vi.fn())
vi.stubGlobal('useFetch', vi.fn(() => ({ data: ref(null), error: ref(null) })))
vi.stubGlobal('useAsyncData', vi.fn(() => ({ data: ref(null), error: ref(null) })))
vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({ public: { appName: 'Seogard' } })))
vi.stubGlobal('createError', vi.fn((opts) => new Error(opts.message)))
vi.stubGlobal('defineEventHandler', vi.fn((handler) => handler))
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('getHeader', vi.fn())
vi.stubGlobal('getRouterParam', vi.fn())
vi.stubGlobal('getRequestURL', vi.fn(() => new URL('http://localhost')))

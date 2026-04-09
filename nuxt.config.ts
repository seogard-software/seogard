export default defineNuxtConfig({
  compatibilityDate: '2026-02-11',

  future: {
    compatibilityVersion: 4,
  },

  // Avoid node_modules/.cache path — Railway cleans it between build steps
  buildDir: '.nuxt',

  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxt/eslint',
  ],

  components: {
    dirs: [
      { path: '~/components/atoms', prefix: '' },
      { path: '~/components/molecules', prefix: '' },
      { path: '~/components/organisms', prefix: '' },
    ],
  },

  imports: {
    dirs: [
      'composables',
      'stores',
    ],
  },

  css: [
    '~/assets/styles/main.scss',
  ],

  runtimeConfig: {
    databaseUrl: '',
    jwtSecret: '',
    crawlerApiKey: '',
    public: {
      appName: 'Seogard',
      appUrl: 'https://seogard.io',
      selfHosted: process.env.NUXT_PUBLIC_SELF_HOSTED === 'true',
      pricePerPage: 0.007,
      umamiUrl: '',
      umamiId: '',
    },
  },

  routeRules: {
    '/api/**': { cors: true },
    '/blog/**': { swr: 3600 },
  },

  typescript: {
    strict: true,
  },

  eslint: {
    config: {
      standalone: true,
    },
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600&display=swap' },
      ],
    },
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  devtools: { enabled: true },
})

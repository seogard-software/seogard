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
    '@nuxtjs/i18n',
  ],

  // Tout le site public préfixé (/fr, /en). Pas de détection navigateur (Googlebot est US, il
  // se ferait rediriger). Les pages APP restent à la racine via defineI18nRoute(false).
  i18n: {
    locales: [
      {
        code: 'fr',
        language: 'fr-FR',
        files: ['fr/common.json', 'fr/validation.json', 'fr/landing.json', 'fr/docs.json', 'fr/auth.json', 'fr/dashboard.json', 'fr/errors.json', 'fr/seo.json', 'fr/legal.json', 'fr/about.json'],
      },
      {
        code: 'en',
        language: 'en-US',
        files: ['en/common.json', 'en/validation.json', 'en/landing.json', 'en/docs.json', 'en/auth.json', 'en/dashboard.json', 'en/errors.json', 'en/seo.json', 'en/legal.json', 'en/about.json'],
      },
    ],
    defaultLocale: 'fr',
    strategy: 'prefix',
    detectBrowserLanguage: false,
    // Nos messages contiennent du HTML inline (<strong>, <code>) → strict désactivé.
    compilation: { strictMessage: false },
    bundle: { optimizeTranslationDirective: false },
  },

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
      pricePerPage: 0.01,
      demoUrl: 'https://cal.com/seogard-io/demo-seogard-15-min',
      umamiUrl: '',
      umamiId: '',
      posthogKey: '',
      posthogHost: 'https://eu.i.posthog.com',
    },
  },

  routeRules: {
    '/api/**': { cors: true },
    '/fr/formations': { swr: 3600 },
    '/en/formations': { swr: 3600 },
    '/fr/outils/**': { swr: 3600 },
    // 301 des anciennes URLs racine vers leur équivalent /fr.
    '/': { redirect: { to: '/fr', statusCode: 301 } },
    '/formations': { redirect: { to: '/fr/formations', statusCode: 301 } },
    '/outils/**': { redirect: { to: '/fr/outils/**', statusCode: 301 } },
    '/scanner': { redirect: { to: '/fr/scanner', statusCode: 301 } },
    '/tarifs': { redirect: { to: '/fr/tarifs', statusCode: 301 } },
    '/bot': { redirect: { to: '/fr/bot', statusCode: 301 } },
    '/legal/**': { redirect: { to: '/fr/legal/**', statusCode: 301 } },
    '/docs': { redirect: { to: '/fr/docs/rules', statusCode: 301 } },
    '/fr/docs': { redirect: { to: '/fr/docs/rules', statusCode: 301 } },
    '/en/docs': { redirect: { to: '/en/docs/rules', statusCode: 301 } },
    '/docs/rules': { redirect: { to: '/fr/docs/rules', statusCode: 301 } },
    '/docs/self-hosted': { redirect: { to: '/fr/docs/self-hosted', statusCode: 301 } },
  },

  nitro: {
    experimental: { tasks: true },
    scheduledTasks: {
      '* * * * *': ['crawl:scheduler'],
    },
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

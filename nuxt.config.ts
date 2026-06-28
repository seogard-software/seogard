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
      pricePerPage: 0.01,
      demoUrl: 'https://cal.com/seogard-io/demo-seogard-15-min',
      umamiUrl: '',
      umamiId: '',
    },
  },

  routeRules: {
    '/api/**': { cors: true },
    '/formations': { swr: 3600 },
    '/outils/**': { swr: 3600 },
    // Blog auto-généré supprimé (2026-06-25) → pivot Formations. Tout /blog redirige en 301 vers
    // /formations. NB : le passage des articles /blog/<slug> en 410 Gone (reco SEO) est PRÊT mais
    // VOLONTAIREMENT REPORTÉ — on valide d'abord en prod la détection du 301 (page_redirected) et
    // l'auto-résolution sur ces redirections. Cf. plans/feat-detection-redirections.md (partie 3).
    '/blog': { redirect: { to: '/formations', statusCode: 301 } },
    '/blog/**': { redirect: { to: '/formations', statusCode: 301 } },
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

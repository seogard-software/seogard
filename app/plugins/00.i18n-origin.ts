// useSetI18nParams generates SEO links as well as translated route parameters.
// Set its origin before i18n initializes: functions in runtimeConfig are not serialized
// by Nitro. Reuse appUrl at runtime so self-hosted installations keep their own origin.
export default defineNuxtPlugin({
  name: 'i18n-origin',
  enforce: 'pre',
  setup(nuxtApp) {
    nuxtApp.$config.public.i18n.baseUrl = nuxtApp.$config.public.appUrl || 'https://seogard.io'
  },
})

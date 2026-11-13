// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true },

  // @cairn/core ships TypeScript source; let Nuxt and Nitro compile it.
  build: { transpile: ['@cairn/core'] },
  nitro: { externals: { inline: ['@cairn/core'] } },

  // The editor depends on the visitor's clock and time zone, so it renders on the client.
  routeRules: { '/': { ssr: false } },

  colorMode: { preference: 'dark', fallback: 'dark' },

  app: {
    head: {
      title: 'Cairn',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Free iPhone lock screen wallpapers that show your time as a grid of dots.' },
        { name: 'theme-color', content: '#0C0A09' },
      ],
    },
  },
})

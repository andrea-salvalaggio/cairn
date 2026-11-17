export default defineNuxtConfig({
    compatibilityDate: '2026-11-01',
    modules: ['@nuxt/ui'],
    css: ['~/assets/css/tailwind.css', '~/assets/scss/main.scss'],

    // Design tokens are available in every SCSS file and <style lang="scss"> block.
    vite: {
        css: {
            preprocessorOptions: {
                scss: { additionalData: '@use "@/assets/scss/variables" as *;' },
            },
        },
    },
    devtools: { enabled: true },

    // @cairn/core ships TypeScript source; let Nuxt and Nitro compile it.
    build: { transpile: ['@cairn/core'] },
    nitro: { externals: { inline: ['@cairn/core'] } },

    // The editor depends on the visitor's clock and time zone, so it renders on the client.
    routeRules: { '/': { ssr: false } },

    colorMode: { preference: 'dark', fallback: 'dark' },

    app: {
        head: {
            title: 'Cairn | Your Time In Stones',
            htmlAttrs: { lang: 'en' },
            link: [
                { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
                { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
            ],
            meta: [
                { name: 'description', content: 'Free iPhone lock screen wallpapers that show your time as a pile of stones.' },
                { name: 'theme-color', content: '#000000' },
            ],
        },
    },
})

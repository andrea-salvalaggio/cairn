import { TITLE_FONTS } from '@cairn/core'

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

    // The preview draws the wallpaper SVG in the browser: load the fonts the server renders with, so the two match.
    // Global, so the style picker can show each name in its own font before the style is chosen.
    fonts: {
        families: [
            { name: 'Geist', provider: 'google', weights: [400, 700], global: true },
            ...TITLE_FONTS.filter(f => f.family !== 'Geist').map(f => ({ name: f.family, provider: 'google' as const, weights: [f.weight], styles: ['italic' in f ? 'italic' as const : 'normal' as const], global: true })),
        ],
    },
    // The font list above is read from core once, at startup: restart the dev server when it changes.
    watch: ['../../packages/core/src/fonts.ts'],

    colorMode: { preference: 'dark', fallback: 'dark' },

    app: {
        head: {
            title: 'Cairn | A Wallpaper That Grows',
            htmlAttrs: { lang: 'en' },
            // cover: env(safe-area-inset-*) is only non-zero with it, the installed app's tab bar needs the bottom inset.
            viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
            link: [
                { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
                { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
                { rel: 'manifest', href: '/manifest.webmanifest' },
            ],
            meta: [
                { name: 'description', content: 'A free iPhone Lock Screen wallpaper that grows one stone at a time: for your life, your anniversary or your goal.' },
                { name: 'theme-color', content: '#000000' },
            ],
        },
    },
})

// Nuxt removes the skeleton the instant the editor mounts: from cache that is a flash and a hard cut.
// Take it over instead: keep it until MIN_VISIBLE ms after the page started loading, then fade it out over the editor.
const MIN_VISIBLE = 300
const FADE = 250 // matches the transition on #cairn-loader in spa-loading-template.html

export default defineNuxtPlugin((nuxtApp) => {
    const loader = document.getElementById('__nuxt-loader')
    if (!loader) return
    loader.id = 'cairn-loader' // Nuxt finds the skeleton by this id to remove it
    nuxtApp.hooks.hookOnce('app:suspense:resolve', () => {
        setTimeout(() => {
            loader.classList.add('is-leaving')
            setTimeout(() => loader.remove(), FADE)
        }, Math.max(0, MIN_VISIBLE - performance.now()))
    })
})

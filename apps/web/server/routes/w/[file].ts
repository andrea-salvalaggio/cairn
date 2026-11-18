import { writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ConfigError, decodeConfig, FONT_FAMILY, render, todayInTimeZone } from '@cairn/core'
import { Resvg } from '@resvg/resvg-js'

/**
 * GET /w/<config>.png
 * The wallpaper image the iOS Shortcut fetches every day. Stateless: everything comes from the URL.
 */

// resvg only loads fonts from file paths, so the bundled fonts are written to the temp dir once per instance.
// Regular for the counter, Bold for the title, Noto Emoji for emoji in the title.
const FONT_FILES = ['Geist-Regular.ttf', 'Geist-Bold.ttf', 'NotoEmoji-Medium.ttf']
let fontPaths: Promise<string[]> | undefined
function ensureFonts(): Promise<string[]> {
    fontPaths ??= Promise.all(FONT_FILES.map(async (name) => {
        const font = await useStorage('assets:server').getItemRaw<Uint8Array>(`fonts/${name}`)
        if (!font) throw new Error(`Bundled font not found: ${name}`)
        const path = join(tmpdir(), `cairn-${name}`)
        await writeFile(path, font)
        return path
    }))
    return fontPaths
}

export default defineEventHandler(async (event) => {
    const file = getRouterParam(event, 'file') ?? ''
    if (!file.endsWith('.png')) throw createError({ statusCode: 404, statusMessage: 'Not found' })

    let svg: string
    try {
        const config = decodeConfig(file.slice(0, -'.png'.length))
        svg = render(config, todayInTimeZone(config.timeZone))
    }
    catch (error) {
        if (error instanceof ConfigError) throw createError({ statusCode: 400, statusMessage: error.field ? `${error.field}: ${error.message}` : error.message })
        throw error
    }

    const png = new Resvg(svg, {
        font: { loadSystemFonts: false, fontFiles: await ensureFonts(), defaultFontFamily: FONT_FAMILY },
    }).render().asPng()

    setHeader(event, 'Content-Type', 'image/png')
    // The image changes once a day at the user's midnight; an hour of CDN cache keeps the 6:00 refresh correct.
    setHeader(event, 'Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=600')
    return png
})

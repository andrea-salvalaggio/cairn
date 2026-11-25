import { type Colors, type Config, resolveColors } from './config'
import { getTitleFont } from './fonts'
import { getDevice } from './devices'
import { buildModel, type Cell } from './model'

/** Layout constants in points. Dot size is fixed by design (docs/adr/0002-fixed-dot-size.md). */
export const LAYOUT = {
    pitch: 20,
    dot: 14,
    /** Centre of the whole block (title, counter, dots) as a fraction of the screen height:
     *  the middle of the free area between the clock and the Lock Screen buttons. Provisional. */
    blockCenter: 0.57,
    titleSize: 20,
    /** From the title baseline to the counter baseline. */
    counterGap: 22,
    counterSize: 13,
    /** From the counter baseline to the centre of the top row of dots. */
    dotsGap: 28,
} as const

export const FONT_FAMILY = 'Geist'

const n = (value: number) => Number(value.toFixed(2)).toString()

function escapeXml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Monochrome: the accent color belongs to the current stone alone. */
function fill(cell: Cell, colors: Colors): string {
    return cell.state === 'current' ? colors.accent : cell.state === 'future' ? colors.future : colors.past
}

/**
 * A hand-printed peak: each cell gets its own width, height and lean plus a few small notches along the edges,
 * like a block print. The values come from the cell index alone, so the same day always draws the same wallpaper.
 * The peak sits on the row line and is drawn around 0,0, then moved into place with translate().
 */
function peak(i: number, cx: number, cy: number, d: number, color: string): string {
    let seed = (i * 2654435761 + 12345) % 4294967296
    const rnd = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296
        return seed / 4294967296
    }
    const w = d * (1.0 + 0.15 * rnd())
    const h = d * (0.9 + 0.15 * rnd())
    const lean = d * (rnd() - 0.5) * 0.2
    const base = d * 0.5
    const left: [number, number] = [-w / 2, base]
    const right: [number, number] = [w / 2, base]
    const apex: [number, number] = [lean, base - h]
    const notch = d * 0.07
    const edge = (a: [number, number], b: [number, number], parts: number) =>
        Array.from({ length: parts - 1 }, (_, t): [number, number] => {
            const u = (t + 1) / parts
            const x = a[0] + (b[0] - a[0]) * u + (rnd() - 0.5) * notch
            const y = a[1] + (b[1] - a[1]) * u + (rnd() - 0.5) * notch
            return [x, y]
        })
    const points = [left, ...edge(left, apex, 3), apex, ...edge(apex, right, 3), right, ...edge(right, left, 2)]
    const path = `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}Z`
    return `<path d="${path}" transform="translate(${n(cx)} ${n(cy)})" fill="${color}" stroke="${color}" stroke-width="${n(d * 0.05)}" stroke-linejoin="round"/>`
}

/**
 * Pure renderer: same config and same day always give the same SVG.
 * `today` is the user's calendar date (YYYY-MM-DD), resolved in their time zone by the caller.
 */
export function render(config: Config, today: string): string {
    const device = getDevice(config.device)
    const colors = resolveColors(config)
    const model = buildModel(config, today)
    const { width: W, height: H, scale } = device

    const pitch = Math.round(LAYOUT.pitch * scale)
    const dot = Math.round(LAYOUT.dot * scale)
    // A square grid laid from the bottom up, left to right: the pile grows upwards like a cairn.
    const gridWidth = (model.columns - 1) * pitch + dot
    const x0 = Math.round((W - gridWidth) / 2) // left edge of the grid; the text aligns to it
    const rows = Math.ceil(model.cells.length / model.columns)
    // The base row is placed so the whole block, from the title's cap height to the bottom of the base row, is centred.
    const above = (LAYOUT.titleSize * 0.75 + LAYOUT.counterGap + LAYOUT.dotsGap) * scale
    const base = Math.round(H * LAYOUT.blockCenter + (above + (rows - 1) * pitch - dot / 2) / 2)
    const top = base - (rows - 1) * pitch

    const cells = model.cells
        .map((cell, i) => {
            const cx = x0 + dot / 2 + (i % model.columns) * pitch
            const cy = base - Math.floor(i / model.columns) * pitch
            return peak(i, cx, cy, dot, fill(cell, colors))
        })
        .join('')

    // Long titles shrink to fit the grid width instead of running past it.
    const font = getTitleFont(config.font)
    const titleSize = Math.min(LAYOUT.titleSize * scale * font.scale, gridWidth / (Math.max(1, model.title.length) * font.charEm))
    const counterSize = LAYOUT.counterSize * scale
    const text = (x: number, y: number, size: number, color: string, value: string, weight = 400, family = FONT_FAMILY, italic = false) =>
        `<text x="${n(x)}" y="${n(y)}" font-family="${family}, sans-serif" font-size="${n(size)}" font-weight="${weight}"${italic ? ' font-style="italic"' : ''} fill="${color}">${escapeXml(value)}</text>`

    const [lead, rest] = model.counter
    const counterY = top - LAYOUT.dotsGap * scale
    const titleY = counterY - LAYOUT.counterGap * scale

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
        `<rect id="background" width="${W}" height="${H}" fill="${colors.bg}"/>`,
        `<g id="title">${text(x0, titleY, titleSize, colors.past, model.title, font.weight, font.family, font.italic)}</g>`,
        `<g id="counter">`,
        // The key number in the dots' color, its context in the label color: "64d left · 27%".
        `<text x="${n(x0)}" y="${n(counterY)}" font-family="${FONT_FAMILY}, sans-serif" font-size="${n(counterSize)}" font-weight="400" fill="${colors.past}">${escapeXml(lead)}`,
        rest === undefined ? '' : `<tspan fill="${colors.label}">\u00A0· ${escapeXml(rest)}</tspan>`, // no-break space: resvg drops a leading plain one,
        `</text>`,
        `</g>`,
        `<g id="dots">${cells}</g>`,
        `</svg>`,
    ].join('')
}

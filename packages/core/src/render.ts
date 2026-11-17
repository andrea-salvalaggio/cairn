import { type Colors, type Config, resolveColors } from './config'
import { getDevice } from './devices'
import { buildModel, type Cell } from './model'

/** Layout constants in points. Dot size is fixed by design (docs/adr/0002-fixed-dot-size.md). */
export const LAYOUT = {
  pitch: 20,
  dot: 12,
  /** Centre of the base row of stones as a fraction of the screen height: the pile grows up from here. Provisional. */
  blockBottom: 0.8,
  titleGap: 32,
  titleSize: 15,
  counterGap: 33,
  counterSize: 11.5,
} as const

export const FONT_FAMILY = 'Geist'

// Font Awesome Free 6 solid icons (CC BY 4.0, https://fontawesome.com/license/free): [viewBox width, viewBox height, path].
const ICONS = {
  heart: [512, 512, 'm47.6 300.4l180.7 168.7c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9l180.7-168.7c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141c-45.6-7.6-92 7.3-124.6 39.9l-12 12l-12-12c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5'],
  gift: [512, 512, 'm190.5 68.8l34.8 59.2H152c-22.1 0-40-17.9-40-40s17.9-40 40-40h2.2c14.9 0 28.8 7.9 36.3 20.8M64 88c0 14.4 3.5 28 9.6 40H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h448c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32h-41.6c6.1-12 9.6-25.6 9.6-40c0-48.6-39.4-88-88-88h-2.2c-31.9 0-61.5 16.9-77.7 44.4L256 85.5l-24.1-41C215.7 16.9 186.1 0 154.2 0H152c-48.6 0-88 39.4-88 88m336 0c0 22.1-17.9 40-40 40h-73.3l34.8-59.2c7.6-12.9 21.4-20.8 36.3-20.8h2.2c22.1 0 40 17.9 40 40M32 288v176c0 26.5 21.5 48 48 48h144V288zm256 224h144c26.5 0 48-21.5 48-48V288H288z'],
  star: [576, 512, 'M316.9 18c-5.3-11-16.5-18-28.8-18s-23.4 7-28.8 18L195 150.3L51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329l-24.6 145.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5l128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329l104.2-103.1c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7l-143.7-21.2z'],
} as const


/** Width of each symbol relative to the dot diameter, tuned so they read as the same optical size. */
const ICON_WIDTH = { heart: 1.2, gift: 1.15, star: 1.3 } as const

const n = (value: number) => Number(value.toFixed(2)).toString()

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Stones are only past or future: the accent color belongs to the marker symbol alone. */
function fill(cell: Cell, colors: Colors): string {
  return cell.state === 'future' ? colors.future : colors.past
}

function icon(name: keyof typeof ICONS, cx: number, cy: number, d: number, color: string): string {
  const [w, h, path] = ICONS[name]
  const k = (d * ICON_WIDTH[name]) / w
  return `<path d="${path}" transform="translate(${n(cx - (w * k) / 2)} ${n(cy - (h * k) / 2)}) scale(${Number(k.toFixed(5))})" fill="${color}"/>`
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
  const w = d * (0.95 + 0.35 * rnd())
  const h = d * (0.8 + 0.35 * rnd())
  const lean = d * (rnd() - 0.5) * 0.45
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

/** Rough Geist advance width per character, in ems (bold): the renderer has no font metrics. */
const CHAR_EM = 0.62

function glyph(cell: Cell, i: number, cx: number, cy: number, d: number, colors: Colors): string {
  if (cell.glyph === 'stone') return peak(i, cx, cy, d, fill(cell, colors))
  return icon(cell.glyph, cx, cy, d, colors.accent)
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
  // Dry-stone wall: rows are laid from the bottom up, left to right, every other row shifted by half a stone.
  const half = pitch / 2
  const gridWidth = (model.columns - 1) * pitch + half
  const x0 = Math.round((W - gridWidth) / 2)
  const base = Math.round(H * LAYOUT.blockBottom)
  const rows = Math.ceil(model.cells.length / model.columns)
  const top = base - (rows - 1) * pitch

  // An incomplete top row is centred on the row below, like the peak of a cairn.
  const topCount = model.cells.length - (rows - 1) * model.columns
  const topShift = ((model.columns - topCount) * pitch) / 2

  const cells = model.cells
    .map((cell, i) => {
      const row = Math.floor(i / model.columns)
      const x = x0 + (i % model.columns) * pitch + (row % 2) * half + (row === rows - 1 ? topShift : 0)
      return glyph(cell, i, x, base - row * pitch, dot, colors)
    })
    .join('')

  const maxWidth = W * 0.86
  const estimate = (chars: number, size: number) => chars * CHAR_EM * size
  // Long titles shrink to fit the screen instead of running off it.
  const titleSize = Math.min(LAYOUT.titleSize * scale, maxWidth / (Math.max(1, model.title.length) * CHAR_EM))
  const counterSize = LAYOUT.counterSize * scale
  const gap = counterSize * 0.4
  const cx = W / 2
  const text = (x: number, y: number, size: number, color: string, anchor: string, value: string, weight = 400) =>
    `<text x="${n(x)}" y="${n(y)}" font-family="${FONT_FAMILY}, sans-serif" font-size="${n(size)}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escapeXml(value)}</text>`

  const [lead, rest] = model.counter
  // The phrase "lead · rest" is centred as a whole, so the dot shifts towards the shorter side.
  const dotX = cx + (estimate(lead.length, counterSize) - estimate(rest?.length ?? 0, counterSize)) / 2
  const counterY = base + LAYOUT.counterGap * scale

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<rect id="background" width="${W}" height="${H}" fill="${colors.bg}"/>`,
    `<g id="title">${text(cx, top - LAYOUT.titleGap * scale, titleSize, colors.label, 'middle', model.title, 700)}</g>`,
    `<g id="dots">${cells}</g>`,
    `<g id="counter">`,
    rest === undefined
      ? text(cx, counterY, counterSize, colors.accent, 'middle', lead)
      : text(dotX - gap, counterY, counterSize, colors.accent, 'end', lead)
        + text(dotX, counterY, counterSize, colors.label, 'middle', '·')
        + text(dotX + gap, counterY, counterSize, colors.label, 'start', rest),
    `</g>`,
    `</svg>`,
  ].join('')
}

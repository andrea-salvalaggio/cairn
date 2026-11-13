import { type Colors, type Config, resolveColors } from './config'
import { getDevice } from './devices'
import { buildModel, type Cell } from './model'

/** Layout constants in points. Dot size is fixed by design (PLAN.md, section 8.3). */
export const LAYOUT = {
  pitch: 20,
  dot: 12,
  /** Top of the dot block as a fraction of the screen height. Provisional. */
  blockTop: 0.47,
  titleGap: 32,
  titleSize: 15,
  counterGap: 33,
  counterSize: 11.5,
} as const

export const FONT_FAMILY = 'Geist'

// Font Awesome Free 6 solid icons (CC BY 4.0, https://fontawesome.com/license/free): [viewBox width, viewBox height, path].
const ICONS = {
  heart: [512, 512, 'm47.6 300.4l180.7 168.7c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9l180.7-168.7c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141c-45.6-7.6-92 7.3-124.6 39.9l-12 12l-12-12c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5'],
  flame: [448, 512, 'M159.3 5.4c7.8-7.3 19.9-7.2 27.7.1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 97.7 112.7 48.6 159.3 5.4M225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4c.1 68.5 50.7 109.1 113.8 109.1'],
  star: [576, 512, 'M316.9 18c-5.3-11-16.5-18-28.8-18s-23.4 7-28.8 18L195 150.3L51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329l-24.6 145.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5l128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329l104.2-103.1c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7l-143.7-21.2z'],
} as const

/** Width of each symbol relative to the dot diameter, tuned so they read as the same optical size. */
const ICON_WIDTH = { heart: 1.2, flame: 1.2, star: 1.3 } as const

const n = (value: number) => Number(value.toFixed(2)).toString()

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fill(cell: Cell, colors: Colors): string {
  return cell.state === 'past' ? colors.past : cell.state === 'current' ? colors.accent : colors.future
}

function icon(name: keyof typeof ICONS, cx: number, cy: number, d: number, color: string): string {
  const [w, h, path] = ICONS[name]
  const k = (d * ICON_WIDTH[name]) / w
  return `<path d="${path}" transform="translate(${n(cx - (w * k) / 2)} ${n(cy - (h * k) / 2)}) scale(${Number(k.toFixed(5))})" fill="${color}"/>`
}

function glyph(cell: Cell, cx: number, cy: number, d: number, colors: Colors): string {
  switch (cell.glyph) {
    case 'heart': return icon('heart', cx, cy, d, fill(cell, colors))
    case 'flame': return icon('flame', cx, cy, d, colors.accent)
    case 'star': return icon('star', cx, cy, d, colors.accent)
    default: return `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(d / 2)}" fill="${fill(cell, colors)}"/>`
  }
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
  const gridWidth = (model.columns - 1) * pitch
  const x0 = Math.round((W - gridWidth) / 2)
  const y0 = Math.round(H * LAYOUT.blockTop)
  const rows = Math.ceil(model.cells.length / model.columns)
  const gridBottom = y0 + (rows - 1) * pitch

  const cells = model.cells
    .map((cell, i) => glyph(cell, x0 + (i % model.columns) * pitch, y0 + Math.floor(i / model.columns) * pitch, dot, colors))
    .join('')

  const titleSize = n(LAYOUT.titleSize * scale)
  const counterSize = LAYOUT.counterSize * scale
  const titleY = n(y0 - LAYOUT.titleGap * scale)
  const counterY = n(gridBottom + LAYOUT.counterGap * scale)
  const gap = n(counterSize * 0.4)
  const cx = W / 2
  const text = (x: number | string, y: string, size: string, color: string, anchor: string, value: string) =>
    `<text x="${x}" y="${y}" font-family="${FONT_FAMILY}, sans-serif" font-size="${size}" fill="${color}" text-anchor="${anchor}">${escapeXml(value)}</text>`

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<rect id="background" width="${W}" height="${H}" fill="${colors.bg}"/>`,
    `<g id="title">${text(cx, titleY, titleSize, colors.label, 'middle', model.title)}</g>`,
    `<g id="dots">${cells}</g>`,
    `<g id="counter">`,
    text(n(cx - Number(gap)), counterY, n(counterSize), colors.accent, 'end', model.counter[0]),
    text(cx, counterY, n(counterSize), colors.label, 'middle', '·'),
    text(n(cx + Number(gap)), counterY, n(counterSize), colors.label, 'start', model.counter[1]),
    `</g>`,
    `</svg>`,
  ].join('')
}

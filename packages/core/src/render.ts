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
  gift: [512, 512, 'm190.5 68.8l34.8 59.2H152c-22.1 0-40-17.9-40-40s17.9-40 40-40h2.2c14.9 0 28.8 7.9 36.3 20.8M64 88c0 14.4 3.5 28 9.6 40H32c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32h448c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32h-41.6c6.1-12 9.6-25.6 9.6-40c0-48.6-39.4-88-88-88h-2.2c-31.9 0-61.5 16.9-77.7 44.4L256 85.5l-24.1-41C215.7 16.9 186.1 0 154.2 0H152c-48.6 0-88 39.4-88 88m336 0c0 22.1-17.9 40-40 40h-73.3l34.8-59.2c7.6-12.9 21.4-20.8 36.3-20.8h2.2c22.1 0 40 17.9 40 40M32 288v176c0 26.5 21.5 48 48 48h144V288zm256 224h144c26.5 0 48-21.5 48-48V288H288z'],
  star: [576, 512, 'M316.9 18c-5.3-11-16.5-18-28.8-18s-23.4 7-28.8 18L195 150.3L51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329l-24.6 145.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5l128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329l104.2-103.1c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7l-143.7-21.2z'],
} as const

// Hand-drawn stones, 100 wide and centered on 0,0, flatter at the base like the stones of a cairn.
const STONES = [
  'M-50 8C-51-10-30-27 0-28S50-14 50 6 28 27 0 27-49 24-50 8Z',
  'M-48 12C-50-6-34-30-6-31S47-24 49-6 36 26 8 27-46 28-48 12Z',
  'M-50 4C-47-13-22-23 6-23S50-12 50 6 34 24 0 24-52 18-50 4Z',
  'M-44 10C-48-12-26-32 2-31S45-14 46 4 30 30 0 29-42 28-44 10Z',
  'M-50 10C-50-4-38-22-12-26S42-22 49-2 40 25 6 27-50 24-50 10Z',
] as const

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

/** Stone 1.2 × the dot size wide, to keep the weight of the old 12 pt dot. Shape picked by index: varied but deterministic. */
function stone(i: number, cx: number, cy: number, d: number, color: string): string {
  const k = (d * 1.2) / 100
  return `<path d="${STONES[(i * 3 + (i >> 2)) % STONES.length]}" transform="translate(${n(cx)} ${n(cy)}) scale(${Number(k.toFixed(5))})" fill="${color}"/>`
}

function glyph(cell: Cell, i: number, cx: number, cy: number, d: number, colors: Colors): string {
  if (cell.glyph === 'stone') return stone(i, cx, cy, d, fill(cell, colors))
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
  const gridWidth = (model.columns - 1) * pitch
  const x0 = Math.round((W - gridWidth) / 2)
  const y0 = Math.round(H * LAYOUT.blockTop)
  const rows = Math.ceil(model.cells.length / model.columns)
  const gridBottom = y0 + (rows - 1) * pitch

  const cells = model.cells
    .map((cell, i) => glyph(cell, i, x0 + (i % model.columns) * pitch, y0 + Math.floor(i / model.columns) * pitch, dot, colors))
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

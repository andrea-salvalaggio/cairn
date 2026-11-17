import { type Colors, type Config, resolveColors } from './config'
import { getDevice } from './devices'
import { buildModel, type Cell } from './model'

/** Layout constants in points. Dot size is fixed by design (docs/adr/0002-fixed-dot-size.md). */
export const LAYOUT = {
  pitch: 20,
  dot: 12,
  /** Centre of the whole block (title, pile, counter) as a fraction of the screen height:
   *  the middle of the free area between the clock and the Lock Screen buttons. Provisional. */
  blockCenter: 0.57,
  titleGap: 32,
  titleSize: 15,
  counterGap: 33,
  counterSize: 11.5,
} as const

export const FONT_FAMILY = 'Geist'

const n = (value: number) => Number(value.toFixed(2)).toString()

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Stones are only past or future: the accent color belongs to the marker stone alone. */
function fill(cell: Cell, colors: Colors): string {
  return cell.state === 'future' ? colors.future : colors.past
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
  // The marker (birthday, this week, the target) is a stone too, in the accent color, like the logo's top stone.
  return peak(i, cx, cy, d, cell.glyph === 'stone' ? fill(cell, colors) : colors.accent)
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
  const rows = Math.ceil(model.cells.length / model.columns)
  // The pile still grows up from its base row; the base is placed so the whole block is centred.
  const titleTop = (LAYOUT.titleGap + LAYOUT.titleSize * 0.75) * scale // from the top row to the title's cap height
  const counterBottom = LAYOUT.counterGap * scale // from the base row to the counter's baseline
  const base = Math.round(H * LAYOUT.blockCenter + ((rows - 1) * pitch + titleTop - counterBottom) / 2)
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

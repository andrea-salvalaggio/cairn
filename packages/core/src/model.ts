import { type Config, DEFAULT_LIFESPAN } from './config'
import { diffDays, fullYears } from './dates'

/** Every cell is a stone (drawn as a printed peak); one marker cell per theme is drawn in the accent color. */
export type Glyph = 'stone' | 'heart' | 'gift' | 'star'
export type CellState = 'past' | 'current' | 'future'
export interface Cell { glyph: Glyph, state: CellState }

/** What the wallpaper shows, independent of pixels. */
export interface Model {
    title: string
    columns: number
    cells: Cell[]
    /** [key number, context?]. The first part takes the accent color; without context it stands alone, centred. */
    counter: [string, string?]
}

/** Dots never shrink: when a count exceeds the budget, the unit grows instead. */
export const DOT_BUDGET = 120
/** Stones per row, the same for every theme: the pile only grows in height. */
export const COLUMNS = 13

function plural(n: number, word: string): string {
    return `${n} ${word}${n === 1 ? '' : 's'}`
}

function birthday(config: Config, today: string): Model {
    const lifespan = config.lifespanYears ?? DEFAULT_LIFESPAN
    const age = Math.min(fullYears(config.birthDate!, today), lifespan)
    const cells: Cell[] = Array.from({ length: lifespan }, (_, i) =>
        i < age ? { glyph: 'stone', state: 'past' } : i === age ? { glyph: 'gift', state: 'current' } : { glyph: 'stone', state: 'future' })
    return {
        title: config.title ?? 'My life in years',
        columns: COLUMNS,
        cells,
        // Only the years lived: the lifespan is an assumption, so the wallpaper never shows years 'left'.
        counter: [plural(age, 'year')],
    }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "April 22, 2018". Spelled out here, not with Intl, so the server and every browser print the same text. */
function longDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
    return `${MONTHS[m - 1]} ${d}, ${y}`
}

function anniversary(config: Config, today: string): Model {
    const start = config.startDate!
    const started = diffDays(start, today) >= 0
    const years = started ? fullYears(start, today) : 0
    // One stone per anniversary reached, the latest in the accent color; before the first, the row is empty.
    const current = years - 1
    // Future stones only complete the current row: a relationship has no forecast.
    const length = Math.max(1, Math.ceil(years / COLUMNS)) * COLUMNS
    const cells: Cell[] = Array.from({ length }, (_, i) =>
        ({ glyph: i === current ? 'heart' : 'stone', state: i < current ? 'past' : i === current ? 'current' : 'future' }))
    return {
        title: config.title ?? 'Together',
        columns: COLUMNS,
        cells,
        // The day it all started, as the context for the years.
        counter: [plural(years, 'year'), longDate(start)],
    }
}

const UNITS = [
    { days: 1, short: 'd' },
    { days: 7, short: 'w' },
    { days: 30.4375, short: 'mo' },
    { days: 365.25, short: 'y' },
] as const

function goal(config: Config, today: string): Model {
    const target = config.targetDate!
    const start = config.startDate && diffDays(config.startDate, target) > 0 ? config.startDate : today
    const totalDays = Math.max(1, diffDays(start, target))
    const unit = UNITS.find(u => Math.ceil(totalDays / u.days) + 1 <= DOT_BUDGET) ?? UNITS[UNITS.length - 1]!
    const total = Math.ceil(totalDays / unit.days) + 1
    const elapsedDays = Math.min(Math.max(0, diffDays(start, today)), totalDays)
    const current = Math.min(total - 1, Math.floor(elapsedDays / unit.days))
    const cells: Cell[] = Array.from({ length: total }, (_, i) => {
        const state: CellState = i < current ? 'past' : i === current ? 'current' : 'future'
        return { glyph: i === total - 1 ? 'star' : 'stone', state }
    })
    const leftDays = Math.max(0, diffDays(today, target))
    const left = Math.ceil(leftDays / unit.days)
    const percent = Math.round((elapsedDays / totalDays) * 100)
    return {
        title: config.title ?? 'My goal',
        columns: COLUMNS,
        cells,
        counter: [leftDays === 0 ? 'Today' : `${left}${unit.short} left`, `${percent}%`],
    }
}

/** `today` is the user's calendar date (YYYY-MM-DD), already resolved in their time zone. */
export function buildModel(config: Config, today: string): Model {
    switch (config.theme) {
        case 'birthday': return birthday(config, today)
        case 'anniversary': return anniversary(config, today)
        case 'goal': return goal(config, today)
    }
}

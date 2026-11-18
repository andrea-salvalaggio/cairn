import { isIsoDate, isTimeZone } from './dates'
import { DEFAULT_DEVICE, DEVICES, type DeviceId } from './devices'

export type ThemeId = 'birthday' | 'anniversary' | 'goal'
export const THEMES: readonly ThemeId[] = ['birthday', 'anniversary', 'goal']

export interface Colors {
    bg: string
    past: string
    future: string
    /** Accent for "now", the symbol and the key number in the counter. */
    accent: string
    label: string
}

/** The brand ochre (the logo's top stone and the site's tint): every theme's default accent. */
export const DEFAULT_ACCENT = '#FF9F0A'

export const DEFAULT_COLORS: Record<ThemeId, Colors> = {
    birthday: { bg: '#0C0A09', past: '#E7E5E4', future: '#292524', accent: DEFAULT_ACCENT, label: '#78716C' },
    anniversary: { bg: '#0C0A09', past: '#E7E5E4', future: '#292524', accent: DEFAULT_ACCENT, label: '#78716C' },
    goal: { bg: '#0C0A09', past: '#E7E5E4', future: '#292524', accent: DEFAULT_ACCENT, label: '#78716C' },
}

export const DEFAULT_LIFESPAN = 90
export const MAX_TITLE_LENGTH = 48

/** Schema version 1. Stored in the wallpaper URL, so changes must stay backward compatible. */
export interface Config {
    v: 1
    theme: ThemeId
    device: DeviceId
    timeZone: string
    title?: string
    birthDate?: string
    lifespanYears?: number
    /** Anniversary theme; optional start of the countdown for the goal theme. */
    startDate?: string
    targetDate?: string
    colors?: Partial<Colors>
}

export class ConfigError extends Error {
    /** The config key at fault, so the editor can show the message under that field. */
    constructor(message: string, readonly field?: keyof Config) {
        super(message)
        this.name = 'ConfigError'
    }
}

const HEX = /^#[0-9a-fA-F]{6}$/

function fail(message: string, field?: keyof Config): never {
    throw new ConfigError(message, field)
}

// Bounds the goal grid: a span of centuries would render thousands of stones per request.
const MIN_YEAR = 1900
const MAX_YEAR = 2200

function optionalDate(value: unknown, field: keyof Config): string | undefined {
    if (value === undefined || value === null || value === '') return undefined
    if (!isIsoDate(value)) fail('Enter a complete date: day, month and year.', field)
    const year = Number(value.slice(0, 4))
    return year >= MIN_YEAR && year <= MAX_YEAR ? value : fail(`Choose a year between ${MIN_YEAR} and ${MAX_YEAR}.`, field)
}

/**
 * Validates untrusted input (URL payload or form state) and returns a clean Config.
 * Unknown keys are dropped. Throws ConfigError with a readable message.
 */
export function parseConfig(input: unknown): Config {
    if (typeof input !== 'object' || input === null) fail('Config must be an object')
    const raw = input as Record<string, unknown>

    if (raw.v !== 1) fail('Unsupported config version')
    const theme = THEMES.includes(raw.theme as ThemeId) ? (raw.theme as ThemeId) : fail('Unknown theme')
    const device = raw.device === undefined
        ? DEFAULT_DEVICE
        : DEVICES.some(d => d.id === raw.device) ? (raw.device as DeviceId) : fail('Unknown device')
    const timeZone = raw.timeZone === undefined ? 'UTC' : isTimeZone(raw.timeZone) ? raw.timeZone : fail('Unknown time zone')

    const config: Config = { v: 1, theme, device, timeZone }

    if (raw.title !== undefined) {
        if (typeof raw.title !== 'string') fail('title must be text')
        // By code point, so an emoji is never cut in half.
        const title = [...raw.title.trim()].slice(0, MAX_TITLE_LENGTH).join('')
        if (title) config.title = title
    }

    const birthDate = optionalDate(raw.birthDate, 'birthDate')
    const startDate = optionalDate(raw.startDate, 'startDate')
    const targetDate = optionalDate(raw.targetDate, 'targetDate')
    if (birthDate) config.birthDate = birthDate
    if (startDate) config.startDate = startDate
    if (targetDate) config.targetDate = targetDate

    if (raw.lifespanYears !== undefined) {
        const years = raw.lifespanYears
        if (typeof years !== 'number' || !Number.isInteger(years) || years < 50 || years > 120) fail('lifespanYears must be between 50 and 120')
        config.lifespanYears = years
    }

    if (theme === 'birthday' && !config.birthDate) fail('Enter your date of birth.', 'birthDate')
    if (theme === 'anniversary' && !config.startDate) fail('Enter the date you got together.', 'startDate')
    if (theme === 'goal' && !config.targetDate) fail('Enter the target date.', 'targetDate')

    if (raw.colors !== undefined) {
        if (typeof raw.colors !== 'object' || raw.colors === null) fail('colors must be an object')
        const colors: Partial<Colors> = {}
        for (const key of ['bg', 'past', 'future', 'accent', 'label'] as const) {
            const value = (raw.colors as Record<string, unknown>)[key]
            if (value === undefined) continue
            if (typeof value !== 'string' || !HEX.test(value)) fail(`colors.${key} must be a hex color like #FF9F0A`)
            colors[key] = value.toUpperCase()
        }
        if (Object.keys(colors).length) config.colors = colors
    }

    return config
}

export function resolveColors(config: Config): Colors {
    return { ...DEFAULT_COLORS[config.theme], ...config.colors }
}

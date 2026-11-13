/** Calendar-date helpers. Dates are ISO strings (YYYY-MM-DD) with no time or zone. */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

function toUtc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return Date.UTC(y, m - 1, d)
}

function toIso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS)
}

/** Same month and day `years` later. Feb 29 falls back to Feb 28 in common years. */
export function addYears(iso: string, years: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  const candidate = toIso(y + years, m, d)
  return isIsoDate(candidate) ? candidate : toIso(y + years, 2, 28)
}

/** Completed years between two dates (an age). Never negative. */
export function fullYears(from: string, to: string): number {
  if (diffDays(from, to) < 0) return 0
  let years = Number(to.slice(0, 4)) - Number(from.slice(0, 4))
  if (diffDays(addYears(from, years), to) < 0) years -= 1
  return Math.max(0, years)
}

/** Today's calendar date in an IANA time zone, e.g. "Europe/Rome". */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: value })
    return true
  }
  catch {
    return false
  }
}

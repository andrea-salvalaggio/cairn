import { describe, expect, it } from 'vitest'
import { addYears, diffDays, fullYears, isIsoDate, todayInTimeZone } from '../src'

describe('dates', () => {
    it('validates ISO dates', () => {
        expect(isIsoDate('2024-02-29')).toBe(true)
        expect(isIsoDate('2023-02-29')).toBe(false)
        expect(isIsoDate('2023-2-9')).toBe(false)
        expect(isIsoDate(20230209)).toBe(false)
    })

    it('counts days across DST and year boundaries', () => {
        expect(diffDays('2026-03-28', '2026-03-30')).toBe(2)
        expect(diffDays('2025-12-31', '2026-01-01')).toBe(1)
        expect(diffDays('2026-01-01', '2025-12-31')).toBe(-1)
    })

    it('moves Feb 29 to Feb 28 in common years', () => {
        expect(addYears('2020-02-29', 1)).toBe('2021-02-28')
        expect(addYears('2020-02-29', 4)).toBe('2024-02-29')
    })

    it('computes completed years', () => {
        expect(fullYears('1992-03-10', '2026-03-09')).toBe(33)
        expect(fullYears('1992-03-10', '2026-03-10')).toBe(34)
        expect(fullYears('2030-01-01', '2026-01-01')).toBe(0)
    })

    it('resolves today in a time zone', () => {
        const instant = new Date('2026-11-12T23:30:00Z')
        expect(todayInTimeZone('Europe/Rome', instant)).toBe('2026-11-13')
        expect(todayInTimeZone('America/Los_Angeles', instant)).toBe('2026-11-12')
    })
})

import { describe, expect, it } from 'vitest'
import { buildModel, DOT_BUDGET, parseConfig } from '../src'

const TODAY = '2026-11-12'

describe('birthday theme', () => {
    const config = parseConfig({ v: 1, theme: 'birthday', birthDate: '1992-03-10' })
    const model = buildModel(config, TODAY)

    it('shows one dot per year of a 90-year life', () => {
        expect(model.cells).toHaveLength(90)
        expect(model.columns).toBe(13)
    })

    it('marks the current year with the gift', () => {
        expect(model.cells.filter(c => c.state === 'past')).toHaveLength(34)
        expect(model.cells[34]).toEqual({ glyph: 'gift', state: 'current' })
        expect(model.counter).toEqual(['34 years'])
    })
})

describe('anniversary theme', () => {
    const config = parseConfig({ v: 1, theme: 'anniversary', startDate: '2018-04-22', title: 'In love with Elisa' })
    const model = buildModel(config, TODAY)

    it('shows one stone per anniversary reached, the latest as the heart, and completes only that row', () => {
        expect(model.cells).toHaveLength(13)
        expect(model.cells.filter(c => c.glyph === 'heart')).toEqual([{ glyph: 'heart', state: 'current' }])
        expect(model.cells.findIndex(c => c.state === 'current')).toBe(7) // the 8th anniversary
        expect(model.cells.filter(c => c.state === 'past')).toHaveLength(7)
    })

    it('counts years and spells out the start date', () => {
        expect(model.title).toBe('In love with Elisa')
        expect(model.counter).toEqual(['8 years', 'April 22, 2018'])
    })

    it('handles the anniversary day itself', () => {
        const onTheDay = buildModel(config, '2026-04-22')
        expect(onTheDay.counter).toEqual(['8 years', 'April 22, 2018'])
        expect(onTheDay.cells[7]!.state).toBe('current')
    })

    it('moves the heart forward on each anniversary', () => {
        const couple = parseConfig({ v: 1, theme: 'anniversary', startDate: '2025-09-21' })
        const states = (today: string) => buildModel(couple, today).cells.slice(0, 2).map(c => c.state)
        expect(states('2026-11-18')).toEqual(['current', 'future'])
        expect(buildModel(couple, '2026-11-18').counter).toEqual(['1 year', 'September 21, 2025'])
        expect(states('2027-09-21')).toEqual(['past', 'current'])
    })

    it('adds a row only when the anniversaries fill the current one', () => {
        const long = parseConfig({ v: 1, theme: 'anniversary', startDate: '2000-01-01' })
        expect(buildModel(long, '2013-06-01').cells).toHaveLength(13) // 13 anniversaries fill the row
        expect(buildModel(long, '2014-06-01').cells).toHaveLength(26) // the 14th starts a new one
    })

    it('shows an empty row before the first anniversary', () => {
        const fresh = buildModel(parseConfig({ v: 1, theme: 'anniversary', startDate: '2026-06-01' }), TODAY)
        expect(fresh.cells.every(c => c.state === 'future')).toBe(true)
        expect(fresh.counter).toEqual(['0 years', 'June 1, 2026'])
        const future = buildModel(parseConfig({ v: 1, theme: 'anniversary', startDate: '2027-01-04' }), TODAY)
        expect(future.counter).toEqual(['0 years', 'January 4, 2027'])
    })
})

describe('goal theme', () => {
    it('shows one dot per day and a star on the target', () => {
        const config = parseConfig({ v: 1, theme: 'goal', startDate: '2026-10-19', targetDate: '2027-01-15', title: 'New York City Marathon' })
        const model = buildModel(config, TODAY)
        expect(model.cells).toHaveLength(89)
        expect(model.cells.at(-1)!.glyph).toBe('star')
        expect(model.cells.filter(c => c.state === 'past')).toHaveLength(24)
        expect(model.counter).toEqual(['64d left', '27%'])
    })

    it('switches to a bigger unit instead of shrinking dots', () => {
        const config = parseConfig({ v: 1, theme: 'goal', startDate: '2026-01-01', targetDate: '2027-06-30' })
        const model = buildModel(config, TODAY)
        expect(model.cells.length).toBeLessThanOrEqual(DOT_BUDGET)
        expect(model.counter[0]).toMatch(/w left$/)
    })

    it('stays within budget for very long goals', () => {
        const config = parseConfig({ v: 1, theme: 'goal', startDate: '2026-01-01', targetDate: '2060-01-01' })
        expect(buildModel(config, TODAY).cells.length).toBeLessThanOrEqual(DOT_BUDGET)
    })

    it('reports the target day and never overflows after it', () => {
        const config = parseConfig({ v: 1, theme: 'goal', startDate: '2026-10-19', targetDate: '2027-01-15' })
        expect(buildModel(config, '2027-01-15').counter).toEqual(['Today', '100%'])
        const after = buildModel(config, '2027-03-01')
        expect(after.counter).toEqual(['Today', '100%'])
        expect(after.cells.at(-1)!.state).toBe('current')
    })
})

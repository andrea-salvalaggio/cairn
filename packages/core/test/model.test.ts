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

    it('shows one stone per year, the current year as the heart, and completes only that row', () => {
        expect(model.cells).toHaveLength(13)
        expect(model.cells.filter(c => c.glyph === 'heart')).toEqual([{ glyph: 'heart', state: 'current' }])
        expect(model.cells.findIndex(c => c.state === 'current')).toBe(8)
        expect(model.cells.filter(c => c.state === 'past')).toHaveLength(8)
    })

    it('counts years and weeks to the next anniversary', () => {
        expect(model.title).toBe('In love with Elisa')
        expect(model.counter).toEqual(['8 years', '23 weeks to the 9th'])
    })

    it('handles the anniversary day itself', () => {
        const onTheDay = buildModel(config, '2026-04-22')
        expect(onTheDay.counter).toEqual(['8 years', '52 weeks to the 9th'])
        expect(onTheDay.cells[8]!.state).toBe('current')
    })

    it('adds a row only when the years fill the current one', () => {
        const long = parseConfig({ v: 1, theme: 'anniversary', startDate: '2000-01-01' })
        expect(buildModel(long, '2012-06-01').cells).toHaveLength(13) // 12 years, the 13th is current
        expect(buildModel(long, '2013-06-01').cells).toHaveLength(26) // 13 years, the 14th starts a new row
    })

    it('shows an empty row before the start date', () => {
        const future = buildModel(parseConfig({ v: 1, theme: 'anniversary', startDate: '2027-01-14' }), TODAY)
        expect(future.cells.every(c => c.state === 'future')).toBe(true)
        expect(future.counter).toEqual(['0 years', '9 weeks to the 1st'])
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

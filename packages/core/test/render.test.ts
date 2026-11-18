import { describe, expect, it } from 'vitest'
import { DEVICES, parseConfig, render } from '../src'

const TODAY = '2026-11-12'
const birthday = parseConfig({ v: 1, theme: 'birthday', device: 'iphone-6.1', birthDate: '1992-03-10' })
/** [x, y] of every cell, in drawing order (only the pile, not the title and counter). */
const cellPositions = (svg: string) => [...svg.split('<g id="dots">')[1]!.split('</g>')[0]!.matchAll(/translate\(([\d.]+) ([\d.]+)\)/g)]
    .map(m => ({ x: Number(m[1]), y: Number(m[2]) }))

describe('render', () => {
    it('is deterministic', () => {
        expect(render(birthday, TODAY)).toBe(render(birthday, TODAY))
    })

    it('uses the exact native size of every device', () => {
        for (const device of DEVICES) {
            const svg = render({ ...birthday, device: device.id }, TODAY)
            expect(svg).toContain(`width="${device.width}" height="${device.height}"`)
        }
    })

    it('keeps the dot size fixed in points, whatever the amount of data', () => {
        const goal = parseConfig({ v: 1, theme: 'goal', device: 'iphone-6.1', startDate: '2026-01-01', targetDate: '2040-01-01' })
        expect(render(birthday, TODAY)).toContain('stroke-width="1.8"')
        expect(render(goal, TODAY)).toContain('stroke-width="1.8"')
    })

    it('lays stones bottom-up like a dry-stone wall', () => {
        const pos = cellPositions(render(birthday, TODAY))
        const first = pos[0]! // cell 0: base row, column 0
        const second = pos[13]! // cell 13: second row, column 0 (13 columns)
        expect(second.y).toBeLessThan(first.y) // the second row sits above the first
        expect(second.x - first.x).toBe(30) // and is shifted by half a stone (60 px pitch at 3x)
    })

        it('centres an incomplete top row on the row below', () => {
        // 106 days = 107 cells: 8 full rows of 13 and 3 on top (two stones, then the star).
        const goal = parseConfig({ v: 1, theme: 'goal', device: 'iphone-6.1', startDate: '2026-10-01', targetDate: '2027-01-15' })
        const pos = cellPositions(render(goal, '2026-10-01')).map(p => p.x)
        const rowStart = pos[78]! // row 6 (even, not shifted), column 0
        const topStart = pos[104]! // row 8 (even), first of the 3 top cells
        expect(topStart - rowStart).toBe(5 * 60) // (13 - 3) / 2 stones
    })

        it('centres the whole block vertically, however tall the pile is', () => {
        const anniversary = parseConfig({ v: 1, theme: 'anniversary', device: 'iphone-6.1', startDate: '2018-04-22' })
        for (const config of [birthday, anniversary]) {
            const svg = render(config, TODAY)
            const titleY = Number(svg.match(/<g id="title"><text x="[\d.]+" y="([\d.]+)"/)![1])
            const counterY = Number(svg.match(/<g id="counter"><text x="[\d.]+" y="([\d.]+)"/)![1])
            const capTop = titleY - 15 * 3 * 0.75 // title cap height at 3x
            expect(Math.abs((capTop + counterY) / 2 - 2556 * 0.57)).toBeLessThan(1)
        }
    })

        it('sets the title in the chosen style', () => {
        const poster = render({ ...birthday, font: 'poster' }, TODAY)
        expect(poster).toContain('font-family="Gravitas One, sans-serif"')
        expect(poster).toContain('>My life in years</text>')
        expect(render({ ...birthday, font: 'elegant' }, TODAY)).toContain('font-family="Bodoni Moda, sans-serif" font-size="54" font-weight="500" font-style="italic"')
    })

        it('escapes user text', () => {
        const svg = render({ ...birthday, title: '<b>"Tom & Jerry"</b>' }, TODAY)
        expect(svg).toContain('&lt;b&gt;&quot;Tom &amp; Jerry&quot;&lt;/b&gt;')
        expect(svg).not.toContain('<b>')
    })

    it('matches the snapshot for each theme', () => {
        const anniversary = parseConfig({ v: 1, theme: 'anniversary', device: 'iphone-6.1', startDate: '2018-04-22', title: 'In love with Elisa' })
        const goal = parseConfig({ v: 1, theme: 'goal', device: 'iphone-6.1', startDate: '2026-10-19', targetDate: '2027-01-15', title: 'New York City Marathon' })
        expect(render(birthday, TODAY)).toMatchSnapshot('birthday')
        expect(render(anniversary, TODAY)).toMatchSnapshot('anniversary')
        expect(render(goal, TODAY)).toMatchSnapshot('goal')
    })
})

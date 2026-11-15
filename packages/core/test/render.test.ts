import { describe, expect, it } from 'vitest'
import { DEVICES, parseConfig, render } from '../src'

const TODAY = '2026-11-12'
const birthday = parseConfig({ v: 1, theme: 'birthday', device: 'iphone-6.1', birthDate: '1992-03-10' })

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
    expect(render(birthday, TODAY)).toContain('scale(0.432)" fill')
    expect(render(goal, TODAY)).toContain('scale(0.432)" fill')
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

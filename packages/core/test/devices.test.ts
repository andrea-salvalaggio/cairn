import { describe, expect, it } from 'vitest'
import { DEVICES, deviceModels } from '../src'

describe('deviceModels', () => {
  it('lists every model once, grouped by generation', () => {
    const models = deviceModels().map(m => m.model)
    expect(models).toHaveLength(DEVICES.flatMap(d => d.models).length)
    expect(models.slice(0, 4)).toEqual(['iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max'])
    expect(models.slice(-4)).toEqual(['iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max'])
    // Each generation is one block: once a number is left behind it never comes back.
    const numbers = models.map(m => Number(m.match(/\d+/)?.[0] ?? 17))
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b))
  })
})

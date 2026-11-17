/**
 * iPhone resolution groups. Pixel sizes were cross-checked against Apple's tech specs
 * and two independent references.
 *
 * Safe-area insets are PROVISIONAL estimates, not Apple figures. They must be measured
 * on real devices and can be overridden per config.
 */
export interface Device {
  id: string
  label: string
  models: string[]
  width: number
  height: number
  /** Native pixels per point. The mini renders at 2.88x, not 3x. */
  scale: number
  cutout: 'notch' | 'island'
}

export const DEVICES = [
  { id: 'iphone-5.4', label: '5.4"', models: ['iPhone 12 mini', 'iPhone 13 mini'], width: 1080, height: 2340, scale: 2.88, cutout: 'notch' },
  { id: 'iphone-6.1-notch', label: '6.1"', models: ['iPhone 12', 'iPhone 12 Pro', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 14'], width: 1170, height: 2532, scale: 3, cutout: 'notch' },
  { id: 'iphone-6.1', label: '6.1"', models: ['iPhone 14 Pro', 'iPhone 15', 'iPhone 15 Pro', 'iPhone 16'], width: 1179, height: 2556, scale: 3, cutout: 'island' },
  { id: 'iphone-6.3', label: '6.3"', models: ['iPhone 16 Pro', 'iPhone 17', 'iPhone 17 Pro'], width: 1206, height: 2622, scale: 3, cutout: 'island' },
  { id: 'iphone-6.5', label: '6.5"', models: ['iPhone Air'], width: 1260, height: 2736, scale: 3, cutout: 'island' },
  { id: 'iphone-6.7-notch', label: '6.7"', models: ['iPhone 12 Pro Max', 'iPhone 13 Pro Max', 'iPhone 14 Plus'], width: 1284, height: 2778, scale: 3, cutout: 'notch' },
  { id: 'iphone-6.7', label: '6.7"', models: ['iPhone 14 Pro Max', 'iPhone 15 Plus', 'iPhone 15 Pro Max', 'iPhone 16 Plus'], width: 1290, height: 2796, scale: 3, cutout: 'island' },
  { id: 'iphone-6.9', label: '6.9"', models: ['iPhone 16 Pro Max', 'iPhone 17 Pro Max'], width: 1320, height: 2868, scale: 3, cutout: 'island' },
] as const satisfies readonly Device[]

export type DeviceId = (typeof DEVICES)[number]['id']

export const DEFAULT_DEVICE: DeviceId = 'iphone-6.3'

export function getDevice(id: string): Device {
  const device = DEVICES.find(d => d.id === id)
  if (!device) throw new Error(`Unknown device: ${id}`)
  return device
}

/** Flat list of model names for the device picker. */
// Within a generation: the base model, then mini, Plus/Air, Pro, Pro Max.
const VARIANT_ORDER = ['', 'mini', 'Plus', 'Air', 'Pro', 'Pro Max']

/** Every model, grouped by generation (12, 12 mini, 12 Pro, 12 Pro Max, 13…). */
export function deviceModels(): { model: string, deviceId: DeviceId }[] {
  const key = (model: string) => {
    // iPhone Air has no number: it came out with the 17 and sits in that group.
    const [, number = '17', variant = ''] = model.match(/^iPhone (?:(\d+) ?)?(.*)$/)!
    return Number(number) * 10 + VARIANT_ORDER.indexOf(variant)
  }
  return DEVICES.flatMap(d => d.models.map(model => ({ model, deviceId: d.id })))
    .sort((a, b) => key(a.model) - key(b.model))
}

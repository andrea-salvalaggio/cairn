import { describe, expect, it } from 'vitest'
import { ConfigError, decodeConfig, encodeConfig, parseConfig } from '../src'

const base = { v: 1, theme: 'birthday', device: 'iphone-6.3', timeZone: 'Europe/Rome', birthDate: '1992-03-10' } as const

describe('config', () => {
    it('accepts a valid config and drops unknown keys', () => {
        expect(parseConfig({ ...base, hacker: '<script>' })).toEqual(base)
    })

    it('requires the date each theme needs', () => {
        expect(() => parseConfig({ v: 1, theme: 'birthday' })).toThrow(ConfigError)
        expect(() => parseConfig({ v: 1, theme: 'anniversary' })).toThrow(expect.objectContaining({ field: 'startDate' }))
        expect(() => parseConfig({ v: 1, theme: 'goal' })).toThrow(expect.objectContaining({ field: 'targetDate' }))
    })

    it('rejects bad values', () => {
        expect(() => parseConfig({ ...base, v: 2 })).toThrow(/version/)
        expect(() => parseConfig({ ...base, device: 'pixel' })).toThrow(/device/)
        expect(() => parseConfig({ ...base, timeZone: 'Mars/Olympus' })).toThrow(/time zone/)
        expect(() => parseConfig({ ...base, birthDate: '1992-13-40' })).toThrow(expect.objectContaining({ field: 'birthDate', message: expect.stringMatching(/complete date/) }))
        expect(() => parseConfig({ ...base, birthDate: '1899-12-31' })).toThrow(expect.objectContaining({ field: 'birthDate', message: 'Choose a year between 1900 and 2200.' }))
        expect(() => parseConfig({ v: 1, theme: 'goal', targetDate: '9999-12-31' })).toThrow(expect.objectContaining({ field: 'targetDate' }))
        expect(() => parseConfig({ ...base, colors: { accent: 'red' } })).toThrow(/hex/)
        expect(() => parseConfig({ ...base, lifespanYears: 500 })).toThrow(/lifespanYears/)
    })

    it('trims and caps the title', () => {
        expect(parseConfig({ ...base, title: `  ${'x'.repeat(100)}  ` }).title).toHaveLength(48)
    })

    it('round-trips through the URL codec', () => {
        const config = parseConfig({ ...base, title: 'Vita & più ♥', colors: { accent: '#ef4444' } })
        const encoded = encodeConfig(config)
        expect(encoded).toMatch(/^[\w-]+$/)
        expect(decodeConfig(encoded)).toEqual(config)
    })

    it('rejects garbage payloads', () => {
        expect(() => decodeConfig('')).toThrow(ConfigError)
        expect(() => decodeConfig('not base64!')).toThrow(ConfigError)
        expect(() => decodeConfig('bm90IGpzb24')).toThrow(ConfigError)
        expect(() => decodeConfig('a'.repeat(5000))).toThrow(ConfigError)
    })
})

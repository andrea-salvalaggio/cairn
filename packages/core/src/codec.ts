import { type Config, ConfigError, parseConfig } from './config'

/**
 * Config <-> URL segment, as base64url(JSON) for now.
 * Compression or default-stripping can come later behind the same two functions.
 */

const MAX_ENCODED_LENGTH = 4000

function toBase64Url(bytes: Uint8Array): string {
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
    const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
    const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    return Uint8Array.from(binary, char => char.charCodeAt(0))
}

export function encodeConfig(config: Config): string {
    return toBase64Url(new TextEncoder().encode(JSON.stringify(parseConfig(config))))
}

export function decodeConfig(encoded: string): Config {
    if (!encoded || encoded.length > MAX_ENCODED_LENGTH || !/^[\w-]+$/.test(encoded)) throw new ConfigError('Invalid config')
    let json: unknown
    try {
        json = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded)))
    }
    catch {
        throw new ConfigError('Invalid config')
    }
    return parseConfig(json)
}

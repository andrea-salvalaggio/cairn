/**
 * Title styles, after the Instagram Stories text styles. Instagram's own fonts are not licensed for reuse,
 * so each style uses an open (OFL) Google Font with the same character.
 */
export interface TitleFont {
    id: string
    label: string
    family: string
    weight: number
    /** Font file the server renders with (apps/web/server/assets/fonts). */
    file: string
    /** Rough advance width per character, in ems, so long titles shrink to fit: the renderer has no font metrics. */
    charEm: number
    /** Size relative to Classic, so every style reads about as large on the Lock Screen. */
    scale: number
    italic?: boolean
}

// Order of the picker. charEm is measured with resvg and padded like Classic's (0.62 for a measured 0.51).
export const TITLE_FONTS = [
    { id: 'classic', label: 'Classic', family: 'Geist', weight: 700, file: 'Geist-Bold.ttf', charEm: 0.62, scale: 1 },
    { id: 'signature', label: 'Signature', family: 'Caveat', weight: 500, file: 'Caveat-Medium.ttf', charEm: 0.44, scale: 1.4 },
    { id: 'poster', label: 'Poster', family: 'Gravitas One', weight: 400, file: 'GravitasOne-Regular.ttf', charEm: 0.89, scale: 0.9 },
    { id: 'squeeze', label: 'Squeeze', family: 'Anton', weight: 400, file: 'Anton-Regular.ttf', charEm: 0.51, scale: 1.15 },
    { id: 'typewriter', label: 'Typewriter', family: 'Courier Prime', weight: 700, file: 'CourierPrime-Bold.ttf', charEm: 0.73, scale: 1.05 },
    { id: 'elegant', label: 'Elegant', family: 'Bodoni Moda', weight: 500, file: 'BodoniModa-MediumItalic.ttf', charEm: 0.58, scale: 1.2, italic: true },
    { id: 'literature', label: 'Literature', family: 'Libre Baskerville', weight: 400, file: 'LibreBaskerville-Regular.ttf', charEm: 0.66, scale: 1.05 },
] as const satisfies readonly TitleFont[]

export type TitleFontId = (typeof TITLE_FONTS)[number]['id']

/** Absent from a config means Classic, so links made before title styles keep their look. */
export const DEFAULT_TITLE_FONT: TitleFontId = 'classic'

export function getTitleFont(id: TitleFontId = DEFAULT_TITLE_FONT): TitleFont {
    return TITLE_FONTS.find(f => f.id === id)!
}

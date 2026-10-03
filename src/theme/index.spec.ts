import { describe, expect, it } from 'vitest'
import { buildVuetifyThemes } from './index'

// Color keys required by SPEC.md section 10.
const REQUIRED_KEYS = [
  'background',
  'surface',
  'surface-bright',
  'on-surface',
  'on-surface-variant',
  'surface-variant',
  'surface-container',
  'surface-container-high',
  'primary',
  'on-primary',
  'primary-container',
  'on-primary-container',
  'secondary',
  'on-secondary',
  'secondary-container',
  'on-secondary-container',
  'inverse-surface',
  'inverse-on-surface',
  'inverse-primary',
  'outline',
  'outline-variant',
  'error',
  'on-error',
]

// Text/background pairs from the contrast table in SPEC.md section 10.
const CONTRAST_PAIRS: [text: string, background: string][] = [
  ['on-surface', 'background'],
  ['on-surface', 'surface-container-high'],
  ['primary', 'surface-container-high'],
  ['on-surface-variant', 'surface-container-high'],
  ['on-surface-variant', 'surface-variant'],
  ['inverse-on-surface', 'inverse-surface'],
  ['inverse-primary', 'inverse-surface'],
  ['on-primary', 'primary'],
  ['on-primary-container', 'primary-container'],
  ['on-secondary-container', 'secondary-container'],
]

// WCAG AA for normal text.
const MIN_CONTRAST = 4.5

const PRESETS = ['#3159BD', '#B03A66']

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/

function channels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

describe('buildVuetifyThemes', () => {
  const { light, dark } = buildVuetifyThemes('#3159BD')

  it('keeps light primary close to the seed color (< 12 per RGB channel)', () => {
    const primary = light.colors?.primary
    expect(typeof primary).toBe('string')
    const seed = channels('#3159BD')
    const actual = channels(primary as string)
    for (let i = 0; i < 3; i++) {
      expect(Math.abs(actual[i] - seed[i])).toBeLessThan(12)
    }
  })

  it.each([
    ['light', light],
    ['dark', dark],
  ])('sets every key from SPEC section 10 as a valid hex value (%s)', (_name, theme) => {
    for (const key of REQUIRED_KEYS) {
      const value = theme.colors?.[key]
      expect(value, `missing key ${key}`).toBeDefined()
      expect(value, `invalid hex for ${key}: ${String(value)}`).toMatch(HEX_PATTERN)
    }
  })
})

// Relative luminance per WCAG 2.x.
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('theme contrast (SPEC.md section 10)', () => {
  const cases = PRESETS.flatMap((seed) => {
    const themes = buildVuetifyThemes(seed)
    return [[seed, 'light', themes.light] as const, [seed, 'dark', themes.dark] as const]
  })

  it.each(cases)('every pair reaches 4.5:1 (%s, %s)', (_seed, _mode, theme) => {
    for (const [text, background] of CONTRAST_PAIRS) {
      const fg = theme.colors?.[text] as string
      const bg = theme.colors?.[background] as string
      expect(fg, `missing key ${text}`).toMatch(HEX_PATTERN)
      expect(bg, `missing key ${background}`).toMatch(HEX_PATTERN)
      const ratio = contrastRatio(fg, bg)
      expect(
        ratio,
        `${text} ${fg} on ${background} ${bg}: ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(MIN_CONTRAST)
    }
  })
})

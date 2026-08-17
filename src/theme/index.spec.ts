import { describe, expect, it } from 'vitest'
import { buildVuetifyThemes } from './index'

// Color keys required by SPEC.md section 10.
const REQUIRED_KEYS = [
  'background',
  'surface',
  'surface-bright',
  'on-surface',
  'on-surface-variant',
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
  'outline',
  'outline-variant',
  'error',
  'on-error',
]

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

import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities'
import type { Scheme, TonalPalette } from '@material/material-color-utilities'
import type { ThemeDefinition } from 'vuetify'

/**
 * Builds the Vuetify light and dark themes from a single seed color,
 * mapping the Material 3 color roles listed in SPEC.md section 10.
 *
 * The classic M3 scheme does not include the surface-container roles,
 * so those are derived from the neutral tonal palette with the tones
 * defined by the Material 3 spec.
 */
export function buildVuetifyThemes(seedHex: string): {
  light: ThemeDefinition
  dark: ThemeDefinition
} {
  const theme = themeFromSourceColor(argbFromHex(seedHex))
  const neutral = theme.palettes.neutral
  return {
    light: {
      dark: false,
      colors: mapColors(theme.schemes.light, neutral, { bright: 98, container: 94, high: 92 }),
    },
    dark: {
      dark: true,
      colors: mapColors(theme.schemes.dark, neutral, { bright: 24, container: 12, high: 17 }),
    },
  }
}

function mapColors(
  scheme: Scheme,
  neutral: TonalPalette,
  surfaceTones: { bright: number; container: number; high: number },
): Record<string, string> {
  const hex = (argb: number) => hexFromArgb(argb)
  return {
    background: hex(scheme.background),
    surface: hex(scheme.surface),
    'surface-bright': hex(neutral.tone(surfaceTones.bright)),
    'on-surface': hex(scheme.onSurface),
    'on-surface-variant': hex(scheme.onSurfaceVariant),
    'surface-container': hex(neutral.tone(surfaceTones.container)),
    'surface-container-high': hex(neutral.tone(surfaceTones.high)),
    primary: hex(scheme.primary),
    'on-primary': hex(scheme.onPrimary),
    'primary-container': hex(scheme.primaryContainer),
    'on-primary-container': hex(scheme.onPrimaryContainer),
    secondary: hex(scheme.secondary),
    'on-secondary': hex(scheme.onSecondary),
    'secondary-container': hex(scheme.secondaryContainer),
    'on-secondary-container': hex(scheme.onSecondaryContainer),
    outline: hex(scheme.outline),
    'outline-variant': hex(scheme.outlineVariant),
    error: hex(scheme.error),
    'on-error': hex(scheme.onError),
  }
}

/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'

// Repo name from the git remote (github.com/JulianBuchner/Spritverbrauch).
// GitHub Pages serves the app under /<repo-name>/.
const REPO_NAME = 'Spritverbrauch'

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [
    vue(),
    // Imports only the Vuetify components and directives the templates use.
    vuetify({ autoImport: true }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        // Default patterns plus the MDI icon font, so icons render on an
        // offline cold start. woff2 only: every target browser picks it first.
        globPatterns: ['**/*.{js,css,html,woff2}'],
        // The MDI stylesheet requests the font as `...woff2?v=7.4.47`; ignore
        // `v` (next to Workbox's defaults) so that request hits the precache.
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^v$/],
      },
      manifest: {
        name: 'Spritverbrauch',
        short_name: 'Spritverbrauch',
        description: 'Tankverbrauch erfassen und auswerten',
        lang: 'de',
        display: 'standalone',
        theme_color: '#3159BD',
        // Dark so the splash screen does not flash white in the dark theme.
        background_color: '#1C1C1E',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Libraries in their own chunks: their content hashes stay stable
        // across app deploys, so the service worker re-fetches only the
        // changed app chunk.
        codeSplitting: {
          groups: [
            { name: 'vuetify', test: /[\\/]node_modules[\\/]vuetify[\\/]/ },
            {
              name: 'chart',
              test: /[\\/]node_modules[\\/](chart\.js|chartjs-adapter-date-fns|date-fns|@kurkle[\\/]color)[\\/]/,
            },
            {
              name: 'material-color',
              test: /[\\/]node_modules[\\/]@material[\\/]material-color-utilities[\\/]/,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    // Date tests must be platform-independent (a TZ prefix in the npm script
    // would not work on Windows).
    env: { TZ: 'Europe/Vienna' },
    server: {
      deps: {
        // Ships extensionless ESM imports that Node cannot resolve unbundled.
        inline: ['@material/material-color-utilities'],
      },
    },
  },
})

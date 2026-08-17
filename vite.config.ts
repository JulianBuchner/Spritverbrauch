/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// Repo name from the git remote (github.com/JulianBuchner/Spritverbrauch).
// GitHub Pages serves the app under /<repo-name>/.
const REPO_NAME = 'Spritverbrauch'

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
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

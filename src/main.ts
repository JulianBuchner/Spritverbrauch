import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './App.vue'
import { router } from './router'
import { buildVuetifyThemes, DEFAULT_SEED_COLOR } from './theme'

const { light, dark } = buildVuetifyThemes(DEFAULT_SEED_COLOR)

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    // 'system' follows prefers-color-scheme reactively (Vuetify built-in).
    defaultTheme: 'system',
    themes: { light, dark },
  },
})

createApp(App).use(createPinia()).use(router).use(vuetify).mount('#app')

// Dev-only console helper to load the reference fixture; the guard makes
// Vite drop the whole module from the production build.
if (import.meta.env.DEV) {
  void import('./dev/loadReferenceFixture')
}

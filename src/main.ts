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
import { buildVuetifyThemes } from './theme'
import { DEFAULT_SEED_COLOR } from './store/settings'

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

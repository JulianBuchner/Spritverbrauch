<script setup lang="ts">
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import { useSettingsStore } from './store/settings'
import { buildVuetifyThemes } from './theme'

const settings = useSettingsStore()
const theme = useTheme()

watch(
  () => settings.seedColor,
  (seed) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(seed)) return
    const { light, dark } = buildVuetifyThemes(seed)
    Object.assign(theme.themes.value.light.colors, light.colors)
    Object.assign(theme.themes.value.dark.colors, dark.colors)
  },
)

watch(
  () => settings.themeMode,
  (mode) => {
    theme.change(mode)
  },
)
</script>

<template>
  <v-app>
    <router-view />
  </v-app>
</template>

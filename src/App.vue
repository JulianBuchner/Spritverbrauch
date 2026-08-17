<script setup lang="ts">
import { watch, watchEffect } from 'vue'
import { useTheme } from 'vuetify'
import { useAppStore } from './store/app'
import { flushPendingSave } from './persistence/db'
import { buildVuetifyThemes, setMetaThemeColor } from './theme'
import AppDrawer from './components/AppDrawer.vue'
import AppSnackbar from './components/AppSnackbar.vue'
import BackupDialogs from './components/BackupDialogs.vue'

const store = useAppStore()
const theme = useTheme()

store.initialize()

// A debounced settings save that is still pending must not be lost when
// the page is left or backgrounded.
window.addEventListener('pagehide', flushPendingSave)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) flushPendingSave()
})

watch(
  () => store.settings.seedColor,
  (seed) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(seed)) return
    const { light, dark } = buildVuetifyThemes(seed)
    Object.assign(theme.themes.value.light.colors, light.colors)
    Object.assign(theme.themes.value.dark.colors, dark.colors)
  },
  { immediate: true },
)

watch(
  () => store.settings.themeMode,
  (mode) => {
    theme.change(mode)
  },
  { immediate: true },
)

// Keep the browser/status bar color in sync with the effective palette;
// covers seed changes, mode changes, and system-scheme flips.
watchEffect(() => {
  setMetaThemeColor(theme.current.value.colors.surface)
})
</script>

<template>
  <v-app>
    <template v-if="store.loaded">
      <AppDrawer />
      <router-view />
      <BackupDialogs />
    </template>
    <AppSnackbar />
  </v-app>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '../store/settings'
import { strings } from '../strings'

// Placeholder screen for subtask 0; replaced by the real screens in subtask 2.
const settings = useSettingsStore()
const drawerOpen = ref(false)

const seedInput = ref(settings.seedColor)

function onSeedInput(value: string) {
  seedInput.value = value
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    settings.seedColor = value
  }
}

const seedRule = (value: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value) || strings.seedColorInvalid
</script>

<template>
  <v-app-bar>
    <v-app-bar-nav-icon @click="drawerOpen = !drawerOpen" />
    <v-app-bar-title>{{ strings.appTitle }}</v-app-bar-title>
  </v-app-bar>

  <v-navigation-drawer v-model="drawerOpen" temporary>
    <div class="drawer-title">{{ strings.appTitle }}</div>
  </v-navigation-drawer>

  <v-main>
    <div class="placeholder">
      <p class="placeholder-text">{{ strings.noData }}</p>

      <v-btn-toggle
        :model-value="settings.themeMode"
        mandatory
        divided
        @update:model-value="settings.themeMode = $event"
      >
        <v-btn value="light">{{ strings.themeModeLight }}</v-btn>
        <v-btn value="dark">{{ strings.themeModeDark }}</v-btn>
        <v-btn value="system">{{ strings.themeModeSystem }}</v-btn>
      </v-btn-toggle>

      <v-text-field
        :model-value="seedInput"
        :label="strings.seedColor"
        :rules="[seedRule]"
        variant="outlined"
        class="seed-field"
        @update:model-value="onSeedInput"
      >
        <template #append-inner>
          <input
            type="color"
            :value="settings.seedColor"
            class="seed-swatch"
            @input="onSeedInput(($event.target as HTMLInputElement).value)"
          />
        </template>
      </v-text-field>
    </div>
  </v-main>
</template>

<style scoped>
.drawer-title {
  font-size: var(--sv-font-drawer-title);
  font-weight: var(--sv-font-weight-regular);
  padding: 16px;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 24px;
  padding: 24px var(--sv-page-padding-x);
}

.placeholder-text {
  font-size: var(--sv-font-list-item);
}

.seed-field {
  width: 260px;
}

.seed-swatch {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}
</style>

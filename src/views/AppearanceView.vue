<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../store/app'
import { strings } from '../strings'
import SampleEntryCard from '../components/SampleEntryCard.vue'

// Theme selection per SPEC.md section 9.6: mode toggle, seed color picker
// with two presets, and a live preview card. Changes apply immediately and
// are persisted.
const store = useAppStore()
const router = useRouter()

const presets = [
  { label: strings.presetBlue, color: '#3159BD' },
  { label: strings.presetBordeaux, color: '#B03A66' },
]

const seedInput = ref(store.settings.seedColor)

watch(
  () => store.settings.seedColor,
  (color) => {
    seedInput.value = color
  },
)

function onSeedInput(value: string) {
  seedInput.value = value
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    store.setSeedColor(value)
  }
}

const seedRule = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value) || strings.seedColorInvalid
</script>

<template>
  <v-app-bar flat>
    <v-btn icon="mdi-arrow-left" @click="router.push('/')" />
    <v-app-bar-title class="appbar-title">{{ strings.appearance }}</v-app-bar-title>
  </v-app-bar>

  <v-main>
    <div class="appearance">
      <section>
        <p class="section-label">{{ strings.themeMode }}</p>
        <v-btn-toggle
          :model-value="store.settings.themeMode"
          mandatory
          divided
          @update:model-value="store.setThemeMode($event)"
        >
          <v-btn value="light">{{ strings.themeModeLight }}</v-btn>
          <v-btn value="dark">{{ strings.themeModeDark }}</v-btn>
          <v-btn value="system">{{ strings.themeModeSystem }}</v-btn>
        </v-btn-toggle>
      </section>

      <section>
        <p class="section-label">{{ strings.seedColor }}</p>
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
              :value="store.settings.seedColor"
              class="seed-swatch"
              @input="onSeedInput(($event.target as HTMLInputElement).value)"
            />
          </template>
        </v-text-field>

        <div class="presets">
          <v-btn
            v-for="preset in presets"
            :key="preset.color"
            variant="tonal"
            @click="onSeedInput(preset.color)"
          >
            <span class="preset-swatch" :style="{ background: preset.color }" />
            {{ preset.label }}
          </v-btn>
        </div>
      </section>

      <section>
        <p class="section-label">{{ strings.preview }}</p>
        <SampleEntryCard />
      </section>
    </div>
  </v-main>
</template>

<style scoped>
.appearance {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 16px var(--sv-page-padding-x);
  max-width: 480px;
}

.section-label {
  font-size: var(--sv-font-label);
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 8px;
}

.seed-field {
  max-width: 260px;
}

.seed-swatch {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
}

.presets {
  display: flex;
  gap: 8px;
}

.preset-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 8px;
  border: 1px solid rgb(var(--v-theme-outline-variant));
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatTimestamp } from '../domain/format'
import { useAppStore } from '../store/app'
import { useBackup } from '../composables/useBackup'
import { strings } from '../strings'
import pkg from '../../package.json'

// Settings per SPEC.md section 9.7: app version, car and entry counts,
// links to export and import, plus the backup hint. No empty placeholders.
const store = useAppStore()
const router = useRouter()
const { startExport, startImport } = useBackup()

const lastExportText = computed(() => {
  const iso = store.settings.lastExportedAt
  return iso ? strings.lastExported(formatTimestamp(iso)) : strings.neverExported
})

function exportEntries() {
  void startExport()
}
</script>

<template>
  <v-app-bar flat>
    <v-btn icon="mdi-arrow-left" @click="router.push('/')" />
    <v-app-bar-title class="appbar-title">{{ strings.settings }}</v-app-bar-title>
  </v-app-bar>

  <v-main>
    <v-list class="settings-list">
      <v-list-item>
        <v-list-item-title>{{ strings.appVersion }}</v-list-item-title>
        <v-list-item-subtitle>{{ pkg.version }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>{{ strings.carCount }}</v-list-item-title>
        <v-list-item-subtitle>{{ store.database.cars.length }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>{{ strings.entryCount }}</v-list-item-title>
        <v-list-item-subtitle>{{ store.database.entries.length }}</v-list-item-subtitle>
      </v-list-item>

      <v-divider class="my-2" />

      <p class="backup-hint">{{ strings.backupHint }} {{ lastExportText }}</p>

      <v-list-item @click="exportEntries">
        <template #prepend>
          <v-icon icon="mdi-upload" />
        </template>
        <v-list-item-title>{{ strings.exportEntries }}</v-list-item-title>
      </v-list-item>

      <v-list-item @click="startImport">
        <template #prepend>
          <v-icon icon="mdi-download" />
        </template>
        <v-list-item-title>{{ strings.importEntries }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-main>
</template>

<style scoped>
.settings-list {
  padding: 8px var(--sv-page-padding-x);
  background: transparent;
}

.backup-hint {
  padding: 4px 16px 8px;
  font-size: var(--sv-font-label);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>

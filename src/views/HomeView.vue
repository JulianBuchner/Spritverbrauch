<script setup lang="ts">
import { ref } from 'vue'
import { useAppStore } from '../store/app'
import { strings } from '../strings'
import CarDialog from '../components/CarDialog.vue'

// Entries view placeholder; the real entry list comes in subtask 3.
const store = useAppStore()
const addCarDialogOpen = ref(false)
</script>

<template>
  <v-app-bar flat>
    <v-app-bar-nav-icon @click="store.drawerOpen = true" />
    <v-app-bar-title class="appbar-title">
      {{ store.activeCar?.name ?? strings.appTitle }}
    </v-app-bar-title>
  </v-app-bar>

  <v-main>
    <div v-if="store.carsByPosition.length === 0" class="empty-state">
      <p>{{ strings.emptyNoCarsHint }}</p>
      <v-btn color="primary" variant="flat" @click="addCarDialogOpen = true">
        {{ strings.addCar }}
      </v-btn>
      <v-btn variant="tonal" @click="store.showSnackbar(strings.comingInSubtask6)">
        {{ strings.importEntries }}
      </v-btn>
    </div>
    <div v-else class="placeholder">
      <p>{{ strings.entriesPlaceholder }}</p>
    </div>
  </v-main>

  <CarDialog v-model="addCarDialogOpen" :car="null" />
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 24px var(--sv-page-padding-x);
  font-size: var(--sv-font-list-item);
}

.placeholder {
  padding: 24px var(--sv-page-padding-x);
  font-size: var(--sv-font-list-item);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>

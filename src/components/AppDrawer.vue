<script setup lang="ts">
import { useAppStore } from '../store/app'
import { useAppHistory } from '../navigation/useAppHistory'
import { useBackup } from '../composables/useBackup'
import { strings } from '../strings'
import CarDialog from './CarDialog.vue'

// Temporary (overlaying) navigation drawer per SPEC.md section 9.1. Open
// state lives in the history (one entry while open); car selection and page
// changes close the drawer as part of the same history step.
const store = useAppStore()
const history = useAppHistory()
const { startExport, startImport } = useBackup()

const drawerOpen = history.overlayModel('drawer')
const addCarDialogOpen = history.overlayModel('add-car')

function selectCar(carId: string) {
  void history.selectCar(carId)
}

function navigateTo(path: string) {
  void history.openPage(path)
}

function openAddCar() {
  addCarDialogOpen.value = true
}

// Export first: navigator.share needs the user gesture's activation.
function exportEntries() {
  void startExport()
  drawerOpen.value = false
}

function importEntries() {
  startImport()
  drawerOpen.value = false
}
</script>

<template>
  <!-- The route watcher would close the drawer on its own history entry
       (same URL, new entry); the history closes it instead. -->
  <v-navigation-drawer v-model="drawerOpen" temporary disable-route-watcher>
    <div class="drawer-title">{{ strings.appTitle }}</div>

    <v-list density="comfortable" class="drawer-list">
      <v-list-subheader class="drawer-subheader">{{ strings.vehicles }}</v-list-subheader>

      <v-list-item
        v-for="car in store.carsByPosition"
        :key="car.id"
        rounded="pill"
        :class="{ 'car-active': car.id === store.activeCarId }"
        @click="selectCar(car.id)"
      >
        <template #prepend>
          <v-icon icon="mdi-car" />
        </template>
        <v-list-item-title
          :class="car.id === store.activeCarId ? 'drawer-item-text-active' : 'drawer-item-text'"
        >
          {{ car.name }}
        </v-list-item-title>
      </v-list-item>

      <v-list-item rounded="pill" @click="openAddCar">
        <template #prepend>
          <v-icon icon="mdi-plus" />
        </template>
        <v-list-item-title class="drawer-item-text">{{ strings.addCar }}</v-list-item-title>
      </v-list-item>

      <v-list-item rounded="pill" @click="navigateTo('/cars')">
        <template #prepend>
          <v-icon icon="mdi-car" />
        </template>
        <v-list-item-title class="drawer-item-text">{{ strings.carManagement }}</v-list-item-title>
      </v-list-item>

      <v-divider class="drawer-divider" />

      <v-list-item rounded="pill" @click="navigateTo('/graph')">
        <template #prepend>
          <v-icon icon="mdi-chart-line" />
        </template>
        <v-list-item-title class="drawer-item-text">{{ strings.graph }}</v-list-item-title>
      </v-list-item>

      <v-list-item rounded="pill" @click="navigateTo('/appearance')">
        <template #prepend>
          <v-icon icon="mdi-contrast-circle" />
        </template>
        <v-list-item-title class="drawer-item-text">{{ strings.appearance }}</v-list-item-title>
      </v-list-item>

      <v-list-item rounded="pill" @click="navigateTo('/settings')">
        <template #prepend>
          <v-icon icon="mdi-cog" />
        </template>
        <v-list-item-title class="drawer-item-text">{{ strings.settings }}</v-list-item-title>
      </v-list-item>

      <v-list-item rounded="pill" @click="exportEntries">
        <template #prepend>
          <v-icon icon="mdi-upload" />
        </template>
        <v-list-item-title class="drawer-item-text">{{ strings.exportEntries }}</v-list-item-title>
      </v-list-item>

      <v-list-item rounded="pill" @click="importEntries">
        <template #prepend>
          <v-icon icon="mdi-download" />
        </template>
        <v-list-item-title class="drawer-item-text">{{ strings.importEntries }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <CarDialog v-model="addCarDialogOpen" :car="null" />
</template>

<style scoped>
.drawer-title {
  font-size: var(--sv-font-drawer-title);
  font-weight: var(--sv-font-weight-regular);
  padding: 20px 16px 12px;
}

.drawer-list {
  padding-inline: 8px;
}

.drawer-subheader {
  font-size: var(--sv-font-label);
}

.drawer-item-text {
  font-size: var(--sv-font-list-item);
}

.drawer-item-text-active {
  font-size: var(--sv-font-list-item);
  font-weight: var(--sv-font-weight-medium);
}

.car-active {
  background: rgb(var(--v-theme-secondary-container));
  color: rgb(var(--v-theme-on-secondary-container));
}

.drawer-divider {
  margin: 8px 16px;
}
</style>

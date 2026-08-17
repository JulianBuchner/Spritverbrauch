<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../store/app'
import { useBackup } from '../composables/useBackup'
import { strings } from '../strings'
import CarDialog from './CarDialog.vue'

// Temporary (overlaying) navigation drawer per SPEC.md section 9.1.
const store = useAppStore()
const router = useRouter()
const { startExport, startImport } = useBackup()

const addCarDialogOpen = ref(false)

function selectCar(carId: string) {
  store.setActiveCar(carId)
  store.drawerOpen = false
}

function navigateTo(path: string) {
  store.drawerOpen = false
  router.push(path)
}

function openAddCar() {
  store.drawerOpen = false
  addCarDialogOpen.value = true
}

function exportEntries() {
  store.drawerOpen = false
  void startExport()
}

function importEntries() {
  store.drawerOpen = false
  startImport()
}
</script>

<template>
  <v-navigation-drawer v-model="store.drawerOpen" temporary>
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

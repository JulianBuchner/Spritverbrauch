<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../store/app'
import type { Car } from '../domain/types'
import { strings } from '../strings'
import CarDialog from '../components/CarDialog.vue'

// Car management per SPEC.md section 9.5 and docs/reference/cars.jpeg.
const store = useAppStore()
const router = useRouter()

const dialogOpen = ref(false)
const editedCar = ref<Car | null>(null)

const deleteDialogOpen = ref(false)
const carToDelete = ref<Car | null>(null)

function openCreate() {
  editedCar.value = null
  dialogOpen.value = true
}

function openEdit(car: Car) {
  editedCar.value = car
  dialogOpen.value = true
}

function askDelete(car: Car) {
  carToDelete.value = car
  deleteDialogOpen.value = true
}

function confirmDelete() {
  if (carToDelete.value) store.deleteCar(carToDelete.value.id)
  deleteDialogOpen.value = false
}
</script>

<template>
  <v-app-bar flat>
    <v-btn icon="mdi-arrow-left" @click="router.push('/')" />
    <v-app-bar-title class="appbar-title">{{ strings.carManagement }}</v-app-bar-title>
  </v-app-bar>

  <v-main>
    <v-list v-if="store.carsByPosition.length > 0" class="car-list">
      <v-list-item v-for="car in store.carsByPosition" :key="car.id" class="car-item">
        <template #prepend>
          <div class="car-avatar">
            <v-icon icon="mdi-car" />
          </div>
        </template>

        <v-list-item-title class="car-name">
          {{ car.name }}
          <v-chip v-if="car.isDefault" size="small" class="ml-2">
            {{ strings.defaultChip }}
          </v-chip>
        </v-list-item-title>

        <template #append>
          <v-btn icon="mdi-pencil" variant="text" @click="openEdit(car)" />
          <v-btn icon="mdi-delete" variant="text" @click="askDelete(car)" />
        </template>
      </v-list-item>
    </v-list>

    <p v-else class="empty-hint">{{ strings.noCarsYet }}</p>

    <v-btn class="fab" icon="mdi-plus" color="primary-container" @click="openCreate" />
  </v-main>

  <CarDialog v-model="dialogOpen" :car="editedCar" />

  <v-dialog v-model="deleteDialogOpen" max-width="400">
    <v-card v-if="carToDelete" rounded="lg">
      <v-card-title class="dialog-title">
        {{ strings.deleteCarTitle(carToDelete.name) }}
      </v-card-title>
      <v-card-text>
        {{ strings.deleteCarMessage(store.entryCountOfCar(carToDelete.id)) }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="deleteDialogOpen = false">{{ strings.cancel }}</v-btn>
        <v-btn color="error" @click="confirmDelete">{{ strings.delete }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.car-list {
  padding: 8px var(--sv-page-padding-x);
  background: transparent;
}

.car-item {
  padding-block: 8px;
}

.car-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--sv-card-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-primary-container));
  color: rgb(var(--v-theme-on-primary-container));
  margin-right: 16px;
}

.car-name {
  font-size: var(--sv-font-list-item);
  display: flex;
  align-items: center;
}

.empty-hint {
  padding: 24px var(--sv-page-padding-x);
  font-size: var(--sv-font-list-item);
  color: rgb(var(--v-theme-on-surface-variant));
}

.fab {
  position: fixed;
  right: 16px;
  bottom: 16px;
  width: var(--sv-fab-size);
  height: var(--sv-fab-size);
  border-radius: var(--sv-fab-radius);
}

.dialog-title {
  font-size: var(--sv-font-appbar-title);
  font-weight: var(--sv-font-weight-regular);
  white-space: normal;
}
</style>

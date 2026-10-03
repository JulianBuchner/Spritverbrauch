<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { todayLocalDate } from '../domain/format'
import { sortEntriesForDisplay } from '../domain/stats'
import { useAppStore } from '../store/app'
import { useAppHistory } from '../navigation/useAppHistory'
import { useBackup } from '../composables/useBackup'
import { strings } from '../strings'
import CarDialog from '../components/CarDialog.vue'
import EntryCard from '../components/EntryCard.vue'
import TotalsHeader from '../components/TotalsHeader.vue'

// Entries view (SPEC.md section 9.2): totals header, the entry cards sorted
// by date descending, and the FAB leading to the entry form. The active car
// comes from the URL (`?car=<id>`, otherwise the default car); the store
// follows it via useAppHistory.
const store = useAppStore()
const history = useAppHistory()
const { startImport } = useBackup()
const addCarDialogOpen = history.overlayModel('add-car-home')

const activeEntries = computed(() =>
  store.database.entries.filter((entry) => entry.carId === store.activeCarId),
)
const sortedEntries = computed(() => sortEntriesForDisplay(activeEntries.value))

// The reference date for "year shown or not" in the card dates — reactive,
// so a view left open across midnight rolls over to the new day.
const today = ref(todayLocalDate())
const todayTimer = window.setInterval(() => {
  today.value = todayLocalDate()
}, 60_000)
onUnmounted(() => window.clearInterval(todayTimer))
</script>

<template>
  <v-app-bar flat>
    <v-app-bar-nav-icon @click="history.openOverlay('drawer')" />
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
      <v-btn variant="tonal" @click="startImport">
        {{ strings.importEntries }}
      </v-btn>
    </div>

    <div v-else class="entries-page">
      <TotalsHeader :entries="activeEntries" />
      <p v-if="sortedEntries.length === 0" class="empty-entries">
        {{ strings.emptyNoEntriesHint }}
      </p>
      <div v-else class="entry-list">
        <EntryCard v-for="entry in sortedEntries" :key="entry.id" :entry="entry" :today="today" />
      </div>
    </div>

    <v-btn
      v-if="store.carsByPosition.length > 0"
      icon="mdi-plus"
      class="fab"
      color="primary-container"
      elevation="3"
      @click="history.openPage('/entry/new')"
    />
  </v-main>

  <CarDialog v-model="addCarDialogOpen" :car="null" />
</template>

<style scoped>
.entries-page {
  padding: 12px var(--sv-page-padding-x) 88px;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--sv-card-gap);
  margin-top: 12px;
}

.empty-entries {
  margin-top: 24px;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 24px var(--sv-page-padding-x);
  font-size: var(--sv-font-list-item);
}
</style>

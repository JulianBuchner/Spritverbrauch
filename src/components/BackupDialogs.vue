<script setup lang="ts">
import { computed, watch } from 'vue'
import { useAppStore } from '../store/app'
import { useAppHistory } from '../navigation/useAppHistory'
import { useBackup } from '../composables/useBackup'
import { strings } from '../strings'

// The three import dialogs (confirm, result, error), driven by the shared
// backup state and mounted once in App.vue. Each is an overlay with its own
// history entry; the import state decides which one is wanted, and closing
// one through the history (Android back, tap outside) clears its state.
const store = useAppStore()
const history = useAppHistory()
const { state, confirmImport, cancelImport, dismissResult, dismissError } = useBackup()

const confirmOpen = history.overlayModel('import-confirm')
const resultOpen = history.overlayModel('import-result')
const errorOpen = history.overlayModel('import-error')

const wantedOverlay = computed(() => {
  if (state.pending) return 'import-confirm'
  if (state.result) return 'import-result'
  if (state.error) return 'import-error'
  return null
})

// Confirm -> result swaps the overlay in one history step.
watch(wantedOverlay, (id, previous) => {
  if (id) void history.openOverlay(id)
  else if (previous) void history.closeOverlay(previous)
})

watch(confirmOpen, (open) => {
  if (!open && state.pending) cancelImport()
})
watch(resultOpen, (open) => {
  if (!open && state.result) dismissResult()
})
watch(errorOpen, (open) => {
  if (!open && state.error) dismissError()
})

const resultText = computed(() => {
  if (!state.result) return ''
  const base = strings.importResultMessage(state.result.entries, state.result.cars)
  return state.result.excluded > 0
    ? `${base} ${strings.importResultExcluded(state.result.excluded)}`
    : base
})

// "Ansehen" leads to the entries list of the default car; choosing it
// closes the dialog as part of the same history step.
function viewEntries() {
  const defaultCarId = store.defaultCarId
  if (defaultCarId) void history.selectCar(defaultCarId)
  else resultOpen.value = false
}
</script>

<template>
  <v-dialog v-model="confirmOpen" max-width="420" :close-on-back="false">
    <v-card v-if="state.pending" rounded="lg">
      <v-card-title>{{ strings.importConfirmTitle }}</v-card-title>
      <v-card-text>
        <p>{{ strings.importConfirmFormat(state.pending.formatLabel) }}</p>
        <p>{{ strings.importConfirmCounts(state.pending.cars, state.pending.entries) }}</p>
        <p class="import-warning">{{ strings.importConfirmWarning }}</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="cancelImport">{{ strings.cancel }}</v-btn>
        <v-btn color="primary" @click="confirmImport">{{ strings.importAction }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="resultOpen" max-width="420" :close-on-back="false">
    <v-card rounded="lg">
      <v-card-title>{{ strings.importResultTitle }}</v-card-title>
      <v-card-text>{{ resultText }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="viewEntries">{{ strings.view }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="errorOpen" max-width="420" :close-on-back="false">
    <v-card rounded="lg">
      <v-card-title>{{ strings.importErrorTitle }}</v-card-title>
      <v-card-text>{{ state.error }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="dismissError">{{ strings.ok }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.import-warning {
  margin-top: 8px;
  font-weight: var(--sv-font-weight-medium);
}
</style>

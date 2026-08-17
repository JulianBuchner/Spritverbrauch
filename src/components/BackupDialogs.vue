<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '../store/app'
import { useBackup } from '../composables/useBackup'
import { strings } from '../strings'

// The three import dialogs (confirm, result, error), driven by the shared
// backup state and mounted once in App.vue.
const store = useAppStore()
const router = useRouter()
const { state, confirmImport, cancelImport, dismissResult, dismissError } = useBackup()

const resultText = computed(() => {
  if (!state.result) return ''
  const base = strings.importResultMessage(state.result.entries, state.result.cars)
  return state.result.excluded > 0
    ? `${base} ${strings.importResultExcluded(state.result.excluded)}`
    : base
})

// "Ansehen" leads to the entries list of the default car.
function viewEntries() {
  const defaultCar = store.database.cars.find((car) => car.isDefault)
  if (defaultCar) store.setActiveCar(defaultCar.id)
  dismissResult()
  router.push('/')
}
</script>

<template>
  <v-dialog
    :model-value="state.pending !== null"
    max-width="420"
    @update:model-value="(open: boolean) => open || cancelImport()"
  >
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

  <v-dialog
    :model-value="state.result !== null"
    max-width="420"
    @update:model-value="(open: boolean) => open || dismissResult()"
  >
    <v-card rounded="lg">
      <v-card-title>{{ strings.importResultTitle }}</v-card-title>
      <v-card-text>{{ resultText }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="viewEntries">{{ strings.view }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog
    :model-value="state.error !== null"
    max-width="420"
    @update:model-value="(open: boolean) => open || dismissError()"
  >
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

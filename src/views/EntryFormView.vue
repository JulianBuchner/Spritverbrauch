<script setup lang="ts">
import { computed, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { formatEntryDate, localCalendarDate, todayLocalDate } from '../domain/format'
import {
  costCentsToInput,
  litersToInput,
  parseCostInput,
  parseLitersInput,
  parseTripKmInput,
} from '../domain/parse'
import type { Entry } from '../domain/types'
import { useAppStore } from '../store/app'
import { strings } from '../strings'

// Entry form for both routes (SPEC.md section 9.3): /entry/new creates,
// /entry/:id edits with all values prefilled.
const store = useAppStore()
const route = useRoute()
const router = useRouter()

const routeId = typeof route.params.id === 'string' ? route.params.id : null
const editedEntry = routeId
  ? (store.database.entries.find((entry) => entry.id === routeId) ?? null)
  : null
const isEdit = editedEntry !== null

// Unreachable through the UI (unknown entry id, or no car to book an entry
// on); bail out to the entries list instead of showing a broken form.
if ((routeId && !editedEntry) || store.carsByPosition.length === 0) {
  router.replace('/')
}

const carId = ref(editedEntry?.carId ?? store.activeCarId ?? '')
const kmInput = ref(editedEntry ? String(editedEntry.tripKm) : '')
const litersInput = ref(editedEntry ? litersToInput(editedEntry.liters) : '')
const costInput = ref(editedEntry ? costCentsToInput(editedEntry.costCents) : '')
const date = ref(editedEntry?.date ?? todayLocalDate())
const isFull = ref(editedEntry?.isFull ?? true)
const countInStats = ref(editedEntry?.countInStats ?? true)
const note = ref(editedEntry?.note ?? '')

const parsedKm = computed(() => parseTripKmInput(kmInput.value))
const parsedLiters = computed(() => parseLitersInput(litersInput.value))
const parsedCost = computed(() => parseCostInput(costInput.value))

// Field errors appear after the first confirm attempt and update live from
// then on. Confirm stays clickable throughout (SPEC.md section 9.3).
const attempted = ref(false)

function fieldErrors(raw: string, parsed: number | null, invalidMessage: string): string[] {
  if (!attempted.value || parsed !== null) return []
  return [raw.trim() === '' ? strings.errorRequired : invalidMessage]
}

const kmErrors = computed(() => fieldErrors(kmInput.value, parsedKm.value, strings.errorInteger))
const litersErrors = computed(() =>
  fieldErrors(litersInput.value, parsedLiters.value, strings.errorDecimal),
)
const costErrors = computed(() =>
  fieldErrors(costInput.value, parsedCost.value, strings.errorDecimal),
)

// Date row: 'Heute' while the value is today, the formatted date otherwise.
const dateLabel = computed(() => {
  const today = todayLocalDate()
  return date.value === today ? strings.today : formatEntryDate(date.value, today)
})

const datePickerOpen = ref(false)
const pickerDate = computed(() => {
  const [year, month, day] = date.value.split('-').map(Number)
  return new Date(year, month - 1, day)
})

function onDatePicked(value: unknown) {
  if (value instanceof Date) date.value = localCalendarDate(value)
  datePickerOpen.value = false
}

// A zero in km, liters, or price suggests countInStats = false when the
// field is left (blur). The suggestion fires only once per field, so
// manually switching countInStats back on is not overridden again
// (SPEC.md section 9.3). Confirm itself always saves on the first click.
const zeroHintShown = ref(false)
const zeroSuggestionUsed = { km: false, liters: false, cost: false }

function suggestExcludeOnBlur(field: keyof typeof zeroSuggestionUsed) {
  const parsed = { km: parsedKm, liters: parsedLiters, cost: parsedCost }[field]
  if (parsed.value !== 0 || zeroSuggestionUsed[field]) return
  zeroSuggestionUsed[field] = true
  if (!countInStats.value) return
  countInStats.value = false
  zeroHintShown.value = true
}

const saved = ref(false)

function formSnapshot(): string {
  return JSON.stringify([
    carId.value,
    kmInput.value,
    litersInput.value,
    costInput.value,
    date.value,
    isFull.value,
    countInStats.value,
    note.value,
  ])
}
const initialSnapshot = formSnapshot()
const isDirty = computed(() => !saved.value && formSnapshot() !== initialSnapshot)

function confirm() {
  attempted.value = true
  if (parsedKm.value === null || parsedLiters.value === null || parsedCost.value === null) return

  const entry: Entry = {
    id: editedEntry?.id ?? crypto.randomUUID(),
    carId: carId.value,
    date: date.value,
    tripKm: parsedKm.value,
    liters: parsedLiters.value,
    costCents: parsedCost.value,
    isFull: isFull.value,
    countInStats: countInStats.value,
    note: note.value,
  }
  if (isEdit) {
    store.updateEntry(entry)
  } else {
    store.addEntry(entry)
  }
  // A car changed in the form becomes active, so the saved entry is visible.
  if (carId.value !== store.activeCarId) store.setActiveCar(carId.value)
  saved.value = true
  router.push('/')
}

// Leaving with unsaved changes asks once.
const leaveDialogOpen = ref(false)
const confirmedLeave = ref(false)
let pendingTarget: string | null = null

onBeforeRouteLeave((to) => {
  if (!isDirty.value || confirmedLeave.value) return true
  pendingTarget = to.fullPath
  leaveDialogOpen.value = true
  return false
})

function discardAndLeave() {
  confirmedLeave.value = true
  leaveDialogOpen.value = false
  router.push(pendingTarget ?? '/')
}
</script>

<template>
  <v-app-bar flat>
    <v-btn icon="mdi-arrow-left" @click="router.push('/')" />
    <v-app-bar-title class="appbar-title">
      {{ isEdit ? strings.entryFormTitleEdit : strings.entryFormTitleNew }}
    </v-app-bar-title>
  </v-app-bar>

  <v-main>
    <div class="entry-form">
      <v-select
        v-model="carId"
        :items="store.carsByPosition"
        item-title="name"
        item-value="id"
        :aria-label="strings.fieldCar"
        variant="plain"
        density="comfortable"
        hide-details
        class="car-select"
      />

      <v-text-field
        v-model="kmInput"
        :label="strings.fieldTripKm"
        :error-messages="kmErrors"
        variant="outlined"
        inputmode="decimal"
        @blur="suggestExcludeOnBlur('km')"
      />
      <v-text-field
        v-model="litersInput"
        :label="strings.fieldLiters"
        :error-messages="litersErrors"
        variant="outlined"
        inputmode="decimal"
        @blur="suggestExcludeOnBlur('liters')"
      />
      <v-text-field
        v-model="costInput"
        :label="strings.fieldCost"
        :error-messages="costErrors"
        variant="outlined"
        inputmode="decimal"
        @blur="suggestExcludeOnBlur('cost')"
      />

      <div class="date-row">
        <span class="date-label">{{ strings.fieldDate }}</span>
        <v-btn
          class="date-button"
          color="secondary-container"
          variant="flat"
          rounded="pill"
          @click="datePickerOpen = true"
        >
          {{ dateLabel }}
        </v-btn>
      </div>

      <v-switch v-model="isFull" :label="strings.fieldIsFull" color="primary" hide-details />
      <v-switch
        v-model="countInStats"
        :label="strings.fieldCountInStats"
        color="primary"
        hide-details
      />
      <p v-if="zeroHintShown" class="zero-hint">{{ strings.zeroValueHint }}</p>

      <v-text-field
        v-model="note"
        :label="strings.fieldNote"
        variant="outlined"
        class="note-field"
      />
    </div>

    <v-btn class="confirm-button" color="primary" variant="flat" rounded="pill" @click="confirm">
      {{ strings.confirm }}
    </v-btn>
  </v-main>

  <v-dialog v-model="datePickerOpen" width="auto">
    <v-date-picker :model-value="pickerDate" @update:model-value="onDatePicked" />
  </v-dialog>

  <v-dialog v-model="leaveDialogOpen" max-width="400">
    <v-card rounded="lg">
      <v-card-title class="dialog-title">{{ strings.discardTitle }}</v-card-title>
      <v-card-text>{{ strings.discardMessage }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="leaveDialogOpen = false">{{ strings.cancel }}</v-btn>
        <v-btn color="error" @click="discardAndLeave">{{ strings.discard }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.entry-form {
  display: flex;
  flex-direction: column;
  padding: 8px calc(var(--sv-page-padding-x) + 8px) 88px;
}

.car-select {
  flex: none;
  margin-bottom: 8px;
}

.date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0 16px;
}

.date-label {
  font-size: var(--sv-font-list-item);
}

.date-button {
  min-width: 45%;
}

.zero-hint {
  font-size: var(--sv-font-label);
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 4px 0 8px;
}

.note-field {
  margin-top: 12px;
}

/* Full-width confirm pinned to the bottom edge (SPEC.md section 9.3). */
.confirm-button {
  position: fixed;
  left: 16px;
  right: 16px;
  bottom: 16px;
  height: 48px;
}

.dialog-title {
  font-size: var(--sv-font-appbar-title);
  font-weight: var(--sv-font-weight-regular);
  white-space: normal;
}
</style>

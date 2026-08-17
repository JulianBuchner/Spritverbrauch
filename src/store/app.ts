import { defineStore } from 'pinia'
import { createEmptyDatabase } from '../domain/types'
import type { Car, Database, Entry, Settings } from '../domain/types'
import { loadDatabase, saveDatabase, saveDatabaseDebounced } from '../persistence/db'
import { strings } from '../strings'

export interface SnackbarAction {
  label: string
  onAction: () => void
}

export interface SnackbarMessage {
  id: number
  text: string
  timeoutMs: number
  action?: SnackbarAction
}

const DEFAULT_SNACKBAR_TIMEOUT_MS = 4000

let nextSnackbarId = 1

// Start-up selection of the active car: the default car; otherwise the car
// with the youngest entry; otherwise the car at position 0.
function pickActiveCarId(db: Database): string | null {
  if (db.cars.length === 0) return null
  const defaultCar = db.cars.find((car) => car.isDefault)
  if (defaultCar) return defaultCar.id
  let youngestCarId: string | null = null
  let youngestDate = ''
  for (const entry of db.entries) {
    if (entry.date > youngestDate) {
      youngestDate = entry.date
      youngestCarId = entry.carId
    }
  }
  if (youngestCarId && db.cars.some((car) => car.id === youngestCarId)) return youngestCarId
  return db.cars.find((car) => car.position === 0)?.id ?? db.cars[0].id
}

// Thin shell over the loaded Database document: holds state, calls domain
// functions, writes to IndexedDB. No computation logic lives here.
export const useAppStore = defineStore('app', {
  state: () => ({
    database: createEmptyDatabase(),
    loaded: false,
    activeCarId: null as string | null,
    drawerOpen: false,
    snackbarQueue: [] as SnackbarMessage[],
  }),

  getters: {
    settings(state): Settings {
      return state.database.settings
    },
    carsByPosition(state): Car[] {
      return [...state.database.cars].sort((a, b) => a.position - b.position)
    },
    activeCar(state): Car | null {
      return state.database.cars.find((car) => car.id === state.activeCarId) ?? null
    },
    entryCountOfCar(state): (carId: string) => number {
      return (carId) => state.database.entries.filter((entry) => entry.carId === carId).length
    },
  },

  actions: {
    async initialize() {
      try {
        const stored = await loadDatabase()
        if (stored) this.database = stored
      } catch {
        this.showSnackbar(strings.loadError)
      }
      this.activeCarId = pickActiveCarId(this.database)
      this.loaded = true
    },

    // Cars and entries changes are written immediately; only settings
    // changes are debounced (color picker dragging).
    persistNow() {
      saveDatabase(this.database).catch(() => this.showSnackbar(strings.saveError))
    },

    persistSettings() {
      saveDatabaseDebounced(this.database, () => this.showSnackbar(strings.saveError))
    },

    showSnackbar(text: string, options?: { timeoutMs?: number; action?: SnackbarAction }) {
      this.snackbarQueue.push({
        id: nextSnackbarId++,
        text,
        timeoutMs: options?.timeoutMs ?? DEFAULT_SNACKBAR_TIMEOUT_MS,
        action: options?.action,
      })
    },

    dismissSnackbar() {
      this.snackbarQueue.shift()
    },

    setActiveCar(carId: string) {
      this.activeCarId = carId
    },

    addCar(name: string, isDefault: boolean) {
      const car: Car = {
        id: crypto.randomUUID(),
        name,
        position: this.database.cars.length,
        isDefault,
      }
      if (isDefault) {
        for (const other of this.database.cars) other.isDefault = false
      }
      this.database.cars.push(car)
      this.normalizeCarPositions()
      if (this.activeCarId === null) this.activeCarId = car.id
      this.persistNow()
    },

    updateCar(carId: string, name: string, isDefault: boolean) {
      const car = this.database.cars.find((c) => c.id === carId)
      if (!car) return
      car.name = name
      if (isDefault) {
        for (const other of this.database.cars) other.isDefault = other.id === carId
      } else {
        car.isDefault = false
      }
      this.persistNow()
    },

    deleteCar(carId: string) {
      const wasDefault = this.database.cars.some((car) => car.id === carId && car.isDefault)
      this.database.cars = this.database.cars.filter((car) => car.id !== carId)
      this.database.entries = this.database.entries.filter((entry) => entry.carId !== carId)
      this.normalizeCarPositions()
      // The default role moves to the car the start-up selection rule
      // would pick next.
      if (wasDefault) {
        const successorId = pickActiveCarId(this.database)
        const successor = this.database.cars.find((car) => car.id === successorId)
        if (successor) successor.isDefault = true
      }
      if (this.activeCarId === carId) this.activeCarId = pickActiveCarId(this.database)
      this.persistNow()
    },

    // Keeps positions 0-based and gapless in the current order.
    normalizeCarPositions() {
      this.database.cars
        .slice()
        .sort((a, b) => a.position - b.position)
        .forEach((car, index) => {
          car.position = index
        })
    },

    addEntry(entry: Entry) {
      this.database.entries.push(entry)
      this.persistNow()
    },

    updateEntry(updated: Entry) {
      const index = this.database.entries.findIndex((entry) => entry.id === updated.id)
      if (index === -1) return
      this.database.entries.splice(index, 1, updated)
      this.persistNow()
    },

    // Deletes immediately, no confirmation dialog; the snackbar's undo action
    // is the safety net (SPEC.md section 9.2). Restoring at the original
    // array index keeps the display position, because the display sort is
    // stable and only orders by date.
    deleteEntry(entryId: string) {
      const index = this.database.entries.findIndex((entry) => entry.id === entryId)
      if (index === -1) return
      const [removed] = this.database.entries.splice(index, 1)
      this.persistNow()
      this.showSnackbar(strings.entryDeleted, {
        timeoutMs: 6000,
        action: { label: strings.undo, onAction: () => this.restoreEntry(removed, index) },
      })
    },

    restoreEntry(entry: Entry, index: number) {
      const insertAt = Math.min(index, this.database.entries.length)
      this.database.entries.splice(insertAt, 0, entry)
      this.persistNow()
    },

    // Replaces the whole document (dev fixture loading now, import later).
    replaceDatabase(database: Database) {
      this.database = database
      this.activeCarId = pickActiveCarId(database)
      this.persistNow()
    },

    setThemeMode(mode: Settings['themeMode']) {
      this.database.settings.themeMode = mode
      this.persistSettings()
    },

    setSeedColor(color: string) {
      this.database.settings.seedColor = color
      this.persistSettings()
    },
  },
})

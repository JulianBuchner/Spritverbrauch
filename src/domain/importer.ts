// Reads the app's own backup format and the reference app's export format
// (SPEC.md section 6). Invalid input throws an Error whose message can be
// shown in the UI — nothing is dropped silently.
//
// The German error messages live here instead of src/strings.ts because
// src/domain/ must not import from the rest of src/.
import type { Car, Database, Entry, Settings } from './types'
import { createEmptyDatabase } from './types'

export type ImportResult = {
  database: Database
  stats: { cars: number; entries: number; excluded: number }
}

export function importBackup(raw: unknown): ImportResult {
  if (!isRecord(raw)) {
    throw new Error('Die Datei enthält kein gültiges Backup.')
  }
  if ('version' in raw) {
    return importOwnFormat(raw)
  }
  if ('fuelEntries' in raw) {
    return importReferenceFormat(raw)
  }
  throw new Error(
    'Unbekanntes Dateiformat: weder ein Backup dieser App noch ein Export der Referenz-App.',
  )
}

// --- own format (SPEC.md section 6.1) --------------------------------------

function importOwnFormat(raw: Record<string, unknown>): ImportResult {
  if (raw.version !== 1) {
    throw new Error('Das Backup hat eine nicht unterstützte Version. Unterstützt wird Version 1.')
  }
  const database: Database = {
    version: 1,
    exportedAt: requireString(raw.exportedAt, 'Dem Backup fehlt der Exportzeitpunkt.'),
    settings: parseSettings(raw.settings),
    cars: requireArray(raw.cars, 'Dem Backup fehlt die Fahrzeugliste.').map(parseOwnCar),
    entries: requireArray(raw.entries, 'Dem Backup fehlt die Eintragsliste.').map(parseOwnEntry),
  }
  return {
    database,
    stats: {
      cars: database.cars.length,
      entries: database.entries.length,
      excluded: database.entries.filter((entry) => !entry.countInStats).length,
    },
  }
}

function parseSettings(value: unknown): Settings {
  const message = 'Die Einstellungen im Backup sind ungültig.'
  if (!isRecord(value)) throw new Error(message)
  const themeMode = value.themeMode
  if (themeMode !== 'light' && themeMode !== 'dark' && themeMode !== 'system') {
    throw new Error(message)
  }
  const seedColor = requireString(value.seedColor, message)
  if (!/^#[0-9A-Fa-f]{6}$/.test(seedColor)) throw new Error(message)
  return { themeMode, seedColor }
}

function parseOwnCar(value: unknown, index: number): Car {
  const message = `Fahrzeug ${index + 1} im Backup ist unvollständig oder ungültig.`
  if (!isRecord(value)) throw new Error(message)
  return {
    id: requireString(value.id, message),
    name: requireString(value.name, message),
    position: requireNumber(value.position, message),
    isDefault: requireBoolean(value.isDefault, message),
  }
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseOwnEntry(value: unknown, index: number): Entry {
  const message = `Eintrag ${index + 1} im Backup ist unvollständig oder ungültig.`
  if (!isRecord(value)) throw new Error(message)
  const date = requireString(value.date, message)
  if (!DATE_PATTERN.test(date)) throw new Error(message)
  return {
    id: requireString(value.id, message),
    carId: requireString(value.carId, message),
    date,
    tripKm: requireNumber(value.tripKm, message),
    liters: requireNumber(value.liters, message),
    costCents: requireNumber(value.costCents, message),
    isFull: requireBoolean(value.isFull, message),
    countInStats: requireBoolean(value.countInStats, message),
    note: requireString(value.note, message),
  }
}

// --- reference format (SPEC.md section 6.2) ---------------------------------

function importReferenceFormat(raw: Record<string, unknown>): ImportResult {
  const refCars = requireArray(raw.cars, 'Dem Referenz-Backup fehlt die Fahrzeugliste.').map(
    parseReferenceCar,
  )
  const refEntries = requireArray(raw.fuelEntries, 'Dem Referenz-Backup fehlt die Eintragsliste.')

  // The reference app's numeric ids are not stable across exports and must
  // never be used as keys; every car gets a fresh UUID.
  const idToUuid = new Map<number, string>()
  const cars: Car[] = [...refCars]
    .sort((a, b) => a.position - b.position)
    .map((refCar, index) => {
      const id = crypto.randomUUID()
      idToUuid.set(refCar.id, id)
      // position is re-normalized to be gapless
      return { id, name: refCar.name, position: index, isDefault: false }
    })

  // Default car: the one with the newest entry; without entries, position 0.
  let newestDateMs = Number.NEGATIVE_INFINITY
  let defaultCarId = cars.length > 0 ? cars[0].id : null

  const entries: Entry[] = refEntries.map((value, index) => {
    const message = `Eintrag ${index + 1} im Referenz-Backup ist unvollständig oder ungültig.`
    if (!isRecord(value)) throw new Error(message)
    const refCarId = requireNumber(value.carId, message)
    const carId = idToUuid.get(refCarId)
    if (carId === undefined) {
      throw new Error(
        `Eintrag ${index + 1} im Referenz-Backup verweist auf ein unbekanntes Fahrzeug (carId ${refCarId}).`,
      )
    }
    const dateMs = requireNumber(value.date, message)
    if (dateMs > newestDateMs) {
      newestDateMs = dateMs
      defaultCarId = carId
    }
    const tripKm = Math.round(requireNumber(value.km, message))
    // The reference export carries float32 artifacts; 3 decimals is the real precision.
    const liters = Math.round(requireNumber(value.liter, message) * 1000) / 1000
    const costCents = Math.round(requireNumber(value.price, message) * 100)
    return {
      id: crypto.randomUUID(),
      carId,
      date: epochMsToLocalDate(dateMs),
      tripKm,
      liters,
      costCents,
      isFull: requireBoolean(value.isFull, message),
      countInStats: tripKm > 0 && liters > 0 && costCents > 0,
      note: value.text == null ? '' : requireString(value.text, message),
    }
  })

  for (const car of cars) {
    car.isDefault = car.id === defaultCarId
  }

  const database = createEmptyDatabase()
  database.cars = cars
  database.entries = entries
  return {
    database,
    stats: {
      cars: cars.length,
      entries: entries.length,
      excluded: entries.filter((entry) => !entry.countInStats).length,
    },
  }
}

function parseReferenceCar(
  value: unknown,
  index: number,
): { id: number; name: string; position: number } {
  const message = `Fahrzeug ${index + 1} im Referenz-Backup ist unvollständig oder ungültig.`
  if (!isRecord(value)) throw new Error(message)
  return {
    id: requireNumber(value.id, message),
    name: requireString(value.name, message),
    position: requireNumber(value.position, message),
  }
}

// Epoch ms to the calendar date in the device's timezone — no UTC truncation.
function epochMsToLocalDate(ms: number): string {
  const date = new Date(ms)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// --- validation helpers ------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireArray(value: unknown, message: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(message)
  return value
}

function requireNumber(value: unknown, message: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(message)
  return value
}

function requireBoolean(value: unknown, message: string): boolean {
  if (typeof value !== 'boolean') throw new Error(message)
  return value
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string') throw new Error(message)
  return value
}

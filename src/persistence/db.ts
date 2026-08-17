// Thin idb-keyval wrapper around the single `spritverbrauch:db` document
// (SPEC.md section 5). Errors are NOT swallowed here — callers catch them
// and surface a snackbar via the store.
//
// Two write paths: cars/entries changes are written immediately via
// saveDatabase(); only settings changes (color picker dragging) go through
// the 300 ms debounce. flushPendingSave() writes a still-pending debounced
// save when the page is being left.
import { get, set } from 'idb-keyval'
import type { Database } from '../domain/types'

const DB_KEY = 'spritverbrauch:db'
const SAVE_DEBOUNCE_MS = 300

let saveTimer: ReturnType<typeof setTimeout> | undefined
let pendingSave: { db: Database; onError: (error: unknown) => void } | null = null

export async function loadDatabase(): Promise<Database | null> {
  return (await get<Database>(DB_KEY)) ?? null
}

// Immediate write of the whole document. Cancels a pending debounced save,
// because the full document is persisted anyway.
export async function saveDatabase(db: Database): Promise<void> {
  clearTimeout(saveTimer)
  pendingSave = null
  // The store passes a reactive proxy, which IndexedDB's structured clone
  // rejects. Database is plain JSON data by design, so a JSON round-trip
  // is a safe way to get a plain object.
  await set(DB_KEY, JSON.parse(JSON.stringify(db)) as Database)
}

// Debounced write for settings changes. The object is cloned at flush time,
// so the latest state wins even when the same object was mutated meanwhile.
export function saveDatabaseDebounced(db: Database, onError: (error: unknown) => void): void {
  clearTimeout(saveTimer)
  pendingSave = { db, onError }
  saveTimer = setTimeout(flushPendingSave, SAVE_DEBOUNCE_MS)
}

// Writes a still-pending debounced save immediately. Registered on
// 'pagehide' and on visibilitychange so leaving the page cannot drop it.
export function flushPendingSave(): void {
  if (!pendingSave) return
  const { db, onError } = pendingSave
  saveDatabase(db).catch(onError)
}

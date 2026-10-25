// Persistence of the single `spritverbrauch:db` document (SPEC.md section 5)
// plus its synchronisation with the app's own document store on the Pi
// (server/index.ts, reached through the hub at `<BASE_URL>api/docs/db`).
// Server sync is outside SPEC v1; Julian granted an explicit exception on
// 2026-10-25 for exactly this: a small backend in this repo, syncing the
// Database document there, IndexedDB as the local copy.
//
// Local write paths are unchanged: cars/entries changes are written
// immediately via saveDatabase(); only settings changes (color picker
// dragging) go through the 300 ms debounce. flushPendingSave() writes a
// still-pending debounced save when the page is being left.
//
// Sync rules (Home-Dashboard/docs/app-integration.md section 4):
// - Load: IndexedDB first (rendered immediately), then the server. The server
//   wins when it has data; when the server has nothing yet and the browser
//   does, the local copy is pushed once with rev 0. Unsent local changes from
//   an earlier session (`pending`) are pushed before pulling.
// - Save: local first, then a debounced PUT { data, rev }. 409 means another
//   device wrote in between: the server state is adopted, no merge.
// - Offline or server unreachable: the change stays marked pending in
//   IndexedDB and is retried when the browser comes back online, when the
//   page becomes visible again, and with the next save.
// - 401 means the hub session expired; the store sends the user to the login.
// Errors are NOT swallowed here — callers catch them and surface a snackbar
// via the store.
import { get, set } from 'idb-keyval'
import type { Database } from '../domain/types'

const DB_KEY = 'spritverbrauch:db'
// Revision of the server document this browser last saw, and whether local
// changes still wait to be sent. Kept next to the data, in its own key, so
// the Database document itself keeps the SPEC shape.
const SYNC_KEY = 'spritverbrauch:sync'
const SAVE_DEBOUNCE_MS = 300
const PUSH_DEBOUNCE_MS = 500
const DOC_URL = `${import.meta.env.BASE_URL}api/docs/db`

type SyncState = { rev: number; pending: boolean }

export type SyncEvent =
  // Server state adopted (initial load, or newer state found on the server).
  | { type: 'remote'; db: Database }
  // Another device wrote in between; the server state replaced the local one.
  | { type: 'conflict'; db: Database }
  // The hub session has expired.
  | { type: 'unauthorized' }
  // The server could not be reached; the change stays pending.
  | { type: 'offline' }

let saveTimer: ReturnType<typeof setTimeout> | undefined
let pendingSave: { db: Database; onError: (error: unknown) => void } | null = null

let rev = 0
let pending = false
let lastLocal: Database | null = null
let queuedPush: Database | null = null
let pushTimer: ReturnType<typeof setTimeout> | undefined
let pushing = false
let offlineNotified = false
let listenersInstalled = false
let onSyncEvent: ((event: SyncEvent) => void) | undefined

// The store registers once, before loadDatabase(), to replace its state when
// the server state arrives and to show the related snackbars.
export function subscribeSync(listener: (event: SyncEvent) => void): void {
  onSyncEvent = listener
}

function emit(event: SyncEvent): void {
  onSyncEvent?.(event)
}

function toPlain(db: Database): Database {
  // The store passes a reactive proxy, which IndexedDB's structured clone
  // rejects. Database is plain JSON data by design, so a JSON round-trip
  // is a safe way to get a plain object.
  return JSON.parse(JSON.stringify(db)) as Database
}

function writeSyncState(): Promise<void> {
  return set(SYNC_KEY, { rev, pending } satisfies SyncState)
}

export async function loadDatabase(): Promise<Database | null> {
  const [local, sync] = await Promise.all([get<Database>(DB_KEY), get<SyncState>(SYNC_KEY)])
  rev = sync?.rev ?? 0
  pending = sync?.pending ?? false
  lastLocal = local ?? null
  installListeners()
  // Not awaited: the UI renders the local copy right away, the server state
  // arrives through the 'remote' event.
  void pullFromServer()
  return lastLocal
}

// Immediate write of the whole document. Cancels a pending debounced save,
// because the full document is persisted anyway.
export async function saveDatabase(db: Database): Promise<void> {
  clearTimeout(saveTimer)
  pendingSave = null
  const plain = toPlain(db)
  lastLocal = plain
  // Queued before the IndexedDB write so flushPendingSave() on pagehide can
  // send it immediately.
  schedulePush(plain)
  await set(DB_KEY, plain)
}

// Debounced write for settings changes. The object is cloned at flush time,
// so the latest state wins even when the same object was mutated meanwhile.
export function saveDatabaseDebounced(db: Database, onError: (error: unknown) => void): void {
  clearTimeout(saveTimer)
  pendingSave = { db, onError }
  saveTimer = setTimeout(flushPendingSave, SAVE_DEBOUNCE_MS)
}

// Writes a still-pending debounced save immediately and sends a queued push
// right away. Registered on 'pagehide' and on visibilitychange so leaving
// the page cannot drop it.
export function flushPendingSave(): void {
  if (pendingSave) {
    const { db, onError } = pendingSave
    saveDatabase(db).catch(onError)
  }
  if (queuedPush) void pushNow({ keepalive: true })
}

function installListeners(): void {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true
  window.addEventListener('online', retryPending)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) retryPending()
  })
}

function retryPending(): void {
  if (pending && !queuedPush && lastLocal) queuedPush = lastLocal
  if (queuedPush) void pushNow()
}

function schedulePush(db: Database): void {
  queuedPush = db
  if (!pending) {
    pending = true
    void writeSyncState()
  }
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => void pushNow(), PUSH_DEBOUNCE_MS)
}

async function pullFromServer(): Promise<void> {
  if (pending && lastLocal) {
    // Unsent changes from the last session go out first; a 409 then brings
    // the server state in, exactly like a conflict while saving.
    queuedPush = lastLocal
    await pushNow()
    return
  }
  let response: Response
  try {
    response = await fetch(DOC_URL, { headers: { Accept: 'application/json' } })
  } catch {
    return // offline: keep working with the local copy
  }
  if (response.status === 401) {
    emit({ type: 'unauthorized' })
    return
  }
  if (response.status === 404) {
    // Nothing on the server yet (first start, or migrated/imported data that
    // only exists in this browser): seed it with the local copy.
    if (lastLocal) {
      rev = 0
      schedulePush(lastLocal)
    }
    return
  }
  if (!response.ok) return
  const body = (await response.json()) as { data: Database; rev: number }
  if (body.rev === rev && lastLocal) return
  await adoptServerState(body.data, body.rev)
  emit({ type: 'remote', db: body.data })
}

async function adoptServerState(db: Database, serverRev: number): Promise<void> {
  clearTimeout(pushTimer)
  queuedPush = null
  rev = serverRev
  pending = false
  lastLocal = db
  await set(DB_KEY, db)
  await writeSyncState()
}

async function pushNow(options: { keepalive?: boolean } = {}): Promise<void> {
  clearTimeout(pushTimer)
  if (pushing || !queuedPush) return
  const db = queuedPush
  queuedPush = null
  pushing = true
  try {
    const response = await fetch(DOC_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ data: db, rev }),
      keepalive: options.keepalive ?? false,
    })
    if (response.status === 401) {
      queuedPush ??= db
      emit({ type: 'unauthorized' })
      return
    }
    if (response.status === 409) {
      const body = (await response.json()) as { data: Database; rev: number }
      await adoptServerState(body.data, body.rev)
      emit({ type: 'conflict', db: body.data })
      return
    }
    if (!response.ok) throw new Error(`PUT ${DOC_URL} failed with HTTP ${response.status}`)
    const body = (await response.json()) as { rev: number }
    rev = body.rev
    offlineNotified = false
    if (!queuedPush) {
      pending = false
      await writeSyncState()
    }
  } catch {
    // Network error or server error: the change stays pending and is retried
    // later (online event, page visible again, next save).
    queuedPush ??= db
    if (!offlineNotified) {
      offlineNotified = true
      emit({ type: 'offline' })
    }
  } finally {
    pushing = false
  }
  // A save that arrived while the request was in flight goes out next.
  if (queuedPush && !offlineNotified) void pushNow()
}

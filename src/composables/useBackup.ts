// Export and import orchestration, shared by the drawer, the settings view,
// and the no-cars empty state. The dialog state is module-level so every
// entry point drives the same dialogs, which are rendered once in
// BackupDialogs.vue.
import { reactive } from 'vue'
import type { Database } from '../domain/types'
import { exportBackup } from '../domain/exporter'
import { importBackup } from '../domain/importer'
import { todayLocalDate } from '../domain/format'
import { useAppStore } from '../store/app'
import { strings } from '../strings'

interface PendingImport {
  database: Database
  formatLabel: string
  cars: number
  entries: number
  excluded: number
}

interface ImportResultInfo {
  cars: number
  entries: number
  excluded: number
}

const state = reactive({
  pending: null as PendingImport | null,
  result: null as ImportResultInfo | null,
  error: null as string | null,
})

// Creates the backup file and hands it to the Web Share API where available
// (Android PWA), otherwise triggers a plain download. Must be called from a
// user gesture — navigator.share requires transient activation.
async function startExport(): Promise<void> {
  const store = useAppStore()
  const json = JSON.stringify(exportBackup(store.database), null, 2)
  const filename = `spritverbrauch-backup-${todayLocalDate()}.json`
  const file = new File([json], filename, { type: 'application/json' })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
    } catch (error) {
      // Closing the share sheet is a cancel, not an export.
      if (error instanceof DOMException && error.name === 'AbortError') return
      downloadFile(file)
    }
  } else {
    downloadFile(file)
  }
  store.markExported(new Date().toISOString())
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = file.name
  anchor.click()
  // Revoke only after the download has had time to start.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

function startImport(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,application/json'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (file) void readImportFile(file)
  })
  input.click()
}

// Parsing failures only set the error message — the current data stays
// untouched until the user confirms the pending import.
async function readImportFile(file: File): Promise<void> {
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    state.error = strings.importReadError
    return
  }
  try {
    const { database, stats } = importBackup(raw)
    state.pending = {
      database,
      formatLabel: hasVersionField(raw)
        ? strings.importFormatOwn
        : strings.importFormatReference,
      ...stats,
    }
  } catch (error) {
    state.error = error instanceof Error ? error.message : strings.importUnknownError
  }
}

// Same format detection the importer uses (SPEC 6.2), only for the label.
function hasVersionField(raw: unknown): boolean {
  return typeof raw === 'object' && raw !== null && 'version' in raw
}

function confirmImport(): void {
  if (!state.pending) return
  const { database, cars, entries, excluded } = state.pending
  useAppStore().replaceDatabase(database)
  state.pending = null
  state.result = { cars, entries, excluded }
}

function cancelImport(): void {
  state.pending = null
}

function dismissResult(): void {
  state.result = null
}

function dismissError(): void {
  state.error = null
}

export function useBackup() {
  return { state, startExport, startImport, confirmImport, cancelImport, dismissResult, dismissError }
}

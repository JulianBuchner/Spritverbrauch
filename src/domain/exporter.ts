// Writes the app's own backup format (SPEC.md section 6.1).
import type { Database } from './types'

export function exportBackup(db: Database): Database {
  return { ...db, exportedAt: new Date().toISOString() }
}

export interface Car {
  id: string // UUID (crypto.randomUUID())
  name: string // not empty
  position: number // order in the sidebar, 0-based, gapless
  isDefault: boolean // at most one car is true
}

export interface Entry {
  id: string // UUID
  carId: string
  date: string // 'YYYY-MM-DD', local calendar date, no time of day
  tripKm: number // integer, >= 0
  liters: number // >= 0, at most 3 decimal places
  costCents: number // integer, >= 0
  isFull: boolean
  countInStats: boolean
  note: string // '' allowed
}

export interface Settings {
  themeMode: 'light' | 'dark' | 'system'
  seedColor: string // '#RRGGBB'
  lastExportedAt?: string // ISO-8601, absent until the first export; additive, version stays 1
}

export interface Database {
  version: 1
  exportedAt: string // ISO-8601
  settings: Settings
  cars: Car[]
  entries: Entry[]
}

export function createEmptyDatabase(): Database {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: { themeMode: 'system', seedColor: '#3159BD' },
    cars: [],
    entries: [],
  }
}

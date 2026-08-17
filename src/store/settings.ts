import { defineStore } from 'pinia'
import type { Settings } from '../domain/types'

// Default settings per SPEC.md section 5.
export const DEFAULT_SEED_COLOR = '#3159BD'

// In-memory only for now; persistence to IndexedDB comes in a later subtask.
export const useSettingsStore = defineStore('settings', {
  state: (): Settings => ({
    themeMode: 'system',
    seedColor: DEFAULT_SEED_COLOR,
  }),
})

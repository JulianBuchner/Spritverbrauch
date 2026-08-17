import { describe, expect, it } from 'vitest'
import { exportBackup } from './exporter'
import { createEmptyDatabase } from './types'
import type { Database } from './types'

describe('exportBackup', () => {
  it('sets a fresh ISO-8601 exportedAt and keeps everything else', () => {
    const db: Database = createEmptyDatabase()
    db.exportedAt = '2020-01-01T00:00:00.000Z'
    db.cars = [{ id: 'car-1', name: 'Golf 7', position: 0, isDefault: true }]
    db.entries = [
      {
        id: 'entry-1',
        carId: 'car-1',
        date: '2026-08-06',
        tripKm: 268,
        liters: 15.01,
        costCents: 3000,
        isFull: true,
        countInStats: true,
        note: '',
      },
    ]

    const exported = exportBackup(db)

    expect(exported.version).toBe(1)
    expect(exported.exportedAt).not.toBe('2020-01-01T00:00:00.000Z')
    expect(Number.isNaN(Date.parse(exported.exportedAt))).toBe(false)
    expect(exported.settings).toEqual(db.settings)
    expect(exported.cars).toEqual(db.cars)
    expect(exported.entries).toEqual(db.entries)
    // the input is not mutated
    expect(db.exportedAt).toBe('2020-01-01T00:00:00.000Z')
  })
})

describe('createEmptyDatabase (SPEC 5)', () => {
  it('creates the documented first-start state', () => {
    const db = createEmptyDatabase()
    expect(db.version).toBe(1)
    expect(db.cars).toEqual([])
    expect(db.entries).toEqual([])
    expect(db.settings).toEqual({ themeMode: 'system', seedColor: '#3159BD' })
    expect(Number.isNaN(Date.parse(db.exportedAt))).toBe(false)
  })
})

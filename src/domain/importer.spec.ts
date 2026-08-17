import { describe, expect, it } from 'vitest'
import backupReference from './__fixtures__/backup-reference.json'
import { exportBackup } from './exporter'
import {
  formatCentsPer100,
  formatCentsPerLiter,
  formatKm,
  formatLPer100,
  formatLiters,
  formatMoney,
} from './format'
import { importBackup } from './importer'
import { carAverages, carSums, entryMetrics } from './stats'
import { createEmptyDatabase } from './types'
import type { Car, Database, Entry } from './types'

function carByName(db: Database, name: string): Car {
  const car = db.cars.find((candidate) => candidate.name === name)
  if (!car) throw new Error(`car not found: ${name}`)
  return car
}

function entriesOf(db: Database, carName: string): Entry[] {
  const car = carByName(db, carName)
  return db.entries.filter((entry) => entry.carId === car.id)
}

describe('importBackup — reference fixture, state A (SPEC 12.1)', () => {
  const { database, stats } = importBackup(backupReference)

  it('reports { cars: 2, entries: 71, excluded: 3 }', () => {
    expect(stats).toEqual({ cars: 2, entries: 71, excluded: 3 })
  })

  it('excludes exactly three entries, all belonging to Golf 7, none to Golf 5', () => {
    const excluded = database.entries.filter((entry) => !entry.countInStats)
    const golf7 = carByName(database, 'Golf 7')
    expect(excluded).toHaveLength(3)
    expect(excluded.every((entry) => entry.carId === golf7.id)).toBe(true)
    expect(
      excluded.map((entry) => [entry.tripKm, entry.liters, entry.costCents]),
    ).toEqual([
      [921, 50, 0],
      [0, 0, 4500],
      [0, 46.56, 9200],
    ])
  })

  it('Golf 7: 35 entries, 32 included, sums and averages as in SPEC 12.1', () => {
    const entries = entriesOf(database, 'Golf 7')
    const sums = carSums(entries)
    const averages = carAverages(entries)
    expect(averages.totalCount).toBe(35)
    expect(averages.includedCount).toBe(32)
    expect(formatKm(sums.km)).toBe('26.652')
    expect(formatLiters(sums.liters)).toBe('1.498,97')
    expect(formatMoney(sums.cents)).toBe('2.333,10')
    expect(formatLPer100(averages.litersPer100Km)).toBe('5,45')
    expect(formatCentsPer100(averages.centsPer100Km)).toBe('8,53')
    expect(formatCentsPerLiter(averages.centsPerLiter)).toBe('1,566')
  })

  it('Golf 5: 36 entries, 36 included, 6,66 l/100km — correct and expected', () => {
    const entries = entriesOf(database, 'Golf 5')
    const sums = carSums(entries)
    const averages = carAverages(entries)
    expect(averages.totalCount).toBe(36)
    expect(averages.includedCount).toBe(36)
    expect(formatKm(sums.km)).toBe('19.617')
    expect(formatLiters(sums.liters)).toBe('1.307,43')
    expect(formatMoney(sums.cents)).toBe('1.972,04')
    expect(formatLPer100(averages.litersPer100Km)).toBe('6,66')
    expect(formatCentsPer100(averages.centsPer100Km)).toBe('10,05')
    expect(formatCentsPerLiter(averages.centsPerLiter)).toBe('1,508')
  })

  it('sets isDefault on Golf 7 (newest entry), not on Golf 5 (position 0)', () => {
    expect(carByName(database, 'Golf 7').isDefault).toBe(true)
    expect(carByName(database, 'Golf 5').isDefault).toBe(false)
  })

  it('normalizes car positions to be gapless and assigns fresh UUIDs', () => {
    expect(carByName(database, 'Golf 5').position).toBe(0)
    expect(carByName(database, 'Golf 7').position).toBe(1)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    for (const car of database.cars) expect(car.id).toMatch(uuidPattern)
    for (const entry of database.entries) expect(entry.id).toMatch(uuidPattern)
  })
})

describe('state B — the 17 placeholder entries unchecked by hand (SPEC 12.2)', () => {
  // State B is produced by flipping the flags on the imported object itself,
  // NOT by any special rule in the importer.
  const { database } = importBackup(backupReference)
  const golf5 = carByName(database, 'Golf 5')
  const placeholders = database.entries.filter(
    (entry) => entry.carId === golf5.id && entry.tripKm === 500,
  )
  for (const entry of placeholders) entry.countInStats = false

  it('finds exactly 17 Golf 5 entries with the 500 km placeholder', () => {
    expect(placeholders).toHaveLength(17)
  })

  it('Golf 5: 19 of 36 included, sums unchanged, averages as in SPEC 12.2', () => {
    const entries = entriesOf(database, 'Golf 5')
    const sums = carSums(entries)
    const averages = carAverages(entries)
    expect(averages.totalCount).toBe(36)
    expect(averages.includedCount).toBe(19)
    expect(formatKm(sums.km)).toBe('19.617')
    expect(formatLiters(sums.liters)).toBe('1.307,43')
    expect(formatMoney(sums.cents)).toBe('1.972,04')
    expect(formatLPer100(averages.litersPer100Km)).toBe('5,92')
    expect(formatCentsPer100(averages.centsPer100Km)).toBe('9,98')
    expect(formatCentsPerLiter(averages.centsPerLiter)).toBe('1,685')
  })

  it('Golf 7 stays unchanged — it has no 500 km entries', () => {
    const averages = carAverages(entriesOf(database, 'Golf 7'))
    expect(averages.includedCount).toBe(32)
    expect(formatLPer100(averages.litersPer100Km)).toBe('5,45')
  })
})

describe('round trip: reference → own format → import (SPEC 12.3)', () => {
  it('yields identical statistics', () => {
    const first = importBackup(backupReference)
    const second = importBackup(exportBackup(first.database))
    expect(second.stats).toEqual(first.stats)
    for (const name of ['Golf 5', 'Golf 7']) {
      expect(carSums(entriesOf(second.database, name))).toEqual(
        carSums(entriesOf(first.database, name)),
      )
      expect(carAverages(entriesOf(second.database, name))).toEqual(
        carAverages(entriesOf(first.database, name)),
      )
    }
  })
})

describe('value mapping (SPEC 6.2, 12.3)', () => {
  const { database } = importBackup(backupReference)

  it('rounds float32 liter artifacts to 3 decimals: 43.2400016784668 → 43.24', () => {
    const entry = entriesOf(database, 'Golf 5').find((candidate) => candidate.date === '2020-06-08')
    expect(entry?.liters).toBe(43.24)
    expect(entry?.tripKm).toBe(500)
    expect(entry?.costCents).toBe(4000)
  })

  it('rounds float32 price artifacts to integer cents: 60.0099983215332 → 6001', () => {
    const entry = entriesOf(database, 'Golf 5').find((candidate) => candidate.date === '2021-12-20')
    expect(entry?.costCents).toBe(6001)
    expect(entry?.liters).toBe(43.96)
  })

  it('rounds 97.01000213623047 → 9701 cents', () => {
    const entry = entriesOf(database, 'Golf 7').find((candidate) => candidate.tripKm === 877)
    expect(entry?.costCents).toBe(9701)
  })

  it('keeps liters with three decimals: 27.229, 30.015, 33.538, 47.882', () => {
    const liters = database.entries.map((entry) => entry.liters)
    for (const expected of [27.229, 30.015, 33.538, 47.882]) {
      expect(liters).toContain(expected)
    }
  })

  it('shows the 268 km entry as 1,999 €/l, not 2,00 (SPEC 12.3)', () => {
    const entry = entriesOf(database, 'Golf 7').find((candidate) => candidate.tripKm === 268)
    if (!entry) throw new Error('268 km entry not found')
    expect(formatCentsPerLiter(entryMetrics(entry).centsPerLiter)).toBe('1,999')
  })

  it('maps missing note text to an empty string', () => {
    expect(database.entries.every((entry) => typeof entry.note === 'string')).toBe(true)
  })
})

describe('timezone handling (SPEC 12.3, TZ=Europe/Vienna)', () => {
  it('runs under Europe/Vienna', () => {
    expect(process.env.TZ).toBe('Europe/Vienna')
    expect(new Date(1591659000000).getTimezoneOffset()).toBe(-120) // CEST
    expect(new Date(1609459140000).getTimezoneOffset()).toBe(-60) // CET
  })

  it('converts epoch ms to the local calendar date, without UTC truncation', () => {
    const { database } = importBackup({
      cars: [{ id: 1, name: 'TZ', position: 0, km: -1 }],
      fuelEntries: [
        { id: 1, carId: 1, km: 100, liter: 10, price: 20, date: 1591574400000, isFull: true, text: '' },
        // 2020-06-08 23:30 UTC is already 2020-06-09 in Vienna
        { id: 2, carId: 1, km: 100, liter: 10, price: 20, date: 1591659000000, isFull: true, text: '' },
        // 2020-12-31 23:59 UTC crosses the year boundary in Vienna
        { id: 3, carId: 1, km: 100, liter: 10, price: 20, date: 1609459140000, isFull: true, text: '' },
      ],
    })
    expect(database.entries.map((entry) => entry.date)).toEqual([
      '2020-06-08',
      '2020-06-09',
      '2021-01-01',
    ])
  })
})

describe('empty data sets (SPEC 12.3)', () => {
  it('imports an empty own-format database without crashing', () => {
    const { database, stats } = importBackup(createEmptyDatabase())
    expect(stats).toEqual({ cars: 0, entries: 0, excluded: 0 })
    expect(database.cars).toEqual([])
    expect(database.entries).toEqual([])
  })

  it('imports a reference backup without entries: default car is position 0', () => {
    const { database, stats } = importBackup({
      cars: [
        { id: 7, name: 'Zweitwagen', position: 5, km: -1 },
        { id: 3, name: 'Erstwagen', position: 2, km: -1 },
      ],
      fuelEntries: [],
    })
    expect(stats).toEqual({ cars: 2, entries: 0, excluded: 0 })
    // sorted by original position, then normalized to be gapless
    expect(database.cars.map((car) => [car.name, car.position, car.isDefault])).toEqual([
      ['Erstwagen', 0, true],
      ['Zweitwagen', 1, false],
    ])
  })

  it('imports a fully empty reference backup', () => {
    const { stats } = importBackup({ cars: [], fuelEntries: [] })
    expect(stats).toEqual({ cars: 0, entries: 0, excluded: 0 })
  })
})

describe('own-format backup with the optional lastExportedAt settings field', () => {
  // The importer is unchanged in subtask 6: it only reads themeMode and
  // seedColor, so the stamp of the exporting installation is not carried
  // over — the freshly imported dataset has never been exported.
  it('imports cleanly and does not carry the stamp over', () => {
    const db = createEmptyDatabase()
    const withStamp = {
      ...db,
      settings: { ...db.settings, lastExportedAt: '2026-08-17T12:30:00.000Z' },
    }
    const { database, stats } = importBackup(withStamp)
    expect(stats).toEqual({ cars: 0, entries: 0, excluded: 0 })
    expect(database.settings.themeMode).toBe('system')
    expect(database.settings.lastExportedAt).toBeUndefined()
  })
})

describe('invalid input throws a UI-displayable error (SPEC 6, prompt 01)', () => {
  it.each([null, undefined, 42, 'text', []])('rejects %j', (raw) => {
    expect(() => importBackup(raw)).toThrow()
  })

  it('rejects an object that is neither own nor reference format', () => {
    expect(() => importBackup({ foo: 'bar' })).toThrow(/Unbekanntes Dateiformat/)
  })

  it('rejects an unsupported own-format version', () => {
    expect(() => importBackup({ version: 2 })).toThrow(/Version/)
  })

  it('rejects an own-format backup with a broken entry instead of dropping it', () => {
    const database = createEmptyDatabase()
    const broken = {
      ...database,
      entries: [{ id: 'x', carId: 'y', date: 'kein-datum' }],
    }
    expect(() => importBackup(broken)).toThrow(/Eintrag 1/)
  })

  it('rejects a reference entry with a missing field instead of dropping it', () => {
    expect(() =>
      importBackup({
        cars: [{ id: 1, name: 'Golf', position: 0, km: -1 }],
        fuelEntries: [{ id: 1, carId: 1, liter: 10, price: 20, date: 0, isFull: true, text: '' }],
      }),
    ).toThrow(/Eintrag 1/)
  })

  it('rejects a reference entry pointing to an unknown car', () => {
    expect(() =>
      importBackup({
        cars: [{ id: 1, name: 'Golf', position: 0, km: -1 }],
        fuelEntries: [
          { id: 1, carId: 99, km: 100, liter: 10, price: 20, date: 0, isFull: true, text: '' },
        ],
      }),
    ).toThrow(/unbekanntes Fahrzeug/)
  })
})

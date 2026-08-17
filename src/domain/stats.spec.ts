import { describe, expect, it } from 'vitest'
import { formatCentsPer100, formatCentsPerLiter, formatLPer100 } from './format'
import { carAverages, carSums, entryMetrics, sortEntriesForDisplay } from './stats'
import type { Entry } from './types'

function makeEntry(overrides: Partial<Entry>): Entry {
  return {
    id: 'entry',
    carId: 'car',
    date: '2026-01-01',
    tripKm: 0,
    liters: 0,
    costCents: 0,
    isFull: true,
    countInStats: true,
    note: '',
    ...overrides,
  }
}

describe('carSums (SPEC 7.1)', () => {
  it('sums over ALL entries, including those with countInStats === false', () => {
    const entries = [
      makeEntry({ tripKm: 100, liters: 10, costCents: 2000 }),
      makeEntry({ tripKm: 200, liters: 20, costCents: 3000, countInStats: false }),
    ]
    expect(carSums(entries)).toEqual({ km: 300, liters: 30, cents: 5000 })
  })

  it('returns zeros for an empty list', () => {
    expect(carSums([])).toEqual({ km: 0, liters: 0, cents: 0 })
  })
})

describe('carAverages (SPEC 7.2)', () => {
  it('computes a ratio of sums, not a mean of per-entry values', () => {
    const entries = [
      makeEntry({ tripKm: 100, liters: 10, costCents: 1000 }),
      makeEntry({ tripKm: 300, liters: 15, costCents: 2000 }),
    ]
    const averages = carAverages(entries)
    // mean of per-entry values would be 7.5 l/100km
    expect(averages.litersPer100Km).toBe(6.25)
    expect(averages.centsPer100Km).toBe(750)
    expect(averages.centsPerLiter).toBe(120)
  })

  it('only includes entries with countInStats === true', () => {
    const entries = [
      makeEntry({ tripKm: 100, liters: 10, costCents: 1000 }),
      makeEntry({ tripKm: 900, liters: 90, costCents: 9000, countInStats: false }),
    ]
    const averages = carAverages(entries)
    expect(averages.litersPer100Km).toBe(10)
    expect(averages.includedCount).toBe(1)
    expect(averages.totalCount).toBe(2)
  })

  it('returns null when a denominator is 0, never Infinity or NaN', () => {
    const entries = [makeEntry({ tripKm: 0, liters: 0, costCents: 4500 })]
    const averages = carAverages(entries)
    expect(averages.litersPer100Km).toBeNull()
    expect(averages.centsPer100Km).toBeNull()
    expect(averages.centsPerLiter).toBeNull()
  })

  it('handles an empty list without crashing: all null, counts 0', () => {
    const averages = carAverages([])
    expect(averages).toEqual({
      litersPer100Km: null,
      centsPer100Km: null,
      centsPerLiter: null,
      includedCount: 0,
      totalCount: 0,
    })
  })
})

describe('entryMetrics (SPEC 7.3)', () => {
  it('matches the entry card example from SPEC 9.2 (268 km / 15,01 l / 30,00 €)', () => {
    const metrics = entryMetrics(makeEntry({ tripKm: 268, liters: 15.01, costCents: 3000 }))
    expect(formatLPer100(metrics.litersPer100Km)).toBe('5,60')
    expect(formatCentsPer100(metrics.centsPer100Km)).toBe('11,19')
    expect(formatCentsPerLiter(metrics.centsPerLiter)).toBe('1,999')
  })

  it('returns null for every metric of the 0 km / 0 l / 45 € entry (SPEC 12.3)', () => {
    const metrics = entryMetrics(makeEntry({ tripKm: 0, liters: 0, costCents: 4500 }))
    expect(metrics.litersPer100Km).toBeNull()
    expect(metrics.centsPer100Km).toBeNull()
    expect(metrics.centsPerLiter).toBeNull()
  })

  it('computes metrics for excluded entries too, when computable', () => {
    const metrics = entryMetrics(
      makeEntry({ tripKm: 921, liters: 50, costCents: 0, countInStats: false }),
    )
    expect(metrics.litersPer100Km).toBeCloseTo(5.4289, 3)
    expect(metrics.centsPer100Km).toBe(0)
    expect(metrics.centsPerLiter).toBe(0)
  })
})

describe('sortEntriesForDisplay (SPEC 9.2)', () => {
  it('sorts date descending; a later-inserted 2021 entry lands chronologically, not on top', () => {
    const entries = [
      makeEntry({ id: 'a', date: '2023-05-01' }),
      makeEntry({ id: 'b', date: '2020-06-08' }),
      makeEntry({ id: 'c', date: '2022-01-15' }),
      makeEntry({ id: 'd', date: '2022-01-15' }),
      makeEntry({ id: 'e', date: '2021-03-10' }), // inserted after the fact
    ]
    const sorted = sortEntriesForDisplay(entries)
    // stable: c stays before d despite the equal date
    expect(sorted.map((entry) => entry.id)).toEqual(['a', 'c', 'd', 'e', 'b'])
  })

  it('does not mutate the input array', () => {
    const entries = [makeEntry({ id: 'a', date: '2020-01-01' }), makeEntry({ id: 'b', date: '2021-01-01' })]
    sortEntriesForDisplay(entries)
    expect(entries.map((entry) => entry.id)).toEqual(['a', 'b'])
  })
})

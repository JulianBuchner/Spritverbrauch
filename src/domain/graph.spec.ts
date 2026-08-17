import { describe, expect, it } from 'vitest'
import backupReference from './__fixtures__/backup-reference.json'
import { formatCentsPerLiter } from './format'
import { GRAPH_METRICS, graphPoints, isDerivedMetric } from './graph'
import { importBackup } from './importer'
import type { Database, Entry } from './types'

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

function entriesOf(db: Database, carName: string): Entry[] {
  const car = db.cars.find((candidate) => candidate.name === carName)
  if (!car) throw new Error(`car not found: ${carName}`)
  return db.entries.filter((entry) => entry.carId === car.id)
}

const { database } = importBackup(backupReference)
const golf7 = entriesOf(database, 'Golf 7')

describe('metric classification (SPEC 9.4)', () => {
  it('splits the six metrics into three raw and three derived', () => {
    expect(GRAPH_METRICS.filter((metric) => !isDerivedMetric(metric))).toEqual([
      'tripKm',
      'liters',
      'cost',
    ])
    expect(GRAPH_METRICS.filter(isDerivedMetric)).toEqual([
      'consumption',
      'costPer100Km',
      'costPerLiter',
    ])
  })
})

describe('graphPoints — raw metrics show ALL entries', () => {
  it('cost over Golf 7 yields 35 points, none null, including the 0 € entry', () => {
    const points = graphPoints(golf7, 'cost')
    expect(points).toHaveLength(35)
    expect(points.every((point) => point.value !== null)).toBe(true)
    expect(points.filter((point) => point.value === 0)).toHaveLength(1)
  })

  it('cost values are integer cents', () => {
    const points = graphPoints(golf7, 'cost')
    expect(points.every((point) => Number.isInteger(point.value))).toBe(true)
  })

  it('tripKm and liters return the raw entry fields', () => {
    const entries = [makeEntry({ date: '2026-03-01', tripKm: 268, liters: 15.01, costCents: 3000 })]
    expect(graphPoints(entries, 'tripKm')[0].value).toBe(268)
    expect(graphPoints(entries, 'liters')[0].value).toBe(15.01)
  })
})

describe('graphPoints — derived metrics gap out excluded entries', () => {
  it('consumption over Golf 7 has exactly 3 gaps, at the three excluded entries', () => {
    const points = graphPoints(golf7, 'consumption')
    expect(points).toHaveLength(35)
    const gapDates = points.filter((point) => point.value === null).map((point) => point.date)
    const excludedDates = golf7
      .filter((entry) => !entry.countInStats)
      .map((entry) => entry.date)
      .sort()
    expect(gapDates).toHaveLength(3)
    expect(gapDates).toEqual(excludedDates)
  })

  it('an excluded entry stays null even when its metric would be computable', () => {
    const entries = [
      makeEntry({ tripKm: 500, liters: 40, costCents: 6000, countInStats: false }),
    ]
    expect(graphPoints(entries, 'consumption')[0].value).toBeNull()
    expect(graphPoints(entries, 'costPer100Km')[0].value).toBeNull()
    expect(graphPoints(entries, 'costPerLiter')[0].value).toBeNull()
  })

  it('an included entry with a zero denominator yields null, never Infinity or NaN', () => {
    const entries = [makeEntry({ tripKm: 0, liters: 0, costCents: 4500, countInStats: true })]
    expect(graphPoints(entries, 'consumption')[0].value).toBeNull()
    expect(graphPoints(entries, 'costPer100Km')[0].value).toBeNull()
    expect(graphPoints(entries, 'costPerLiter')[0].value).toBeNull()
  })

  it('costPerLiter of the 268 km / 15,01 l / 30,00 € entry formats as 1,999', () => {
    const points = graphPoints(golf7, 'costPerLiter')
    const entry = golf7.find((candidate) => candidate.tripKm === 268 && candidate.liters === 15.01)
    if (!entry) throw new Error('fixture entry not found')
    const point = points.find((candidate) => candidate.date === entry.date)
    if (!point) throw new Error('point not found')
    expect(formatCentsPerLiter(point.value)).toBe('1,999')
  })
})

describe('graphPoints — ordering and dates', () => {
  it('sorts date ascending', () => {
    const points = graphPoints(golf7, 'cost')
    const dates = points.map((point) => point.date)
    expect(dates).toEqual([...dates].sort())
  })

  it('is stable for entries with the same date', () => {
    const entries = [
      makeEntry({ id: 'b', date: '2026-05-01', tripKm: 2 }),
      makeEntry({ id: 'a', date: '2026-04-01', tripKm: 1 }),
      makeEntry({ id: 'c', date: '2026-05-01', tripKm: 3 }),
    ]
    expect(graphPoints(entries, 'tripKm').map((point) => point.value)).toEqual([1, 2, 3])
  })

  it('dateMs is the local midnight of the calendar date', () => {
    const entries = [makeEntry({ date: '2020-06-09' })]
    expect(graphPoints(entries, 'tripKm')[0].dateMs).toBe(new Date(2020, 5, 9).getTime())
  })

  it('returns an empty array for no entries', () => {
    expect(graphPoints([], 'consumption')).toEqual([])
  })
})

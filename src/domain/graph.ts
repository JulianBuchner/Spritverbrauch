// Data preparation for the graph view (SPEC.md section 9.4).
import type { Entry } from './types'
import { entryMetrics } from './stats'

// Menu order of the six metrics.
export const GRAPH_METRICS = [
  'tripKm',
  'liters',
  'cost',
  'consumption',
  'costPer100Km',
  'costPerLiter',
] as const

export type GraphMetric = (typeof GRAPH_METRICS)[number]

// Raw metrics plot every entry; derived metrics only plot entries with
// countInStats === true and leave a gap (null) for all others.
export function isDerivedMetric(metric: GraphMetric): boolean {
  return metric === 'consumption' || metric === 'costPer100Km' || metric === 'costPerLiter'
}

export interface GraphPoint {
  date: string // 'YYYY-MM-DD'
  dateMs: number // local midnight epoch ms, for the chart's time axis
  value: number | null // money values are cents, like everywhere else
}

function localDateToEpochMs(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).getTime()
}

function metricValue(entry: Entry, metric: GraphMetric): number | null {
  switch (metric) {
    case 'tripKm':
      return entry.tripKm
    case 'liters':
      return entry.liters
    case 'cost':
      return entry.costCents
    case 'consumption':
      return entry.countInStats ? entryMetrics(entry).litersPer100Km : null
    case 'costPer100Km':
      return entry.countInStats ? entryMetrics(entry).centsPer100Km : null
    case 'costPerLiter':
      return entry.countInStats ? entryMetrics(entry).centsPerLiter : null
  }
}

// One point per entry, date ascending; stable, so entries with the same date
// keep their order. Non-plottable values are null, never 0 or NaN.
export function graphPoints(entries: Entry[], metric: GraphMetric): GraphPoint[] {
  return [...entries]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((entry) => ({
      date: entry.date,
      dateMs: localDateToEpochMs(entry.date),
      value: metricValue(entry, metric),
    }))
}

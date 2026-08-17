// Sums and averages over a car's entries (SPEC.md section 7).
import type { Entry } from './types'

// Sums run over ALL entries of the car, regardless of countInStats.
export function carSums(entries: Entry[]): { km: number; liters: number; cents: number } {
  let km = 0
  let liters = 0
  let cents = 0
  for (const entry of entries) {
    km += entry.tripKm
    liters += entry.liters
    cents += entry.costCents
  }
  return { km, liters, cents }
}

// Averages run only over entries with countInStats === true, as a ratio of
// sums (not a mean of per-entry values). A zero denominator yields null.
export function carAverages(entries: Entry[]): {
  litersPer100Km: number | null
  centsPer100Km: number | null
  centsPerLiter: number | null
  includedCount: number
  totalCount: number
} {
  const included = entries.filter((entry) => entry.countInStats)
  const { km, liters, cents } = carSums(included)
  return {
    litersPer100Km: km === 0 ? null : (liters / km) * 100,
    centsPer100Km: km === 0 ? null : (cents / km) * 100,
    centsPerLiter: liters === 0 ? null : cents / liters,
    includedCount: included.length,
    totalCount: entries.length,
  }
}

// Per-entry metrics depend only on the entry's own three fields and are also
// shown for entries with countInStats === false, when computable.
export function entryMetrics(entry: Entry): {
  litersPer100Km: number | null
  centsPer100Km: number | null
  centsPerLiter: number | null
} {
  return {
    litersPer100Km: entry.tripKm === 0 ? null : (entry.liters / entry.tripKm) * 100,
    centsPer100Km: entry.tripKm === 0 ? null : (entry.costCents / entry.tripKm) * 100,
    centsPerLiter: entry.liters === 0 ? null : entry.costCents / entry.liters,
  }
}

// Date descending; stable, so entries with the same date keep their order.
export function sortEntriesForDisplay(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

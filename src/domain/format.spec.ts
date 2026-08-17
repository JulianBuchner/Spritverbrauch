import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  formatCentsPer100,
  formatCentsPerLiter,
  formatEntryDate,
  formatKm,
  formatLPer100,
  formatLiters,
  formatMoney,
  formatTimestamp,
  localCalendarDate,
  todayLocalDate,
} from './format'

// Examples straight from SPEC.md section 8.
describe('number formatters (SPEC 8)', () => {
  it('formats kilometers with 0 decimals and a period as thousands separator', () => {
    expect(formatKm(26652)).toBe('26.652')
    expect(formatKm(0)).toBe('0')
  })

  it('formats liters with 2 decimals', () => {
    expect(formatLiters(1498.97)).toBe('1.498,97')
    expect(formatLiters(15.01)).toBe('15,01')
  })

  it('formats money from integer cents with 2 decimals', () => {
    expect(formatMoney(233310)).toBe('2.333,10')
    expect(formatMoney(3000)).toBe('30,00')
    expect(formatMoney(0)).toBe('0,00')
  })

  it('formats l/100km with 2 decimals', () => {
    expect(formatLPer100(5.45)).toBe('5,45')
    expect(formatLPer100(5.449)).toBe('5,45')
  })

  it('formats €/100km from cents with 2 decimals', () => {
    expect(formatCentsPer100(853)).toBe('8,53')
  })

  it('formats €/l from cents with 3 decimals', () => {
    expect(formatCentsPerLiter(156.6)).toBe('1,566')
    expect(formatCentsPerLiter(200)).toBe('2,000')
    // SPEC 8: the 268 km / 15,01 l / 30,00 € entry is 1,999 €/l, not 2,00
    expect(formatCentsPerLiter(3000 / 15.01)).toBe('1,999')
  })

  it('renders null as an en dash (U+2013)', () => {
    expect(formatKm(null)).toBe('–')
    expect(formatLiters(null)).toBe('–')
    expect(formatMoney(null)).toBe('–')
    expect(formatLPer100(null)).toBe('–')
    expect(formatCentsPer100(null)).toBe('–')
    expect(formatCentsPerLiter(null)).toBe('–')
  })
})

describe('formatEntryDate (SPEC 8)', () => {
  it('omits the year when the date is in the year of today', () => {
    expect(formatEntryDate('2026-08-17', '2026-08-17')).toBe('17. August')
    expect(formatEntryDate('2026-08-06', '2026-08-17')).toBe('6. August')
  })

  it('shows the year when the date is in another year', () => {
    expect(formatEntryDate('2020-06-08', '2026-08-17')).toBe('8. Juni 2020')
    expect(formatEntryDate('2025-12-31', '2026-01-01')).toBe('31. Dezember 2025')
  })

  it('uses the Austrian month name Jänner, not Januar (SPEC 12.3)', () => {
    expect(formatEntryDate('2023-01-19', '2026-08-17')).toBe('19. Jänner 2023')
  })
})

describe('localCalendarDate (TZ=Europe/Vienna)', () => {
  it('uses the local calendar date, not the UTC date (SPEC 12.3 cases)', () => {
    // 2020-06-08 23:30 UTC is already 2020-06-09 in Vienna
    expect(localCalendarDate(new Date(1591659000000))).toBe('2020-06-09')
    // 2020-12-31 23:59 UTC is already 2021-01-01 in Vienna
    expect(localCalendarDate(new Date(1609459140000))).toBe('2021-01-01')
  })

  it('pads month and day to two digits', () => {
    expect(localCalendarDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('formatTimestamp (TZ=Europe/Vienna)', () => {
  it('formats an ISO timestamp as local date and time', () => {
    // 12:30 UTC in summer is 14:30 in Vienna (CEST)
    expect(formatTimestamp('2026-08-17T12:30:00.000Z')).toBe('17. August 2026, 14:30')
  })

  it('uses Jänner and the local calendar day across midnight', () => {
    // 23:30 UTC on Jan 5 is already Jan 6, 00:30 in Vienna (CET)
    expect(formatTimestamp('2026-01-05T23:30:00.000Z')).toBe('6. Jänner 2026, 00:30')
  })
})

describe('todayLocalDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the current local calendar date as YYYY-MM-DD', () => {
    vi.useFakeTimers()
    // 2020-12-31 23:59 UTC → already 2021-01-01 in Vienna
    vi.setSystemTime(new Date(1609459140000))
    expect(todayLocalDate()).toBe('2021-01-01')
  })
})

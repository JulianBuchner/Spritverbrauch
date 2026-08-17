// de-AT number and date formatting (SPEC.md section 8).
//
// CLDR gives de-AT a no-break space as grouping separator, but SPEC.md section 8
// demands the period (26.652), so the group parts are mapped to '.' explicitly.

const EN_DASH = '–'

function buildNumberFormatter(fractionDigits: number): (value: number) => string {
  const numberFormat = new Intl.NumberFormat('de-AT', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
  return (value) =>
    numberFormat
      .formatToParts(value)
      .map((part) => (part.type === 'group' ? '.' : part.value))
      .join('')
}

const formatWith0Decimals = buildNumberFormatter(0)
const formatWith2Decimals = buildNumberFormatter(2)
const formatWith3Decimals = buildNumberFormatter(3)

export function formatKm(value: number | null): string {
  return value === null ? EN_DASH : formatWith0Decimals(value)
}

export function formatLiters(value: number | null): string {
  return value === null ? EN_DASH : formatWith2Decimals(value)
}

export function formatMoney(cents: number | null): string {
  return cents === null ? EN_DASH : formatWith2Decimals(cents / 100)
}

export function formatLPer100(value: number | null): string {
  return value === null ? EN_DASH : formatWith2Decimals(value)
}

export function formatCentsPer100(cents: number | null): string {
  return cents === null ? EN_DASH : formatWith2Decimals(cents / 100)
}

// Three decimals: fuel prices are quoted with three, and two would lose
// information (1,999 €/l would show as 2,00). See SPEC.md section 8.
export function formatCentsPerLiter(cents: number | null): string {
  return cents === null ? EN_DASH : formatWith3Decimals(cents / 100)
}

// Local calendar date of a Date as 'YYYY-MM-DD' — no UTC truncation. Shared
// by the importer (epoch ms timestamps) and todayLocalDate().
export function localCalendarDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Today's local calendar date as 'YYYY-MM-DD'.
export function todayLocalDate(): string {
  return localCalendarDate(new Date())
}

const dateFormat = new Intl.DateTimeFormat('de-AT', { day: 'numeric', month: 'long' })
const dateFormatWithYear = new Intl.DateTimeFormat('de-AT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

// Both parameters are 'YYYY-MM-DD' strings. The year is only shown when the
// entry date is not in the year of `today`.
export function formatEntryDate(date: string, today: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  return date.slice(0, 4) === today.slice(0, 4)
    ? dateFormat.format(localDate)
    : dateFormatWithYear.format(localDate)
}

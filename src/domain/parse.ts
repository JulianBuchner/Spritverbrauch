// Parsing of entry-form input strings (SPEC.md section 9.3). Comma and point
// are both accepted as decimal separator and treated identically. Invalid or
// empty input yields null — the form shows an error, nothing is guessed.

function parseDecimal(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (!/^(\d+\.?\d*|\.\d+)$/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

// 'Gefahrene km': integer >= 0. No separators of any kind.
export function parseTripKmInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const value = Number(trimmed)
  return Number.isSafeInteger(value) ? value : null
}

// 'Getankte Liter': decimal >= 0. The data model allows at most 3 decimal
// places; excess digits are rounded.
export function parseLitersInput(raw: string): number | null {
  const value = parseDecimal(raw)
  return value === null ? null : Math.round(value * 1000) / 1000
}

// 'Bezahlter Gesamtpreis': decimal euros >= 0 -> integer cents.
export function parseCostInput(raw: string): number | null {
  const value = parseDecimal(raw)
  return value === null ? null : Math.round(value * 100)
}

// Prefill strings for the edit form. Deliberately without thousands
// separators — the parse functions above would read a point as decimal
// separator — and with the comma the user would type.
export function litersToInput(liters: number): string {
  return String(liters).replace('.', ',')
}

export function costCentsToInput(costCents: number): string {
  const euros = Math.trunc(costCents / 100)
  const cents = costCents % 100
  return cents === 0 ? String(euros) : `${euros},${String(cents).padStart(2, '0')}`
}

import { describe, expect, it } from 'vitest'
import {
  costCentsToInput,
  litersToInput,
  parseCostInput,
  parseLitersInput,
  parseTripKmInput,
} from './parse'

describe('parseCostInput', () => {
  it('treats comma and point identically: 2,20 and 2.20 are both 220 cents', () => {
    expect(parseCostInput('2,20')).toBe(220)
    expect(parseCostInput('2.20')).toBe(220)
  })

  it('converts euros to integer cents via Math.round', () => {
    expect(parseCostInput('30')).toBe(3000)
    expect(parseCostInput('30,00')).toBe(3000)
    expect(parseCostInput('1,999')).toBe(200)
    expect(parseCostInput('0')).toBe(0)
  })

  it('rejects empty, negative, and malformed input', () => {
    expect(parseCostInput('')).toBeNull()
    expect(parseCostInput('   ')).toBeNull()
    expect(parseCostInput('-5')).toBeNull()
    expect(parseCostInput('abc')).toBeNull()
    expect(parseCostInput('1,2,3')).toBeNull()
    expect(parseCostInput('1.2.3')).toBeNull()
    expect(parseCostInput('1 000')).toBeNull()
  })
})

describe('parseLitersInput', () => {
  it('accepts comma and point as decimal separator', () => {
    expect(parseLitersInput('15,01')).toBe(15.01)
    expect(parseLitersInput('15.01')).toBe(15.01)
    expect(parseLitersInput('46,56')).toBe(46.56)
  })

  it('keeps three decimal places and rounds anything beyond', () => {
    expect(parseLitersInput('27,229')).toBe(27.229)
    expect(parseLitersInput('43,2400016784668')).toBe(43.24)
  })

  it('accepts integers, a leading separator, and a trailing separator', () => {
    expect(parseLitersInput('40')).toBe(40)
    expect(parseLitersInput(',5')).toBe(0.5)
    expect(parseLitersInput('5,')).toBe(5)
    expect(parseLitersInput('0')).toBe(0)
  })

  it('rejects empty, negative, and malformed input', () => {
    expect(parseLitersInput('')).toBeNull()
    expect(parseLitersInput('-1,5')).toBeNull()
    expect(parseLitersInput('1,5l')).toBeNull()
  })
})

describe('parseTripKmInput', () => {
  it('accepts non-negative integers', () => {
    expect(parseTripKmInput('268')).toBe(268)
    expect(parseTripKmInput('0')).toBe(0)
    expect(parseTripKmInput(' 500 ')).toBe(500)
  })

  it('rejects decimals, separators, negatives, and non-numbers', () => {
    expect(parseTripKmInput('')).toBeNull()
    expect(parseTripKmInput('12,5')).toBeNull()
    expect(parseTripKmInput('12.5')).toBeNull()
    expect(parseTripKmInput('26.652')).toBeNull()
    expect(parseTripKmInput('-1')).toBeNull()
    expect(parseTripKmInput('1e3')).toBeNull()
  })
})

describe('prefill strings for the edit form', () => {
  it('renders liters with a comma and no thousands separator', () => {
    expect(litersToInput(15.01)).toBe('15,01')
    expect(litersToInput(27.229)).toBe('27,229')
    expect(litersToInput(500)).toBe('500')
  })

  it('renders cents as euros with a comma, whole euros without decimals', () => {
    expect(costCentsToInput(2999)).toBe('29,99')
    expect(costCentsToInput(3000)).toBe('30')
    expect(costCentsToInput(40)).toBe('0,40')
    expect(costCentsToInput(0)).toBe('0')
  })

  it('round-trips through the parse functions', () => {
    expect(parseLitersInput(litersToInput(43.24))).toBe(43.24)
    expect(parseCostInput(costCentsToInput(9701))).toBe(9701)
    expect(parseCostInput(costCentsToInput(3000))).toBe(3000)
  })
})

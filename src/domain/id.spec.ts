import { describe, expect, it } from 'vitest'
import { newId } from './id'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('newId', () => {
  it('produces lowercase RFC 4122 version-4 UUIDs', () => {
    for (let i = 0; i < 100; i++) expect(newId()).toMatch(UUID_V4)
  })

  it('does not repeat', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => newId()))
    expect(ids.size).toBe(1000)
  })
})

import { describe, expect, it } from 'vitest'

import { shouldOfferArchive } from './archive-affordance'

describe('shouldOfferArchive', () => {
  const base = { busy: false, idleMs: 10 * 60_000, isLastAssistant: true, isArchived: false }

  it('offers after the idle delay on the last assistant message', () => {
    expect(shouldOfferArchive(base)).toBe(true)
  })

  it('stays hidden while the turn is running', () => {
    expect(shouldOfferArchive({ ...base, busy: true })).toBe(false)
  })

  it('stays hidden before the idle delay', () => {
    expect(shouldOfferArchive({ ...base, idleMs: 60_000 })).toBe(false)
  })

  it('stays hidden on older messages', () => {
    expect(shouldOfferArchive({ ...base, isLastAssistant: false })).toBe(false)
  })

  it('stays hidden once the session is archived', () => {
    expect(shouldOfferArchive({ ...base, isArchived: true })).toBe(false)
  })
})

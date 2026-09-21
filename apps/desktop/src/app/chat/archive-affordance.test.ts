import { describe, expect, it } from 'vitest'

import { ARCHIVE_IDLE_MS, shouldOfferArchive } from './archive-affordance'

describe('shouldOfferArchive', () => {
  const base = { busy: false, idleMs: ARCHIVE_IDLE_MS, isLastAssistant: true, isArchived: false }

  it('offers as soon as the idle delay is reached on the last assistant message', () => {
    expect(shouldOfferArchive(base)).toBe(true)
  })

  it('stays hidden while the turn is running', () => {
    expect(shouldOfferArchive({ ...base, busy: true })).toBe(false)
  })

  it('stays hidden before the idle delay', () => {
    expect(shouldOfferArchive({ ...base, idleMs: ARCHIVE_IDLE_MS - 1 })).toBe(false)
  })

  it('stays hidden on older messages', () => {
    expect(shouldOfferArchive({ ...base, isLastAssistant: false })).toBe(false)
  })

  it('stays hidden once the session is archived', () => {
    expect(shouldOfferArchive({ ...base, isArchived: true })).toBe(false)
  })

  // The offer is worthless if the user has already moved on: the delay must stay
  // within the span of a person reading one reply, not minutes of work.
  it('waits seconds, not minutes, so a reader still sees the offer', () => {
    expect(ARCHIVE_IDLE_MS).toBeLessThanOrEqual(60_000)
    expect(ARCHIVE_IDLE_MS).toBeGreaterThan(0)
  })
})

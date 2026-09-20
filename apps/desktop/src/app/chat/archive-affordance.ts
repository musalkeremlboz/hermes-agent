/** Minutes of quiet before the archive affordance appears on a finished turn. */
export const ARCHIVE_IDLE_MS = 5 * 60_000

export interface ArchiveAffordanceInput {
  /** The session is mid-turn; never offer to archive live work. */
  busy: boolean
  /** Milliseconds since the last turn finished. */
  idleMs: number
  /** This is the newest assistant message in the thread. */
  isLastAssistant: boolean
  /** The session is already archived. */
  isArchived: boolean
}

/**
 * Pure predicate so the rule is testable without a renderer, and so the
 * component stays a thin binding over it. Archiving is a soft hide
 * (`session.set_hidden`): the transcript stays resumable, nothing is deleted.
 */
export function shouldOfferArchive(input: ArchiveAffordanceInput): boolean {
  if (input.busy || input.isArchived || !input.isLastAssistant) {return false}

  return input.idleMs >= ARCHIVE_IDLE_MS
}

import { useAuiState } from '@assistant-ui/react'
import { useStore } from '@nanostores/react'
import { type FC, useCallback, useEffect, useState } from 'react'

import { setSessionArchived } from '@/api/sessions'
import { ARCHIVE_IDLE_MS, shouldOfferArchive } from '@/app/chat/archive-affordance'
import { TooltipIconButton } from '@/components/assistant-ui/tooltip-icon-button'
import { Codicon } from '@/components/ui/codicon'
import { useI18n } from '@/i18n'
import { requestGatewayForProfile } from '@/store/gateway'
import { notifyError } from '@/store/notifications'
import { $activeProfile } from '@/store/profile'
import { $activeSessionId, $busy } from '@/store/session'

/** How often the idle clock ticks. Coarse on purpose: this is a 5-minute gate,
 *  not an animation, and a per-second interval on every finished turn is waste. */
const TICK_MS = 15_000

/**
 * Offers "archive this session" on the newest assistant message once the turn
 * has been quiet for ARCHIVE_IDLE_MS. Archiving soft-hides the session
 * (`session.set_hidden` under the hood): the transcript stays resumable and
 * nothing is deleted.
 *
 * The Jev closure hint only adds a "recommended" label. The button is fully
 * usable when the hint is missing, stale, or wrong — never gate it on the hint.
 */
export const ArchiveButton: FC = () => {
  const { t } = useI18n()
  const copy = t.assistant.thread
  const busy = useStore($busy)
  const sessionId = useStore($activeSessionId)
  const profile = useStore($activeProfile)
  // Newest message in the thread — the same read SettledChangedFiles uses, so
  // the affordance lands on the turn that just ended, not on every old reply.
  const isLastAssistant = useAuiState(
    s => s.thread.messages[s.thread.messages.length - 1]?.id === s.message.id
  )

  const [idleMs, setIdleMs] = useState(0)
  const [archived, setArchived] = useState(false)
  const [recommended, setRecommended] = useState(false)

  // Tick only while a finished turn waits out the delay, then stop: once the
  // affordance is showing there is nothing left to count.
  useEffect(() => {
    if (busy || !isLastAssistant) {
      setIdleMs(0)
      return
    }
    const startedAt = Date.now()
    const id = window.setInterval(() => {
      const next = Date.now() - startedAt
      setIdleMs(next)
      if (next >= ARCHIVE_IDLE_MS) window.clearInterval(id)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [busy, isLastAssistant])

  // Ask for the hint once, as the affordance is about to appear.
  useEffect(() => {
    if (!sessionId || busy || idleMs < ARCHIVE_IDLE_MS) return
    let cancelled = false
    void requestGatewayForProfile<{ guven: number; oneri: string }>(profile, 'session.closure_hint', {
      session_id: sessionId
    })
      .then(r => {
        if (!cancelled) setRecommended(r?.oneri === 'arsivle')
      })
      .catch(() => {
        // No hint → no label. The button stays exactly as usable.
      })
    return () => {
      cancelled = true
    }
  }, [busy, idleMs, profile, sessionId])

  const archive = useCallback(async () => {
    if (!sessionId) return
    setArchived(true) // optimistic: the affordance disappears immediately
    try {
      await setSessionArchived(sessionId, true, profile)
    } catch (error) {
      setArchived(false) // visible rollback (desktop guide: be optimistic, then honest)
      notifyError(error, copy.archiveFailed)
    }
  }, [copy.archiveFailed, profile, sessionId])

  if (!shouldOfferArchive({ busy, idleMs, isArchived: archived, isLastAssistant })) return null

  return (
    <span className="inline-flex items-center gap-1" data-slot="aui_msg-archive">
      {recommended && (
        <span className="select-none text-[0.6875rem] leading-5 text-muted-foreground">
          {copy.archiveRecommended}
        </span>
      )}
      <TooltipIconButton onClick={() => void archive()} tooltip={copy.archive}>
        <Codicon name="archive" size="0.875rem" />
      </TooltipIconButton>
    </span>
  )
}

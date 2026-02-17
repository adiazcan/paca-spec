import { useEffect } from 'react'

import { useViewState } from '@/app/useViewState'
import type { RequestHistoryEntry } from '@/models/eventApproval'
import { getRequestHistory } from '@/services/api-client/history'
import { ApiError } from '@/services/api-client/types'

interface RequestTimelineProps {
  requestId: string
}

export function RequestTimeline({ requestId }: RequestTimelineProps) {
  const viewState = useViewState<RequestHistoryEntry[]>([])
  const { setLoading, setData, setEmpty, setError, setStale } = viewState

  useEffect(() => {
    let mounted = true

    async function loadTimeline(): Promise<void> {
      setLoading()

      try {
        const items = await getRequestHistory(requestId)

        if (!mounted) {
          return
        }

        if (items.length === 0) {
          setEmpty()
          return
        }

        setData(items)
      } catch (error) {
        if (!mounted) {
          return
        }

        if (error instanceof ApiError && error.code === 'CONFLICT') {
          setStale()
          return
        }

        setError(
          error instanceof Error
            ? error
            : new Error('Unable to load request timeline.'),
        )
      }
    }

    void loadTimeline()

    return () => {
      mounted = false
    }
  }, [requestId, setData, setEmpty, setError, setLoading, setStale])

  return (
    <section>
      {viewState.isLoading ? (
        <p role="status">Loading request timeline…</p>
      ) : null}
      {viewState.isEmpty ? (
        <p role="status">No timeline events found.</p>
      ) : null}
      {viewState.isError ? (
        <p role="alert">
          {viewState.error?.message ?? 'Unable to load request timeline.'}
        </p>
      ) : null}
      {viewState.isStale ? (
        <p role="status">Request timeline is stale. Reload and try again.</p>
      ) : null}

      {!viewState.isLoading && !viewState.isEmpty && !viewState.isError ? (
        <ul aria-label="Request timeline">
          {viewState.data?.map((entry) => (
            <li aria-label="timeline-event" key={entry.historyEntryId}>
              {entry.occurredAt} — {entry.eventType}
              {entry.comment ? ` — ${entry.comment}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

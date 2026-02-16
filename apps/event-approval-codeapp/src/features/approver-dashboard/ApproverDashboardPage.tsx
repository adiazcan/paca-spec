import { useCallback, useEffect, useState } from 'react'

import { useViewState } from '@/app/useViewState'
import type { EventApprovalRequestSummary } from '@/models/eventApproval'
import { ApiError } from '@/services/api-client/types'
import { listPendingApprovals } from '@/services/api-client/approvals'

import { RequestReviewPanel } from './RequestReviewPanel'

export function ApproverDashboardPage() {
  const viewState = useViewState<EventApprovalRequestSummary[]>([])
  const { setLoading, setData, setError, setStale } = viewState
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  const loadPending = useCallback(async () => {
    setLoading()

    try {
      const items = await listPendingApprovals()
      setData(items)
      setSelectedRequestId((currentSelection) => {
        if (items.length === 0) {
          return null
        }

        if (
          currentSelection &&
          items.some((item) => item.requestId === currentSelection)
        ) {
          return currentSelection
        }

        return items[0].requestId
      })
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CONFLICT') {
        setStale()
        return
      }

      setError(
        error instanceof Error
          ? error
          : new Error('Unable to load pending approvals.'),
      )
    }
  }, [setData, setError, setLoading, setStale])

  useEffect(() => {
    void loadPending()
  }, [loadPending])

  return (
    <section>
      <h2>Pending Approvals</h2>

      {viewState.isLoading ? <p role="status">Loading pending approvals…</p> : null}
      {viewState.isEmpty ? <p role="status">No pending requests available.</p> : null}
      {viewState.isError ? (
        <p role="alert">{viewState.error?.message ?? 'Unable to load pending approvals.'}</p>
      ) : null}
      {viewState.isStale ? (
        <p role="status">Pending approvals are stale. Reload and try again.</p>
      ) : null}

      {!viewState.isLoading && !viewState.isEmpty && !viewState.isError ? (
        <div>
          <ul aria-label="Pending requests">
            {viewState.data?.map((request) => (
              <li key={request.requestId}>
                <button
                  aria-pressed={selectedRequestId === request.requestId}
                  onClick={() => setSelectedRequestId(request.requestId)}
                  type="button"
                >
                  {request.requestNumber} — {request.eventName} — {request.status}
                </button>
              </li>
            ))}
          </ul>

          <RequestReviewPanel
            onDecisionSaved={() => {
              setSelectedRequestId(null)
              void loadPending()
            }}
            requestId={selectedRequestId}
          />
        </div>
      ) : null}
    </section>
  )
}

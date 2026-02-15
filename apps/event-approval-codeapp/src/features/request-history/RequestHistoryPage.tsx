import { useEffect, useState } from 'react'

import { useViewState } from '@/app/useViewState'
import type { EventApprovalRequestSummary } from '@/models/eventApproval'
import { listMyRequests } from '@/services/api-client/requests'

import { RequestTimeline } from './RequestTimeline'

export function RequestHistoryPage() {
  const viewState = useViewState<EventApprovalRequestSummary[]>([])
  const { setLoading, setEmpty, setData, setError } = viewState
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  )
  const [selectedRequestNumber, setSelectedRequestNumber] = useState<
    string | null
  >(null)

  useEffect(() => {
    let mounted = true

    async function loadRequests(): Promise<void> {
      setLoading()

      try {
        const items = await listMyRequests()

        if (!mounted) {
          return
        }

        if (items.length === 0) {
          setEmpty()
          setSelectedRequestId(null)
          setSelectedRequestNumber(null)
          return
        }

        setData(items)
        setSelectedRequestId((currentSelection) => {
          if (
            currentSelection &&
            items.some((item) => item.requestId === currentSelection)
          ) {
            const matchingItem = items.find(
              (item) => item.requestId === currentSelection,
            )
            setSelectedRequestNumber(matchingItem?.requestNumber ?? null)
            return currentSelection
          }

          setSelectedRequestNumber(items[0].requestNumber)
          return items[0].requestId
        })
      } catch (error) {
        if (!mounted) {
          return
        }

        setError(
          error instanceof Error
            ? error
            : new Error('Failed to load request history.'),
        )
      }
    }

    void loadRequests()

    return () => {
      mounted = false
    }
  }, [setData, setEmpty, setError, setLoading])

  return (
    <section>
      <h2>My Request History</h2>
      {viewState.isLoading ? (
        <p role="status">Loading request history…</p>
      ) : null}
      {viewState.isEmpty ? <p role="status">No requests found yet.</p> : null}
      {viewState.isError ? (
        <p role="alert">
          {viewState.error?.message ?? 'Unable to load request history.'}
        </p>
      ) : null}

      {!viewState.isLoading && !viewState.isEmpty && !viewState.isError ? (
        <div>
          <ul aria-label="Request history">
            {viewState.data?.map((request) => (
              <li key={request.requestId}>
                <strong>{request.requestNumber}</strong> — {request.eventName} —{' '}
                {request.status}{' '}
                <button
                  onClick={() => {
                    setSelectedRequestId(request.requestId)
                    setSelectedRequestNumber(request.requestNumber)
                  }}
                  type="button"
                >
                  View timeline for {request.requestNumber}
                </button>
              </li>
            ))}
          </ul>

          {selectedRequestId ? (
            <div>
              <h3>Timeline for {selectedRequestNumber}</h3>
              <RequestTimeline requestId={selectedRequestId} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

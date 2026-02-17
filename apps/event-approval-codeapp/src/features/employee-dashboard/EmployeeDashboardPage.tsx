import { useEffect, useMemo } from 'react'

import { RequestCard } from '@/components/RequestCard'
import { SummaryCards } from '@/components/SummaryCards'
import { useViewState } from '@/app/useViewState'
import type {
  DashboardSummary,
  EventApprovalRequestSummary,
} from '@/models/eventApproval'
import { listMyRequests } from '@/services/api-client/requests'
import { ApiError } from '@/services/api-client/types'

import styles from './EmployeeDashboardPage.module.css'

interface EmployeeDashboardPageProps {
  onViewDetails: (requestId: string) => void
}

function computeSummary(
  requests: EventApprovalRequestSummary[],
): DashboardSummary {
  return requests.reduce(
    (summary, request) => {
      if (request.status === 'submitted') {
        summary.pending += 1
      }

      if (request.status === 'approved') {
        summary.approved += 1
      }

      if (request.status === 'rejected') {
        summary.rejected += 1
      }

      return summary
    },
    {
      total: requests.length,
      pending: 0,
      approved: 0,
      rejected: 0,
    },
  )
}

export function EmployeeDashboardPage({
  onViewDetails,
}: EmployeeDashboardPageProps) {
  const viewState = useViewState<EventApprovalRequestSummary[]>([])
  const { setLoading, setData, setEmpty, setError, setStale } = viewState

  useEffect(() => {
    let mounted = true

    async function loadRequests(): Promise<void> {
      setLoading()

      try {
        const requests = await listMyRequests()

        if (!mounted) {
          return
        }

        if (requests.length === 0) {
          setEmpty()
          return
        }

        setData(requests)
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
            : new Error('Failed to load your requests.'),
        )
      }
    }

    void loadRequests()

    return () => {
      mounted = false
    }
  }, [setData, setEmpty, setError, setLoading, setStale])

  const summary = useMemo(
    () => computeSummary(viewState.data ?? []),
    [viewState.data],
  )

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>My Event Requests</h2>
        <p className={styles.subtitle}>
          Track the status of your event requests.
        </p>
      </div>

      {viewState.isLoading ? <p role="status">Loading requests…</p> : null}
      {viewState.isEmpty ? <p role="status">No requests found yet.</p> : null}
      {viewState.isStale ? (
        <p role="status">Your request data is stale. Refresh and try again.</p>
      ) : null}
      {viewState.isError ? (
        <p role="alert">
          {viewState.error?.message ?? 'Unable to load your requests.'}
        </p>
      ) : null}

      {!viewState.isLoading &&
      !viewState.isEmpty &&
      !viewState.isError &&
      !viewState.isStale ? (
        <>
          <SummaryCards
            approved={summary.approved}
            pending={summary.pending}
            rejected={summary.rejected}
            total={summary.total}
          />

          <div className={styles.requestList}>
            {viewState.data?.map((request) => (
              <RequestCard
                destination={request.destination ?? '—'}
                eventName={request.eventName}
                key={request.requestId}
                onViewDetails={onViewDetails}
                requestId={request.requestId}
                role={request.role}
                status={request.status}
                submittedAt={request.submittedAt}
                totalCost={request.totalCost ?? 0}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  )
}

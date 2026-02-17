import { useEffect } from 'react'
import { useState } from 'react'

import { BackLink } from '@/components/BackLink'
import {
  CommentsSection,
  type CommentsSectionComment,
} from '@/components/CommentsSection'
import { CostBreakdown } from '@/components/CostBreakdown'
import { StatusBadge } from '@/components/StatusBadge'
import { useViewState } from '@/app/useViewState'
import type { EventApprovalRequest } from '@/models/eventApproval'
import { getRequestDetail } from '@/services/api-client/approvals'
import { getRequestHistory } from '@/services/api-client/history'

import styles from './RequestDetailPage.module.css'

interface RequestDetailPageProps {
  requestId: string | null
  onBack: () => void
}

function mapTransportIcon(
  mode: EventApprovalRequest['transportationMode'],
): string {
  if (mode === 'air') {
    return '✈️'
  }

  if (mode === 'rail') {
    return '🚆'
  }

  if (mode === 'car') {
    return '🚗'
  }

  if (mode === 'bus') {
    return '🚌'
  }

  return '🚐'
}

function formatSubmittedDate(value: string | null): string {
  if (!value) {
    return 'Not submitted'
  }

  const date = new Date(value)

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function RequestDetailPage({
  requestId,
  onBack,
}: RequestDetailPageProps) {
  const viewState = useViewState<EventApprovalRequest | null>(null)
  const { setLoading, setData, setEmpty, setError } = viewState
  const [comments, setComments] = useState<CommentsSectionComment[]>([])

  function toAuthor(actorRole: 'employee' | 'approver' | 'system'): string {
    if (actorRole === 'approver') {
      return 'Approver'
    }

    if (actorRole === 'employee') {
      return 'Employee'
    }

    return 'System'
  }

  useEffect(() => {
    let mounted = true

    async function loadRequestDetail(selectedRequestId: string): Promise<void> {
      setLoading()
      setComments([])

      try {
        const [request, historyEntries] = await Promise.all([
          getRequestDetail(selectedRequestId),
          getRequestHistory(selectedRequestId, {
            eventTypes: ['approved', 'rejected'],
          }),
        ])

        if (!mounted) {
          return
        }

        setData(request)
        setComments(
          historyEntries
            .filter(
              (entry) =>
                typeof entry.comment === 'string' &&
                entry.comment.trim().length > 0,
            )
            .map((entry) => ({
              author: toAuthor(entry.actorRole),
              content: entry.comment!.trim(),
              timestamp: entry.occurredAt,
            })),
        )
      } catch (error) {
        if (!mounted) {
          return
        }

        setError(
          error instanceof Error
            ? error
            : new Error('Unable to load request details.'),
        )
      }
    }

    if (!requestId) {
      setEmpty()
      return () => {
        mounted = false
      }
    }

    void loadRequestDetail(requestId)

    return () => {
      mounted = false
    }
  }, [requestId, setData, setEmpty, setError, setLoading])

  if (!requestId || viewState.isEmpty) {
    return (
      <section className={styles.container}>
        <BackLink label="Back" onClick={onBack} />
        <p role="status">Select a request to view details.</p>
      </section>
    )
  }

  return (
    <section className={styles.container}>
      <BackLink label="Back" onClick={onBack} />

      {viewState.isLoading ? (
        <p role="status">Loading request details…</p>
      ) : null}
      {viewState.isError ? (
        <p role="alert">
          {viewState.error?.message ?? 'Unable to load request details.'}
        </p>
      ) : null}

      {viewState.data ? (
        <div className={styles.layout}>
          <article className={styles.content}>
            <header className={styles.header}>
              <div>
                <h2 className={styles.title}>{viewState.data.eventName}</h2>
                <p className={styles.meta}>
                  Date: {formatSubmittedDate(viewState.data.submittedAt)}
                </p>
              </div>
              <StatusBadge status={viewState.data.status} />
            </header>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Requester Information</h3>
              <p className={styles.meta}>
                Name: {viewState.data.submitterDisplayName}
              </p>
              <p className={styles.meta}>
                Website:{' '}
                <a
                  href={viewState.data.eventWebsite}
                  target="_blank"
                  rel="noreferrer"
                >
                  {viewState.data.eventWebsite}
                </a>
              </p>
              <p className={styles.meta}>Role: {viewState.data.role}</p>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Travel Details</h3>
              <p className={styles.meta}>
                Transport: {mapTransportIcon(viewState.data.transportationMode)}{' '}
                {viewState.data.transportationMode}
              </p>
              <p className={styles.meta}>Origin: {viewState.data.origin}</p>
              <p className={styles.meta}>
                Destination: {viewState.data.destination}
              </p>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Comments</h3>
              <CommentsSection comments={comments} />
            </section>
          </article>

          <CostBreakdown
            hotels={viewState.data.costEstimate.hotels}
            meals={viewState.data.costEstimate.meals}
            other={viewState.data.costEstimate.other}
            registration={viewState.data.costEstimate.registration}
            total={viewState.data.costEstimate.total}
            travel={viewState.data.costEstimate.travel}
          />
        </div>
      ) : null}
    </section>
  )
}

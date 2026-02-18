import { useEffect, useState } from 'react'

import { BackLink } from '@/components/BackLink'
import {
  CommentsSection,
  type CommentsSectionComment,
} from '@/components/CommentsSection'
import { CostBreakdown } from '@/components/CostBreakdown'
import { StatusBadge } from '@/components/StatusBadge'
import { useViewState } from '@/app/useViewState'
import type { DecisionType, EventApprovalRequest } from '@/models/eventApproval'
import {
  getRequestDetail,
  submitDecision,
} from '@/services/api-client/approvals'
import { getRequestHistory } from '@/services/api-client/history'
import { ApiError } from '@/services/api-client/types'

import { ActionsPanel } from './ActionsPanel'
import styles from './ApproverReviewPage.module.css'

interface ApproverReviewPageProps {
  requestId: string | null
  onBack: () => void
  onDecisionComplete: () => void
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

export function ApproverReviewPage({
  requestId,
  onBack,
  onDecisionComplete,
}: ApproverReviewPageProps) {
  const viewState = useViewState<EventApprovalRequest | null>(null)
  const { setLoading, setData, setEmpty, setError } = viewState
  const [isProcessing, setIsProcessing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
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
      setActionError(null)
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

  async function handleDecision(
    decisionType: DecisionType,
    comment: string,
  ): Promise<void> {
    if (!requestId || !viewState.data) {
      return
    }

    setIsProcessing(true)
    setActionError(null)

    try {
      await submitDecision(requestId, {
        decisionType,
        comment,
        version: viewState.data.version,
      })

      onDecisionComplete()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CONFLICT') {
        setActionError(
          'This request was already decided. Refresh and try again.',
        )
      } else {
        setActionError(
          error instanceof Error ? error.message : 'Unable to submit decision.',
        )
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (!requestId || viewState.isEmpty) {
    return (
      <section className={styles.container}>
        <BackLink label="Back to Dashboard" onClick={onBack} />
        <p role="status">Select a request to approve or reject.</p>
      </section>
    )
  }

  return (
    <section className={styles.container}>
      <BackLink label="Back to Dashboard" onClick={onBack} />

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
                  Request #{viewState.data.requestNumber}
                </p>
              </div>
              <StatusBadge status={viewState.data.status} />
            </header>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Requester Information</h3>
              <p className={styles.meta}>
                Name: {viewState.data.submitterDisplayName}
              </p>
              <p className={styles.meta}>Role: {viewState.data.role}</p>
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

            <ActionsPanel
              isProcessing={isProcessing}
              onApprove={(comment) => handleDecision('approved', comment)}
              onReject={(comment) => handleDecision('rejected', comment)}
            />

            {actionError ? <p role="alert">{actionError}</p> : null}
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

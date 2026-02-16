import { useEffect, useState } from 'react'

import { useViewState } from '@/app/useViewState'
import type { DecisionType, EventApprovalRequest } from '@/models/eventApproval'
import { decideRequest } from '@/services/api-client/approvals'
import { createDataProvider } from '@/services/api-client/providerFactory'
import { ApiError } from '@/services/api-client/types'

interface RequestReviewPanelProps {
  requestId: string | null
  onDecisionSaved?: () => void
}

export function RequestReviewPanel({
  requestId,
  onDecisionSaved,
}: RequestReviewPanelProps) {
  const viewState = useViewState<EventApprovalRequest | null>(null)
  const { setEmpty, setLoading, setData, setError, setStale } = viewState
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    if (!requestId) {
      setEmpty()
      setComment('')
      setSubmitError(null)
      setSubmitStatus(null)
      return () => {
        mounted = false
      }
    }
    const selectedRequestId: string = requestId

    async function loadRequest(): Promise<void> {
      setLoading()
      setSubmitError(null)
      setSubmitStatus(null)
      setComment('')

      try {
        const provider = createDataProvider()
        const request = await provider.getRequest(selectedRequestId)

        if (!mounted) {
          return
        }

        setData(request)
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

    void loadRequest()

    return () => {
      mounted = false
    }
  }, [requestId, setData, setEmpty, setError, setLoading])

  async function submitDecision(decisionType: DecisionType): Promise<void> {
    if (!requestId || !viewState.data) {
      return
    }
    const selectedRequestId = requestId

    const trimmedComment = comment.trim()
    if (!trimmedComment) {
      setSubmitError('Comment is required to record a decision.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitStatus(null)

    try {
      await decideRequest(selectedRequestId, {
        decisionType,
        comment: trimmedComment,
        version: viewState.data.version,
      })

      setSubmitStatus(`Decision recorded as ${decisionType}.`)
      onDecisionSaved?.()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CONFLICT') {
        setStale(viewState.data)
        setSubmitError('This request was already updated. Reload and review the latest state.')
        return
      }

      setSubmitError(
        error instanceof Error ? error.message : 'Unable to record decision.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!requestId || viewState.isEmpty) {
    return <p role="status">Select a pending request to review.</p>
  }

  return (
    <section aria-label="Request review panel">
      <h3>Request Review</h3>

      {viewState.isLoading ? <p role="status">Loading request details…</p> : null}
      {viewState.isError ? (
        <p role="alert">{viewState.error?.message ?? 'Unable to load request details.'}</p>
      ) : null}
      {viewState.isStale ? (
        <p role="status">Request details are stale because another decision was saved.</p>
      ) : null}

      {viewState.data ? (
        <div>
          <p>
            <strong>{viewState.data.requestNumber}</strong> — {viewState.data.eventName}
          </p>
          <p>Submitted by: {viewState.data.submitterDisplayName}</p>
          <p>Status: {viewState.data.status}</p>

          <label htmlFor="decision-comment">Decision comment</label>
          <textarea
            id="decision-comment"
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            value={comment}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              disabled={isSubmitting}
              onClick={() => {
                void submitDecision('approved')
              }}
              type="button"
            >
              Approve request
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => {
                void submitDecision('rejected')
              }}
              type="button"
            >
              Reject request
            </button>
          </div>

          {submitError ? <p role="alert">{submitError}</p> : null}
          {submitStatus ? <p role="status">{submitStatus}</p> : null}
        </div>
      ) : null}
    </section>
  )
}

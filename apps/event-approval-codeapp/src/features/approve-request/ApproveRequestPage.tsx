import { useEffect, useState } from 'react'

import { useViewState } from '@/app/useViewState'
import type {
  DecisionType,
  EventApprovalRequest,
  RequestStatus,
  TransportationMode,
} from '@/models/eventApproval'
import { decideRequest } from '@/services/api-client/approvals'
import { createDataProvider } from '@/services/api-client/providerFactory'
import { ApiError } from '@/services/api-client/types'

interface ApproveRequestPageProps {
  requestId: string
  onNavigateBack: () => void
  onDecisionSaved?: () => void
}

function BackArrowIcon() {
  return (
    <svg aria-hidden="true" className="info-row__icon" viewBox="0 0 20 20">
      <path
        d="m11.7 5.3-4.4 4.4 4.4 4.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg aria-hidden="true" className="info-row__icon" viewBox="0 0 20 20">
      <circle cx="10" cy="6.8" r="3.1" />
      <path
        d="M4.5 16a5.5 5.5 0 0 1 11 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg aria-hidden="true" className="info-row__icon" viewBox="0 0 20 20">
      <circle
        cx="10"
        cy="10"
        fill="none"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2.8 10h14.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M10 2.5c2.1 2 3.2 4.7 3.2 7.5S12.1 15.5 10 17.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M10 2.5c-2.1 2-3.2 4.7-3.2 7.5s1.1 5.5 3.2 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="info-row__icon" viewBox="0 0 20 20">
      <path
        d="M5.5 2.7v2.2m9-2.2v2.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <rect
        fill="none"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
        width="14"
        x="3"
        y="4.5"
      />
      <path
        d="M3.5 8.2h13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg aria-hidden="true" className="travel-field__pin" viewBox="0 0 16 16">
      <path d="M8 1.5A4.2 4.2 0 0 0 3.8 5.7c0 3 3.5 6.9 4 7.4.1.1.3.1.4 0 .5-.5 4-4.4 4-7.4A4.2 4.2 0 0 0 8 1.5Zm0 5.7a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" className="travel-field__pin" viewBox="0 0 16 16">
      <path d="M3 3.2A2.2 2.2 0 0 1 5.2 1h5.6A2.2 2.2 0 0 1 13 3.2v4.6A2.2 2.2 0 0 1 10.8 10H7l-2.3 2.4c-.3.3-.7 0-.7-.3V10H5.2A2.2 2.2 0 0 1 3 7.8V3.2Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="travel-field__pin" viewBox="0 0 16 16">
      <path
        d="m3.5 8.4 2.8 2.8 6.2-6.2"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="travel-field__pin" viewBox="0 0 16 16">
      <path
        d="m4 4 8 8m0-8-8 8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function formatSubmittedDate(submittedAt: string | null): string {
  if (!submittedAt) {
    return 'Not submitted'
  }

  const date = new Date(submittedAt)

  if (Number.isNaN(date.getTime())) {
    return submittedAt
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatCost(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getStatusDisplay(status: RequestStatus): string {
  if (status === 'submitted') {
    return 'Pending'
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

function getStatusClassName(status: RequestStatus): string {
  if (status === 'submitted') {
    return 'status-badge--submitted'
  }

  return `status-badge--${status}`
}

function getTransportationEmoji(mode: TransportationMode): string {
  const emojiMap: Record<string, string> = {
    air: '✈️',
    rail: '🚆',
    car: '🚗',
    bus: '🚌',
    other: '🚶',
  }

  return emojiMap[mode] ?? '🚶'
}

function getTransportationLabel(mode: TransportationMode): string {
  if (mode === 'air') {
    return 'Flight'
  }

  if (mode === 'rail') {
    return 'Train'
  }

  return mode.charAt(0).toUpperCase() + mode.slice(1)
}

function getRoleLabel(role: EventApprovalRequest['role']): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function ApproveRequestPage({
  requestId,
  onNavigateBack,
  onDecisionSaved,
}: ApproveRequestPageProps) {
  const viewState = useViewState<EventApprovalRequest | null>(null)
  const { setLoading, setData, setError, setStale } = viewState
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadRequest(): Promise<void> {
      setLoading()
      setComment('')
      setSubmitError(null)
      setSubmitStatus(null)

      try {
        const provider = createDataProvider()
        const request = await provider.getRequest(requestId)

        if (!mounted) {
          return
        }

        setData(request)
      } catch (error) {
        if (!mounted) {
          return
        }

        if (error instanceof ApiError && error.code === 'CONFLICT') {
          setStale()
          return
        }

        if (error instanceof ApiError && error.code === 'NOT_FOUND') {
          setError(new Error('Request not found.'))
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
  }, [requestId, setData, setError, setLoading, setStale])

  async function submitDecision(decisionType: DecisionType): Promise<void> {
    if (!viewState.data) {
      return
    }

    const trimmedComment = comment.trim()

    if (decisionType === 'rejected' && !trimmedComment) {
      setSubmitError('Comment is required for rejection.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitStatus(null)

    try {
      await decideRequest(requestId, {
        decisionType,
        comment: trimmedComment,
        version: viewState.data.version,
      })

      setSubmitStatus(`Decision recorded as ${decisionType}.`)
      onDecisionSaved?.()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CONFLICT') {
        setStale(viewState.data)
        setSubmitError(
          'This request was already updated. Reload and review the latest state.',
        )
        return
      }

      setSubmitError(
        error instanceof Error ? error.message : 'Unable to record decision.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const request = viewState.data

  return (
    <div className="view-request">
      <button
        className="view-request__back-link"
        onClick={onNavigateBack}
        type="button"
      >
        <BackArrowIcon />
        <span>Back</span>
      </button>

      {viewState.isLoading ? (
        <p role="status">Loading request details…</p>
      ) : null}
      {viewState.isError ? (
        <p role="alert">
          {viewState.error?.message ?? 'Unable to load request details.'}
        </p>
      ) : null}
      {viewState.isStale ? (
        <p role="status">
          Request details are stale because another update was saved.
        </p>
      ) : null}

      {request ? (
        <div className="view-request__layout">
          <div className="view-request__main">
            <article className="detail-card" aria-label="Request details">
              <div className="detail-card__header">
                <div className="detail-card__title-row">
                  <h2 className="detail-card__title">{request.eventName}</h2>
                  <span
                    className={`status-badge ${getStatusClassName(request.status)}`}
                  >
                    {getStatusDisplay(request.status)}
                  </span>
                </div>
                <p className="detail-card__subtitle">
                  Submitted on {formatSubmittedDate(request.submittedAt)}
                </p>
              </div>
              <div className="detail-card__body">
                <div className="info-row">
                  <PersonIcon />
                  <p className="info-row__text">
                    {request.submitterDisplayName}
                  </p>
                </div>
                <div className="info-row">
                  <GlobeIcon />
                  <a
                    className="info-row__link"
                    href={request.eventWebsite}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {request.eventWebsite}
                  </a>
                </div>
                <div className="info-row">
                  <CalendarIcon />
                  <p className="info-row__text">
                    Role: {getRoleLabel(request.role)}
                  </p>
                </div>
              </div>
            </article>

            <article className="detail-card" aria-label="Travel details">
              <div className="detail-card__header">
                <p className="detail-card__section-title">Travel Details</p>
              </div>
              <div className="detail-card__body">
                <div className="travel-mode">
                  <span className="travel-mode__emoji">
                    {getTransportationEmoji(request.transportationMode)}
                  </span>
                  <div>
                    <p className="travel-mode__label">
                      {getTransportationLabel(request.transportationMode)}
                    </p>
                    <p className="travel-mode__sub">Transportation mode</p>
                  </div>
                </div>
                <div className="divider" />
                <div className="travel-grid">
                  <div className="travel-field">
                    <p className="travel-field__label">Origin</p>
                    <div className="travel-field__value">
                      <MapPinIcon />
                      <span>{request.origin}</span>
                    </div>
                  </div>
                  <div className="travel-field">
                    <p className="travel-field__label">Destination</p>
                    <div className="travel-field__value">
                      <MapPinIcon />
                      <span>{request.destination}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="detail-card" aria-label="Comments">
              <div className="detail-card__header">
                <div className="comments-header">
                  <p className="detail-card__section-title">Comments</p>
                  <button className="btn-outline-sm" type="button">
                    <ChatIcon />
                    <span>Add Comment</span>
                  </button>
                </div>
              </div>
              <div className="detail-card__body">
                <p className="comments-empty">No comments yet</p>
              </div>
            </article>
          </div>

          <aside className="view-request__sidebar">
            <article className="detail-card" aria-label="Cost breakdown">
              <div className="detail-card__header">
                <p className="detail-card__section-title">Cost Breakdown</p>
              </div>
              <div className="detail-card__body detail-card__body--spaced">
                <div className="cost-row">
                  <p className="cost-row__label">Registration</p>
                  <p className="cost-row__value">
                    {formatCost(request.costEstimate.registration)}
                  </p>
                </div>
                <div className="cost-row">
                  <p className="cost-row__label">Travel</p>
                  <p className="cost-row__value">
                    {formatCost(request.costEstimate.travel)}
                  </p>
                </div>
                <div className="cost-row">
                  <p className="cost-row__label">Hotel</p>
                  <p className="cost-row__value">
                    {formatCost(request.costEstimate.hotels)}
                  </p>
                </div>
                <div className="cost-row">
                  <p className="cost-row__label">Meals</p>
                  <p className="cost-row__value">
                    {formatCost(request.costEstimate.meals)}
                  </p>
                </div>
                <div className="cost-row">
                  <p className="cost-row__label">Other</p>
                  <p className="cost-row__value">
                    {formatCost(request.costEstimate.other)}
                  </p>
                </div>
                <div className="divider" />
                <div className="cost-total">
                  <p className="cost-total__label">Total</p>
                  <p className="cost-total__value">
                    {formatCost(request.costEstimate.total)}
                  </p>
                </div>
              </div>
            </article>

            <article className="detail-card" aria-label="Request actions">
              <div className="detail-card__header">
                <p className="detail-card__section-title">Actions</p>
              </div>
              <div className="detail-card__body">
                <textarea
                  className="action-textarea"
                  id="action-comment"
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Add a comment (optional for approval, required for rejection)..."
                  value={comment}
                />
                <button
                  className="btn-approve"
                  disabled={isSubmitting}
                  onClick={() => {
                    void submitDecision('approved')
                  }}
                  type="button"
                >
                  <CheckIcon />
                  <span>Approve Request</span>
                </button>
                <button
                  className="btn-reject"
                  disabled={isSubmitting}
                  onClick={() => {
                    void submitDecision('rejected')
                  }}
                  type="button"
                >
                  <CloseIcon />
                  <span>Reject Request</span>
                </button>
                {submitError ? (
                  <p className="action-error" role="alert">
                    {submitError}
                  </p>
                ) : null}
                {submitStatus ? (
                  <p className="action-success" role="status">
                    {submitStatus}
                  </p>
                ) : null}
              </div>
            </article>
          </aside>
        </div>
      ) : null}
    </div>
  )
}

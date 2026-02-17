import { useEffect } from 'react'

import { useViewState } from '@/app/useViewState'
import type { EventApprovalRequestSummary, RequestStatus, RoleType } from '@/models/eventApproval'
import { createDataProvider } from '@/services/api-client/providerFactory'

interface ApproverHomePageProps {
  onViewDetails?: (requestId: string) => void
  onPendingCountChange?: (count: number) => void
}

function RoleIcon() {
  return (
    <svg aria-hidden="true" className="meta-item__icon" viewBox="0 0 16 16">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1c-2.9 0-5 1.7-5 3.6 0 .2.2.4.4.4h9.2c.2 0 .4-.2.4-.4C13 10.7 10.9 9 8 9Z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="meta-item__icon" viewBox="0 0 16 16">
      <path d="M5 1a.5.5 0 0 1 .5.5V2h5V1.5a.5.5 0 0 1 1 0V2H12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h.5V1.5A.5.5 0 0 1 5 1Zm7 5H4v6h8V6Z" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg aria-hidden="true" className="meta-item__icon" viewBox="0 0 16 16">
      <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.3 4.1 7.8 4.3 8 .1.1.3.1.4 0 .2-.2 4.3-4.7 4.3-8A4.5 4.5 0 0 0 8 1.5Zm0 6.1a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8Z" />
    </svg>
  )
}

function DollarIcon() {
  return (
    <svg aria-hidden="true" className="meta-item__icon" viewBox="0 0 16 16">
      <path d="M8.6 1.5a.6.6 0 1 0-1.2 0v1a2.9 2.9 0 0 0-2.4 2.9c0 1.9 1.4 2.5 2.7 2.9l.5.2c1.2.4 1.8.7 1.8 1.4 0 .7-.6 1.2-1.6 1.2-1 0-1.9-.4-2.6-1.1a.6.6 0 0 0-.8.9c.7.7 1.6 1.2 2.5 1.3v1a.6.6 0 1 0 1.2 0v-1a2.9 2.9 0 0 0 2.4-2.8c0-1.8-1.3-2.5-2.7-2.9l-.6-.2c-1.1-.4-1.7-.7-1.7-1.4 0-.8.8-1.3 1.8-1.3.8 0 1.6.3 2.2.8a.6.6 0 0 0 .8-.9 4.5 4.5 0 0 0-2.2-1V1.5Z" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" className="meta-item__icon" viewBox="0 0 16 16">
      <path
        d="m6 3.5 4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  )
}

function formatSubmittedAt(submittedAt: string | null): string {
  if (!submittedAt) {
    return 'Not submitted'
  }

  const date = new Date(submittedAt)

  if (Number.isNaN(date.getTime())) {
    return submittedAt
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatCost(total?: number): string {
  if (typeof total !== 'number') {
    return '$0'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(total)
}

function getRoleLabel(role: RoleType): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

function getStatusBadgeVariant(status: RequestStatus): 'pending' | 'approved' | 'rejected' {
  if (status === 'approved') {
    return 'approved'
  }

  if (status === 'rejected') {
    return 'rejected'
  }

  return 'pending'
}

function getStatusDisplay(status: RequestStatus): string {
  if (status === 'submitted') {
    return 'Pending'
  }

  return status.toUpperCase()
}

export function ApproverHomePage({
  onViewDetails,
  onPendingCountChange,
}: ApproverHomePageProps) {
  const viewState = useViewState<EventApprovalRequestSummary[]>([])
  const { setLoading, setData, setError, setEmpty } = viewState

  useEffect(() => {
    let mounted = true

    async function loadRequests(): Promise<void> {
      setLoading()

      try {
        const provider = createDataProvider()
        const items = await provider.listAllRequests()

        if (!mounted) {
          return
        }

        const pendingCount = items.filter((request) => request.status === 'submitted').length
        onPendingCountChange?.(pendingCount)

        if (items.length === 0) {
          setEmpty()
          return
        }

        setData(items)
      } catch (error) {
        if (!mounted) {
          return
        }

        setError(
          error instanceof Error
            ? error
            : new Error('Unable to load team event requests.'),
        )
      }
    }

    void loadRequests()

    return () => {
      mounted = false
    }
  }, [onPendingCountChange, setData, setEmpty, setError, setLoading])

  const requests = viewState.data ?? []
  const totalRequests = requests.length
  const pendingCount = requests.filter((request) => request.status === 'submitted').length
  const approvedCount = requests.filter((request) => request.status === 'approved').length
  const rejectedCount = requests.filter((request) => request.status === 'rejected').length

  return (
    <section className="main-content__inner">
      <h1 className="page-heading">All Event Requests</h1>
      <p className="page-subtitle">
        Review and manage event attendance requests from your team
      </p>

      {viewState.isLoading ? <p role="status">Loading team event requests…</p> : null}
      {viewState.isError ? (
        <p role="alert">
          {viewState.error?.message ?? 'Unable to load team event requests.'}
        </p>
      ) : null}
      {viewState.isEmpty ? <p role="status">No event requests available.</p> : null}

      {!viewState.isLoading && !viewState.isError && !viewState.isEmpty ? (
        <>
          <div className="stat-cards" role="list" aria-label="All request summary statistics">
            <article className="stat-card" role="listitem">
              <p className="stat-card__label">Total Requests</p>
              <p className="stat-card__value">{totalRequests}</p>
            </article>
            <article className="stat-card" role="listitem">
              <p className="stat-card__label">Pending</p>
              <p className="stat-card__value stat-card__value--pending">{pendingCount}</p>
            </article>
            <article className="stat-card" role="listitem">
              <p className="stat-card__label">Approved</p>
              <p className="stat-card__value stat-card__value--approved">{approvedCount}</p>
            </article>
            <article className="stat-card" role="listitem">
              <p className="stat-card__label">Rejected</p>
              <p className="stat-card__value stat-card__value--rejected">{rejectedCount}</p>
            </article>
          </div>

          <div className="request-cards" aria-label="All event requests">
            {requests.map((request) => {
              const badgeVariant = getStatusBadgeVariant(request.status)

              return (
                <article className="request-card" key={request.requestId}>
                  <div className="request-card__top">
                    <div className="request-card__content">
                      <div className="request-card__header">
                        <h2 className="request-card__title">{request.eventName}</h2>
                        <span className={`status-badge status-badge--${badgeVariant}`}>
                          {getStatusDisplay(request.status)}
                        </span>
                      </div>

                      <div className="request-card__meta">
                        <span className="meta-item">
                          <RoleIcon />
                          <span className="meta-item__text meta-item__text--capitalize">
                            {getRoleLabel(request.role)}
                          </span>
                        </span>
                        <span className="meta-item">
                          <CalendarIcon />
                          <span className="meta-item__text">{formatSubmittedAt(request.submittedAt)}</span>
                        </span>
                        <span className="meta-item">
                          <MapPinIcon />
                          <span className="meta-item__text">{request.destination ?? 'Destination TBD'}</span>
                        </span>
                        <span className="meta-item">
                          <DollarIcon />
                          <span className="meta-item__text">{formatCost(request.costTotal)}</span>
                        </span>
                      </div>

                      <p className="request-card__requester">
                        Requested by: {request.submitterDisplayName ?? 'Unknown submitter'}
                      </p>

                      {request.status !== 'submitted' && request.latestComment ? (
                        <div className="request-card__comment">
                          <p className="request-card__comment-text">
                            Latest comment: {request.latestComment}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <a
                      className="view-details-link"
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        onViewDetails?.(request.requestId)
                      }}
                    >
                      View Details
                      <ChevronRightIcon />
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : null}
    </section>
  )
}

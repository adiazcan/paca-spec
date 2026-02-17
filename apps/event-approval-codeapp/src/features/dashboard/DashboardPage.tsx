import { useEffect } from 'react'

import { useViewState } from '@/app/useViewState'
import type { EventApprovalRequestSummary, RequestStatus, RoleType } from '@/models/eventApproval'
import { listMyRequests } from '@/services/api-client/requests'

interface DashboardPageProps {
  onViewDetails?: (requestId: string) => void
}

function RoleIcon() {
  return (
    <svg aria-hidden="true" className="meta-icon" viewBox="0 0 16 16">
      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 1c-2.9 0-5 1.7-5 3.6 0 .2.2.4.4.4h9.2c.2 0 .4-.2.4-.4C13 10.7 10.9 9 8 9Z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="meta-icon" viewBox="0 0 16 16">
      <path d="M5 1a.5.5 0 0 1 .5.5V2h5V1.5a.5.5 0 0 1 1 0V2H12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h.5V1.5A.5.5 0 0 1 5 1Zm7 5H4v6h8V6Z" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg aria-hidden="true" className="meta-icon" viewBox="0 0 16 16">
      <path d="M8 1.5A4.5 4.5 0 0 0 3.5 6c0 3.3 4.1 7.8 4.3 8 .1.1.3.1.4 0 .2-.2 4.3-4.7 4.3-8A4.5 4.5 0 0 0 8 1.5Zm0 6.1a1.9 1.9 0 1 1 0-3.8 1.9 1.9 0 0 1 0 3.8Z" />
    </svg>
  )
}

function DollarIcon() {
  return (
    <svg aria-hidden="true" className="meta-icon" viewBox="0 0 16 16">
      <path d="M8.6 1.5a.6.6 0 1 0-1.2 0v1a2.9 2.9 0 0 0-2.4 2.9c0 1.9 1.4 2.5 2.7 2.9l.5.2c1.2.4 1.8.7 1.8 1.4 0 .7-.6 1.2-1.6 1.2-1 0-1.9-.4-2.6-1.1a.6.6 0 0 0-.8.9c.7.7 1.6 1.2 2.5 1.3v1a.6.6 0 1 0 1.2 0v-1a2.9 2.9 0 0 0 2.4-2.8c0-1.8-1.3-2.5-2.7-2.9l-.6-.2c-1.1-.4-1.7-.7-1.7-1.4 0-.8.8-1.3 1.8-1.3.8 0 1.6.3 2.2.8a.6.6 0 0 0 .8-.9 4.5 4.5 0 0 0-2.2-1V1.5Z" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg aria-hidden="true" className="view-details-icon" viewBox="0 0 16 16">
      <path d="m6 3.5 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
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
    day: 'numeric',
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
    maximumFractionDigits: 0,
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

  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function DashboardPage({ onViewDetails }: DashboardPageProps) {
  const viewState = useViewState<EventApprovalRequestSummary[]>([])
  const { setLoading, setEmpty, setData, setError } = viewState

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
            : new Error('Unable to load your event requests.'),
        )
      }
    }

    void loadRequests()

    return () => {
      mounted = false
    }
  }, [setData, setEmpty, setError, setLoading])

  const requests = viewState.data ?? []
  const totalRequests = requests.length
  const pendingCount = requests.filter((request) => request.status === 'submitted').length
  const approvedCount = requests.filter((request) => request.status === 'approved').length
  const rejectedCount = requests.filter((request) => request.status === 'rejected').length

  return (
    <section>
      <div className="page-intro">
        <h1 className="page-heading">My Event Requests</h1>
        <p className="page-subtitle">Track your event attendance requests and their status</p>
      </div>

      {viewState.isLoading ? <p role="status">Loading your requests…</p> : null}
      {viewState.isError ? (
        <p role="alert">
          {viewState.error?.message ?? 'Unable to load your event requests.'}
        </p>
      ) : null}

      {!viewState.isLoading && !viewState.isError ? (
        <>
          <div className="stat-cards" role="list" aria-label="Request summary statistics">
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

          {viewState.isEmpty ? (
            <p role="status">No requests found yet.</p>
          ) : (
            <div className="request-cards" aria-label="My event requests">
              {requests.map((request) => {
                const badgeVariant = getStatusBadgeVariant(request.status)

                return (
                  <article className="request-card" key={request.requestId}>
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
                          {getRoleLabel(request.role)}
                        </span>
                        <span className="meta-item">
                          <CalendarIcon />
                          {formatSubmittedAt(request.submittedAt)}
                        </span>
                        <span className="meta-item">
                          <MapPinIcon />
                          {request.destination ?? 'Destination TBD'}
                        </span>
                        <span className="meta-item">
                          <DollarIcon />
                          {formatCost(request.costTotal)}
                        </span>
                      </div>
                    </div>

                    <button
                      className="view-details-link"
                      onClick={() => onViewDetails?.(request.requestId)}
                      type="button"
                    >
                      View Details
                      <ChevronRightIcon />
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}

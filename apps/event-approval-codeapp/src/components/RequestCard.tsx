import type { RequestStatus, RoleType } from '@/models/eventApproval'

import { StatusBadge } from './StatusBadge'
import styles from './RequestCard.module.css'

interface RequestCardProps {
  requestId: string
  eventName: string
  status: RequestStatus
  role: RoleType
  submittedAt: string | null
  destination: string
  totalCost: number
  submitterDisplayName?: string
  latestComment?: string
  onViewDetails: (requestId: string) => void
}

function formatDate(input: string | null) {
  if (!input) {
    return 'Not submitted'
  }

  const parsed = new Date(input)

  if (Number.isNaN(parsed.getTime())) {
    return input
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function RequestCard({
  requestId,
  eventName,
  status,
  role,
  submittedAt,
  destination,
  totalCost,
  submitterDisplayName,
  latestComment,
  onViewDetails,
}: RequestCardProps) {
  function BriefcaseIcon() {
    return (
      <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M9 4h6a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2Zm0 4h6V6H9v2Zm11 4H4v7h16v-7Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  function CalendarIcon() {
    return (
      <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M7 2h2v2h6V2h2v2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V2Zm12 8H5v10h14V10Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  function MapPinIcon() {
    return (
      <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7Zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  function DollarIcon() {
    return (
      <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="M13 2v2.08A5.01 5.01 0 0 1 17 9h-2a3 3 0 0 0-6 0c0 1.19.77 1.73 3.32 2.42C15.42 12.23 18 13.2 18 17a5 5 0 0 1-5 4.9V24h-2v-2.08A5.01 5.01 0 0 1 7 17h2a3 3 0 0 0 6 0c0-1.56-1-2.05-3.4-2.72C8.88 13.5 6 12.58 6 9a5 5 0 0 1 5-4.9V2h2Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  function ArrowRightIcon() {
    return (
      <svg aria-hidden="true" height="16" viewBox="0 0 24 24" width="16">
        <path
          d="m13.17 5.59 1.41-1.42L22 11.59l-7.42 7.41-1.41-1.41L18.17 13H2v-2h16.17l-5-5.41Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.headerRow}>
          <h3 className={styles.title}>{eventName}</h3>
          <StatusBadge status={status} />
        </div>
        <button
          className={styles.linkButton}
          onClick={() => onViewDetails(requestId)}
          type="button"
        >
          <span>View Details</span>
          <span aria-hidden="true" className={styles.linkIcon}>
            <ArrowRightIcon />
          </span>
        </button>
      </div>

      <div className={styles.metaRow}>
        <p className={styles.meta}>
          <span aria-hidden="true" className={styles.metaIcon}>
            <BriefcaseIcon />
          </span>
          <span className={styles.capitalize}>{role}</span>
        </p>

        <p className={styles.meta}>
          <span aria-hidden="true" className={styles.metaIcon}>
            <CalendarIcon />
          </span>
          <span>{formatDate(submittedAt)}</span>
        </p>

        <p className={styles.meta}>
          <span aria-hidden="true" className={styles.metaIcon}>
            <MapPinIcon />
          </span>
          <span>{destination}</span>
        </p>

        <p className={styles.meta}>
          <span aria-hidden="true" className={styles.metaIcon}>
            <DollarIcon />
          </span>
          <span>{formatMoney(totalCost)}</span>
        </p>
      </div>

      {submitterDisplayName ? (
        <p className={styles.secondaryMeta}>Requested by: {submitterDisplayName}</p>
      ) : null}

      {latestComment ? (
        <p className={styles.comment}>Latest comment: {latestComment}</p>
      ) : null}
    </article>
  )
}

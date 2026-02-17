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

  return parsed.toLocaleDateString()
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
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
  return (
    <article className={styles.card}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>{eventName}</h3>
        <StatusBadge status={status} />
      </div>

      <p className={styles.meta}>Role: {role}</p>
      <p className={styles.meta}>Submitted: {formatDate(submittedAt)}</p>
      <p className={styles.meta}>Destination: {destination}</p>
      <p className={styles.meta}>Total: {formatMoney(totalCost)}</p>

      {submitterDisplayName ? (
        <p className={styles.meta}>Requested by: {submitterDisplayName}</p>
      ) : null}

      {latestComment ? (
        <p className={styles.comment}>Latest comment: {latestComment}</p>
      ) : null}

      <button
        className={styles.button}
        onClick={() => onViewDetails(requestId)}
        type="button"
      >
        View Details
      </button>
    </article>
  )
}

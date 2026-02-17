import type { RequestStatus } from '@/models/eventApproval'

import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: RequestStatus
}

function getLabel(status: RequestStatus) {
  if (status === 'submitted') {
    return 'Pending'
  }

  if (status === 'approved') {
    return 'Approved'
  }

  if (status === 'rejected') {
    return 'Rejected'
  }

  return 'Draft'
}

function getClassName(status: RequestStatus) {
  if (status === 'submitted') {
    return styles.pending
  }

  if (status === 'approved') {
    return styles.approved
  }

  if (status === 'rejected') {
    return styles.rejected
  }

  return styles.draft
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${getClassName(status)}`}>
      {getLabel(status)}
    </span>
  )
}

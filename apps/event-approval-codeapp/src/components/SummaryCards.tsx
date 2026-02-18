import styles from './SummaryCards.module.css'

interface SummaryCardsProps {
  total: number
  pending: number
  approved: number
  rejected: number
}

export function SummaryCards({
  total,
  pending,
  approved,
  rejected,
}: SummaryCardsProps) {
  return (
    <section aria-label="Request summary" className={styles.grid}>
      <article className={styles.card}>
        <p className={styles.label}>Total Requests</p>
        <p className={`${styles.value} ${styles.total}`}>{total}</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Pending</p>
        <p className={`${styles.value} ${styles.pending}`}>{pending}</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Approved</p>
        <p className={`${styles.value} ${styles.approved}`}>{approved}</p>
      </article>
      <article className={styles.card}>
        <p className={styles.label}>Rejected</p>
        <p className={`${styles.value} ${styles.rejected}`}>{rejected}</p>
      </article>
    </section>
  )
}

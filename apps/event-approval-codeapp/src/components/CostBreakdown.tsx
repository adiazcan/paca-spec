import styles from './CostBreakdown.module.css'

interface CostBreakdownProps {
  registration: number
  travel: number
  hotels: number
  meals: number
  other: number
  total: number
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

export function CostBreakdown({
  registration,
  travel,
  hotels,
  meals,
  other,
  total,
}: CostBreakdownProps) {
  return (
    <aside aria-label="Cost breakdown" className={styles.card}>
      <h3 className={styles.title}>Cost Breakdown</h3>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Registration</dt>
          <dd>{formatMoney(registration)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Travel</dt>
          <dd>{formatMoney(travel)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Hotels</dt>
          <dd>{formatMoney(hotels)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Meals</dt>
          <dd>{formatMoney(meals)}</dd>
        </div>
        <div className={styles.row}>
          <dt>Other</dt>
          <dd>{formatMoney(other)}</dd>
        </div>
      </dl>

      <div className={styles.totalRow}>
        <span>Total</span>
        <strong>{formatMoney(total)}</strong>
      </div>
    </aside>
  )
}

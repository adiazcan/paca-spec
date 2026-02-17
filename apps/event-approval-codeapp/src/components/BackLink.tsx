import styles from './BackLink.module.css'

interface BackLinkProps {
  label: string
  onClick: () => void
}

export function BackLink({ label, onClick }: BackLinkProps) {
  return (
    <button className={styles.link} onClick={onClick} type="button">
      ← {label}
    </button>
  )
}

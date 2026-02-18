import { useState } from 'react'

import styles from './ActionsPanel.module.css'

interface ActionsPanelProps {
  onApprove: (comment: string) => Promise<void>
  onReject: (comment: string) => Promise<void>
  isProcessing: boolean
}

export function ActionsPanel({
  onApprove,
  onReject,
  isProcessing,
}: ActionsPanelProps) {
  const [comment, setComment] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  async function handleApprove(): Promise<void> {
    setValidationError(null)
    await onApprove(comment.trim())
  }

  async function handleReject(): Promise<void> {
    const trimmedComment = comment.trim()

    if (!trimmedComment) {
      setValidationError('Comment is required to reject a request.')
      return
    }

    setValidationError(null)
    await onReject(trimmedComment)
  }

  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>Actions</h3>
      <label className={styles.label} htmlFor="decision-comment">
        Comment
      </label>
      <textarea
        className={styles.textarea}
        id="decision-comment"
        onChange={(event) => setComment(event.target.value)}
        placeholder="Add a comment (optional for approval, required for rejection)..."
        rows={5}
        value={comment}
      />

      {validationError ? (
        <p className={styles.error}>{validationError}</p>
      ) : null}

      <div className={styles.actions}>
        <button
          className={styles.approveButton}
          disabled={isProcessing}
          onClick={() => {
            void handleApprove()
          }}
          type="button"
        >
          Approve
        </button>
        <button
          className={styles.rejectButton}
          disabled={isProcessing}
          onClick={() => {
            void handleReject()
          }}
          type="button"
        >
          Reject
        </button>
      </div>
    </section>
  )
}

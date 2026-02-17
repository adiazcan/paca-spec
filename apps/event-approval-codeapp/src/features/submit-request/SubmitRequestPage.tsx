import { useState } from 'react'

import { useViewState } from '@/app/useViewState'
import { ApiError } from '@/services/api-client/types'
import {
  submitRequest,
  type SubmitRequestResult,
} from '@/services/api-client/requests'
import type { SubmitRequestInput } from '@/models/eventApproval'

import { SubmitRequestForm } from './SubmitRequestForm'

interface SubmitRequestPageProps {
  onCancel?: () => void
  onNavigateBack?: () => void
}

function BackIcon() {
  return (
    <svg aria-hidden="true" className="back-link__icon" viewBox="0 0 16 16">
      <path
        d="M7.2 3.2a.8.8 0 0 1 0 1.1L4.6 7h8.6a.8.8 0 0 1 0 1.6H4.6l2.6 2.7a.8.8 0 1 1-1.1 1.1L2 8l4.1-4.4a.8.8 0 0 1 1.1-.1Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function SubmitRequestPage({
  onCancel,
  onNavigateBack,
}: SubmitRequestPageProps) {
  const viewState = useViewState<SubmitRequestResult | null>(null)
  const [websiteWarning, setWebsiteWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(payload: SubmitRequestInput): Promise<void> {
    setIsSubmitting(true)
    viewState.setLoading()
    setWebsiteWarning(null)

    try {
      const result = await submitRequest(payload)
      if (result.websiteWarning) {
        setWebsiteWarning(result.websiteWarning)
      }
      viewState.setData(result)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CONFLICT') {
        viewState.setStale()
        return
      }

      viewState.setError(
        error instanceof Error ? error : new Error('Failed to submit request.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <button
        className="back-link"
        onClick={onNavigateBack ?? onCancel}
        type="button"
      >
        <BackIcon />
        Back to Dashboard
      </button>

      <div className="form-card">
        <div className="form-card__header">
          <h2 className="form-card__title">Submit Event Attendance Request</h2>
          <p className="form-card__subtitle">
            Fill out the form below to request approval for attending an event
            as a speaker, organizer, or assistant
          </p>
        </div>

        {viewState.isError ? (
          <p className="form-alert form-alert--error" role="alert">
            {viewState.error?.message ?? 'Unable to submit request.'}
          </p>
        ) : null}
        {viewState.isStale ? (
          <p className="form-alert form-alert--warning" role="status">
            Your data is stale. Reload and try again.
          </p>
        ) : null}
        {websiteWarning ? (
          <p className="form-alert form-alert--warning" role="status">
            {websiteWarning}
          </p>
        ) : null}
        {viewState.data?.request ? (
          <p className="form-alert form-alert--success" role="status">
            Request {viewState.data.request.requestNumber} submitted with status{' '}
            {viewState.data.request.status}.
          </p>
        ) : null}

        <SubmitRequestForm
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  )
}

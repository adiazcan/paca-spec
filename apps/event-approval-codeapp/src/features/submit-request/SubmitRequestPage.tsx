import { useState } from 'react'

import { useViewState } from '@/app/useViewState'
import { ApiError } from '@/services/api-client/types'
import {
  submitRequest,
  type SubmitRequestResult,
} from '@/services/api-client/requests'
import type { SubmitRequestInput } from '@/models/eventApproval'

import { SubmitRequestForm } from './SubmitRequestForm'

export function SubmitRequestPage() {
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
      <h2>Submit Event Request</h2>
      {viewState.isError ? (
        <p role="alert">{viewState.error?.message ?? 'Unable to submit request.'}</p>
      ) : null}
      {viewState.isStale ? (
        <p role="status">Your data is stale. Reload and try again.</p>
      ) : null}
      {websiteWarning ? <p role="status">{websiteWarning}</p> : null}
      {viewState.data?.request ? (
        <p role="status">
          Request {viewState.data.request.requestNumber} submitted with status{' '}
          {viewState.data.request.status}.
        </p>
      ) : null}

      <SubmitRequestForm
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </section>
  )
}

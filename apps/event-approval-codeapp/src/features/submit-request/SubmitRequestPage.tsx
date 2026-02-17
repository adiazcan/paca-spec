import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'

import { useViewState } from '@/app/useViewState'
import type { SubmitRequestInput } from '@/models/eventApproval'
import { validateSubmitRequestInput } from '@/features/submit-request/submitRequestSchema'
import { ApiError } from '@/services/api-client/types'
import {
  submitRequest,
  type SubmitRequestResult,
} from '@/services/api-client/requests'
import styles from './SubmitRequestPage.module.css'

const roleOptions = ['speaker', 'organizer', 'assistant'] as const
const transportationOptions = ['air', 'rail', 'car', 'bus', 'other'] as const

interface SubmitRequestFormValues {
  eventName: string
  eventWebsite: string
  role: (typeof roleOptions)[number]
  transportationMode: (typeof transportationOptions)[number]
  origin: string
  destination: string
  registration: string
  travel: string
  hotels: string
  meals: string
  other: string
  currencyCode: string
}

const initialValues: SubmitRequestFormValues = {
  eventName: '',
  eventWebsite: '',
  role: 'speaker',
  transportationMode: 'air',
  origin: '',
  destination: '',
  registration: '0',
  travel: '0',
  hotels: '0',
  meals: '0',
  other: '0',
  currencyCode: 'USD',
}

function toNumber(value: string): number {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : 0
}

export interface SubmitRequestPageProps {
  onSubmitted?: () => void
  onCancel?: () => void
}

export function SubmitRequestPage({
  onSubmitted,
  onCancel,
}: SubmitRequestPageProps) {
  const viewState = useViewState<SubmitRequestResult | null>(null)
  const [values, setValues] = useState<SubmitRequestFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [websiteWarning, setWebsiteWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const costTotal = useMemo(
    () =>
      toNumber(values.registration) +
      toNumber(values.travel) +
      toNumber(values.hotels) +
      toNumber(values.meals) +
      toNumber(values.other),
    [values],
  )

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

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
      onSubmitted?.()
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const details = error.details as { errors?: Record<string, string> }
        setErrors(details.errors ?? {})
        viewState.setError(new Error('Please review the highlighted fields.'))
        return
      }

      if (error instanceof ApiError && error.code === 'CONFLICT') {
        viewState.setStale()
        return
      }

      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        viewState.setError(
          new Error(
            'Your session expired. Please sign in again and resubmit your request.',
          ),
        )
        return
      }

      viewState.setError(
        error instanceof Error ? error : new Error('Failed to submit request.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onFormSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()

    const payload: SubmitRequestInput = {
      eventName: values.eventName,
      eventWebsite: values.eventWebsite.trim(),
      role: values.role,
      transportationMode: values.transportationMode,
      origin: values.origin,
      destination: values.destination,
      costEstimate: {
        registration: toNumber(values.registration),
        travel: toNumber(values.travel),
        hotels: toNumber(values.hotels),
        meals: toNumber(values.meals),
        other: toNumber(values.other),
        currencyCode: values.currencyCode.trim().toUpperCase(),
        total: costTotal,
      },
    }

    const validation = validateSubmitRequestInput(payload)
    setErrors(validation.errors)

    if (!validation.data) {
      return
    }

    await handleSubmit(validation.data)
  }

  return (
    <section className={styles.container}>
      <header>
        <h2 className={styles.heading}>Submit Event Request</h2>
        <p className={styles.description}>
          Complete the form below to request event attendance approval.
        </p>
      </header>

      {isSubmitting ? <p role="status">Submitting request…</p> : null}
      {viewState.isError ? (
        <p className={styles.error} role="alert">
          {viewState.error?.message ?? 'Unable to submit request.'}
        </p>
      ) : null}
      {viewState.isStale ? (
        <p className={styles.status} role="status">
          Your data is stale. Reload and try again.
        </p>
      ) : null}
      {websiteWarning ? (
        <p className={styles.status} role="status">
          {websiteWarning}
        </p>
      ) : null}
      {viewState.data?.request ? (
        <p className={styles.status} role="status">
          Request {viewState.data.request.requestNumber} submitted with status{' '}
          {viewState.data.request.status}.
        </p>
      ) : null}

      <form
        className={styles.form}
        onSubmit={(event) => {
          void onFormSubmit(event)
        }}
      >
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Event Information</h3>
          <div className={styles.fieldsGrid}>
            <div className={styles.field}>
              <label htmlFor="eventName">Event Name *</label>
              <input
                id="eventName"
                name="eventName"
                placeholder="e.g., Tech Conference 2026"
                value={values.eventName}
                onChange={updateField}
              />
              {errors.eventName ? (
                <p className={styles.error} role="alert">
                  {errors.eventName}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="eventWebsite">Event Website *</label>
              <input
                id="eventWebsite"
                name="eventWebsite"
                type="url"
                autoComplete="url"
                placeholder="https://example.com"
                value={values.eventWebsite}
                onChange={updateField}
              />
              {errors.eventWebsite ? (
                <p className={styles.error} role="alert">
                  {errors.eventWebsite}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="role">Your Role *</label>
              <select
                id="role"
                name="role"
                value={values.role}
                onChange={updateField}
              >
                {roleOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Travel Details</h3>
          <div className={styles.fieldsGrid}>
            <div className={styles.field}>
              <label htmlFor="transportationMode">Transportation Mode *</label>
              <select
                id="transportationMode"
                name="transportationMode"
                value={values.transportationMode}
                onChange={updateField}
              >
                {transportationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="origin">Origin *</label>
              <input
                id="origin"
                name="origin"
                placeholder="e.g., New York, NY"
                value={values.origin}
                onChange={updateField}
              />
              {errors.origin ? (
                <p className={styles.error} role="alert">
                  {errors.origin}
                </p>
              ) : null}
            </div>

            <div className={styles.field}>
              <label htmlFor="destination">Destination *</label>
              <input
                id="destination"
                name="destination"
                placeholder="e.g., San Francisco, CA"
                value={values.destination}
                onChange={updateField}
              />
              {errors.destination ? (
                <p className={styles.error} role="alert">
                  {errors.destination}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Estimated Costs</h3>
          <div className={styles.fieldsGrid}>
            <div className={styles.field}>
              <label htmlFor="registration">Registration Fee ($)</label>
              <input
                id="registration"
                min="0"
                name="registration"
                type="number"
                value={values.registration}
                onChange={updateField}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="travel">Travel Cost ($)</label>
              <input
                id="travel"
                min="0"
                name="travel"
                type="number"
                value={values.travel}
                onChange={updateField}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="hotels">Hotel Cost ($)</label>
              <input
                id="hotels"
                min="0"
                name="hotels"
                type="number"
                value={values.hotels}
                onChange={updateField}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="meals">Meals ($)</label>
              <input
                id="meals"
                min="0"
                name="meals"
                type="number"
                value={values.meals}
                onChange={updateField}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="other">Other Expenses ($)</label>
              <input
                id="other"
                min="0"
                name="other"
                type="number"
                value={values.other}
                onChange={updateField}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="currencyCode">Currency</label>
              <input
                id="currencyCode"
                maxLength={3}
                name="currencyCode"
                value={values.currencyCode}
                onChange={updateField}
              />
            </div>
          </div>

          {errors['costEstimate.total'] ? (
            <p className={styles.error} role="alert">
              {errors['costEstimate.total']}
            </p>
          ) : null}

          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Total Estimated Cost</span>
            <span className={styles.totalValue}>${costTotal.toFixed(2)}</span>
          </div>
        </section>

        <div className={styles.actions}>
          <button
            className={styles.secondaryAction}
            type="button"
            onClick={() => onCancel?.()}
          >
            Cancel
          </button>
          <button
            className={styles.primaryAction}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </section>
  )
}

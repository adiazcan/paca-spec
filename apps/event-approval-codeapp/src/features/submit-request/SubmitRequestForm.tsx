import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'

import type { SubmitRequestInput } from '@/models/eventApproval'
import { validateSubmitRequestInput } from '@/features/submit-request/submitRequestSchema'

const roleOptions = ['speaker', 'organizer', 'assistant'] as const
const transportationOptions = ['air', 'rail', 'car', 'bus', 'other'] as const

const roleOptionLabels: Record<(typeof roleOptions)[number], string> = {
  speaker: 'Speaker',
  organizer: 'Organizer',
  assistant: 'Assistant',
}

const transportationOptionLabels: Record<
  (typeof transportationOptions)[number],
  string
> = {
  air: 'Flight',
  rail: 'Rail',
  car: 'Car',
  bus: 'Bus',
  other: 'Other',
}

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

export interface SubmitRequestFormProps {
  isSubmitting: boolean
  onCancel?: () => void
  onSubmit: (payload: SubmitRequestInput) => Promise<void>
}

function toNumber(value: string): number {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : 0
}

export function SubmitRequestForm({
  isSubmitting,
  onCancel,
  onSubmit,
}: SubmitRequestFormProps) {
  const [values, setValues] = useState<SubmitRequestFormValues>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    const payload: SubmitRequestInput = {
      eventName: values.eventName,
      eventWebsite: values.eventWebsite,
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

    await onSubmit(validation.data)
  }

  return (
    <form className="form-body" onSubmit={handleSubmit}>
      <section className="form-section">
        <h3 className="form-section__heading">Event Information</h3>

        <div className="form-group">
          <label className="form-label" htmlFor="eventName">
            Event Name *
          </label>
          <input
            className="form-input"
            id="eventName"
            name="eventName"
            onChange={updateField}
            placeholder="e.g., Tech Conference 2026"
            value={values.eventName}
          />
          {errors.eventName ? (
            <p className="form-error" role="alert">
              {errors.eventName}
            </p>
          ) : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="eventWebsite">
            Event Website *
          </label>
          <input
            className="form-input"
            id="eventWebsite"
            name="eventWebsite"
            onChange={updateField}
            placeholder="https://example.com"
            value={values.eventWebsite}
          />
          {errors.eventWebsite ? (
            <p className="form-error" role="alert">
              {errors.eventWebsite}
            </p>
          ) : null}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="role">
            Your Role *
          </label>
          <select
            className="form-select"
            id="role"
            name="role"
            onChange={updateField}
            value={values.role}
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {roleOptionLabels[option]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="form-section">
        <h3 className="form-section__heading">Travel Details</h3>

        <div className="form-group">
          <label className="form-label" htmlFor="transportationMode">
            Transportation Mode *
          </label>
          <select
            className="form-select"
            id="transportationMode"
            name="transportationMode"
            onChange={updateField}
            value={values.transportationMode}
          >
            {transportationOptions.map((option) => (
              <option key={option} value={option}>
                {transportationOptionLabels[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="origin">
              Origin *
            </label>
            <input
              className="form-input"
              id="origin"
              name="origin"
              onChange={updateField}
              placeholder="e.g., New York, NY"
              value={values.origin}
            />
            {errors.origin ? (
              <p className="form-error" role="alert">
                {errors.origin}
              </p>
            ) : null}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="destination">
              Destination *
            </label>
            <input
              className="form-input"
              id="destination"
              name="destination"
              onChange={updateField}
              placeholder="e.g., San Francisco, CA"
              value={values.destination}
            />
            {errors.destination ? (
              <p className="form-error" role="alert">
                {errors.destination}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="form-section">
        <h3 className="form-section__heading">Estimated Costs</h3>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="registration">
              Registration Fee ($)
            </label>
            <input
              className="form-input"
              id="registration"
              min="0"
              name="registration"
              onChange={updateField}
              placeholder="0.00"
              type="number"
              value={values.registration}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="travel">
              Travel Cost ($)
            </label>
            <input
              className="form-input"
              id="travel"
              min="0"
              name="travel"
              onChange={updateField}
              placeholder="0.00"
              type="number"
              value={values.travel}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="hotels">
              Hotel Cost ($)
            </label>
            <input
              className="form-input"
              id="hotels"
              min="0"
              name="hotels"
              onChange={updateField}
              placeholder="0.00"
              type="number"
              value={values.hotels}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="meals">
              Meals ($)
            </label>
            <input
              className="form-input"
              id="meals"
              min="0"
              name="meals"
              onChange={updateField}
              placeholder="0.00"
              type="number"
              value={values.meals}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="other">
              Other Expenses ($)
            </label>
            <input
              className="form-input"
              id="other"
              min="0"
              name="other"
              onChange={updateField}
              placeholder="0.00"
              type="number"
              value={values.other}
            />
          </div>

          <div aria-hidden="true" />
        </div>

        <input id="currencyCode" name="currencyCode" type="hidden" value={values.currencyCode} />

        <div className="cost-total-bar">
          <span className="cost-total-bar__label">Total Estimated Cost:</span>
          <span className="cost-total-bar__value">${costTotal.toFixed(2)}</span>
        </div>
        {errors['costEstimate.total'] ? (
          <p className="form-error" role="alert">
            {errors['costEstimate.total']}
          </p>
        ) : null}
      </section>

      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit Request'}
        </button>
        <button className="btn-secondary" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
    </form>
  )
}

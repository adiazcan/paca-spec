import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'

import type { SubmitRequestInput } from '@/models/eventApproval'
import { validateSubmitRequestInput } from '@/features/submit-request/submitRequestSchema'

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

export interface SubmitRequestFormProps {
  isSubmitting: boolean
  onSubmit: (payload: SubmitRequestInput) => Promise<void>
}

function toNumber(value: string): number {
  const normalized = Number(value)
  return Number.isFinite(normalized) ? normalized : 0
}

export function SubmitRequestForm({
  isSubmitting,
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
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="eventName">Event name</label>
        <input id="eventName" name="eventName" value={values.eventName} onChange={updateField} />
        {errors.eventName ? <p role="alert">{errors.eventName}</p> : null}
      </div>

      <div>
        <label htmlFor="eventWebsite">Event website</label>
        <input id="eventWebsite" name="eventWebsite" value={values.eventWebsite} onChange={updateField} />
        {errors.eventWebsite ? <p role="alert">{errors.eventWebsite}</p> : null}
      </div>

      <div>
        <label htmlFor="role">Role</label>
        <select id="role" name="role" value={values.role} onChange={updateField}>
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="transportationMode">Transportation</label>
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

      <div>
        <label htmlFor="origin">Origin</label>
        <input id="origin" name="origin" value={values.origin} onChange={updateField} />
        {errors.origin ? <p role="alert">{errors.origin}</p> : null}
      </div>

      <div>
        <label htmlFor="destination">Destination</label>
        <input id="destination" name="destination" value={values.destination} onChange={updateField} />
        {errors.destination ? <p role="alert">{errors.destination}</p> : null}
      </div>

      <fieldset>
        <legend>Cost estimate</legend>
        <label htmlFor="registration">Registration</label>
        <input id="registration" name="registration" type="number" min="0" value={values.registration} onChange={updateField} />

        <label htmlFor="travel">Travel</label>
        <input id="travel" name="travel" type="number" min="0" value={values.travel} onChange={updateField} />

        <label htmlFor="hotels">Hotels</label>
        <input id="hotels" name="hotels" type="number" min="0" value={values.hotels} onChange={updateField} />

        <label htmlFor="meals">Meals</label>
        <input id="meals" name="meals" type="number" min="0" value={values.meals} onChange={updateField} />

        <label htmlFor="other">Other</label>
        <input id="other" name="other" type="number" min="0" value={values.other} onChange={updateField} />

        <label htmlFor="currencyCode">Currency</label>
        <input id="currencyCode" name="currencyCode" value={values.currencyCode} onChange={updateField} maxLength={3} />

        <p>Total: {costTotal.toFixed(2)}</p>
        {errors['costEstimate.total'] ? (
          <p role="alert">{errors['costEstimate.total']}</p>
        ) : null}
      </fieldset>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  )
}

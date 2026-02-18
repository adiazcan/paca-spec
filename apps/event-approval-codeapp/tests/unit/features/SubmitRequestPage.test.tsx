import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SubmitRequestPage } from '@/features/submit-request/SubmitRequestPage'
import { submitRequest } from '@/services/api-client/requests'

vi.mock('@/services/api-client/requests', () => ({
  submitRequest: vi.fn(),
}))

describe('SubmitRequestPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the form sections and actions', () => {
    render(<SubmitRequestPage onCancel={vi.fn()} onSubmitted={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Submit Event Attendance Request' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Event Information' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Travel Details' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Estimated Costs' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Submit Request' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('shows validation errors when required fields are missing', async () => {
    const user = userEvent.setup()

    render(<SubmitRequestPage onCancel={vi.fn()} onSubmitted={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Submit Request' }))

    expect(screen.getByText(/Event name is required/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Event website must be a valid URL/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/At least one cost category must be greater than zero/i),
    ).toBeInTheDocument()
    expect(submitRequest).not.toHaveBeenCalled()
  })

  it('blocks submission for malformed event website URL', async () => {
    const user = userEvent.setup()

    render(<SubmitRequestPage onCancel={vi.fn()} onSubmitted={vi.fn()} />)

    await user.type(screen.getByLabelText('Event Name *'), 'Tech Summit')
    const websiteInput = screen.getByLabelText('Event Website *')
    await user.type(websiteInput, 'not-a-valid-url')
    await user.type(screen.getByLabelText('Origin *'), 'Seattle')
    await user.type(screen.getByLabelText('Destination *'), 'Austin')

    const registrationInput = screen.getByLabelText('Registration Fee ($)')
    await user.clear(registrationInput)
    await user.type(registrationInput, '120')

    await user.click(screen.getByRole('button', { name: 'Submit Request' }))

    expect((websiteInput as HTMLInputElement).validity.valid).toBe(false)
    expect(submitRequest).not.toHaveBeenCalled()
  })

  it('auto-calculates total cost as values change', async () => {
    const user = userEvent.setup()

    render(<SubmitRequestPage onCancel={vi.fn()} onSubmitted={vi.fn()} />)

    const registrationInput = screen.getByLabelText('Registration Fee ($)')
    const travelInput = screen.getByLabelText('Travel Cost ($)')

    await user.clear(registrationInput)
    await user.type(registrationInput, '120')
    await user.clear(travelInput)
    await user.type(travelInput, '80.5')

    expect(screen.getByText('$200.50')).toBeInTheDocument()
  })

  it('submits valid data and redirects via onSubmitted', async () => {
    const user = userEvent.setup()
    const onSubmitted = vi.fn()

    vi.mocked(submitRequest).mockResolvedValue({
      websiteWarning: null,
      request: {
        requestId: 'request-1',
        requestNumber: 'EAR-1001',
        submitterId: 'user-1',
        submitterDisplayName: 'Alex',
        eventName: 'Tech Summit',
        eventWebsite: 'https://example.com',
        role: 'speaker',
        transportationMode: 'air',
        origin: 'Seattle',
        destination: 'Austin',
        costEstimate: {
          registration: 200,
          travel: 300,
          hotels: 150,
          meals: 60,
          other: 40,
          currencyCode: 'USD',
          total: 750,
        },
        status: 'submitted',
        createdAt: '2026-02-17T00:00:00.000Z',
        updatedAt: '2026-02-17T00:00:00.000Z',
        submittedAt: '2026-02-17T00:00:00.000Z',
        version: 1,
      },
    })

    render(<SubmitRequestPage onCancel={vi.fn()} onSubmitted={onSubmitted} />)

    await user.type(screen.getByLabelText('Event Name *'), 'Tech Summit')
    await user.type(
      screen.getByLabelText('Event Website *'),
      'https://example.com',
    )
    await user.type(screen.getByLabelText('Origin *'), 'Seattle')
    await user.type(screen.getByLabelText('Destination *'), 'Austin')

    const registrationInput = screen.getByLabelText('Registration Fee ($)')
    await user.clear(registrationInput)
    await user.type(registrationInput, '200')

    await user.click(screen.getByRole('button', { name: 'Submit Request' }))

    expect(submitRequest).toHaveBeenCalledTimes(1)
    expect(onSubmitted).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(<SubmitRequestPage onCancel={onCancel} onSubmitted={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RequestDetailPage } from '@/features/request-detail/RequestDetailPage'
import { getRequestDetail } from '@/services/api-client/approvals'
import { getRequestHistory } from '@/services/api-client/history'

vi.mock('@/services/api-client/approvals', () => ({
  getRequestDetail: vi.fn(),
  submitDecision: vi.fn(),
  listPendingApprovals: vi.fn(),
  decideRequest: vi.fn(),
}))

vi.mock('@/services/api-client/history', () => ({
  getRequestHistory: vi.fn(),
}))

const mockRequest = {
  requestId: 'req-1',
  requestNumber: 'EA-1001',
  submitterId: 'employee-1',
  submitterDisplayName: 'Alex Employee',
  eventName: 'Global Engineering Summit',
  eventWebsite: 'https://events.contoso.example/summit',
  role: 'speaker',
  transportationMode: 'air',
  origin: 'Redmond',
  destination: 'Berlin',
  costEstimate: {
    registration: 499,
    travel: 1200,
    hotels: 850,
    meals: 280,
    other: 100,
    currencyCode: 'USD',
    total: 2929,
  },
  status: 'submitted',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:10:00.000Z',
  submittedAt: '2026-01-01T00:05:00.000Z',
  version: 1,
} as const

describe('RequestDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRequestHistory).mockResolvedValue([])
  })

  it('renders request details, transport icon, comments, and cost breakdown', async () => {
    vi.mocked(getRequestDetail).mockResolvedValue({ ...mockRequest })
    vi.mocked(getRequestHistory).mockResolvedValue([
      {
        historyEntryId: 'history-1',
        requestId: 'req-1',
        eventType: 'approved',
        actorId: 'approver-1',
        actorRole: 'approver',
        comment: 'Approved for Q1 budget.',
        occurredAt: '2026-01-01T00:20:00.000Z',
      },
    ])

    render(<RequestDetailPage onBack={vi.fn()} requestId="req-1" />)

    await screen.findByRole('heading', { name: 'Global Engineering Summit' })

    expect(screen.getByText('Date: Jan 1, 2026')).toBeInTheDocument()
    expect(screen.getByText('Name: Alex Employee')).toBeInTheDocument()
    expect(screen.getByText('Role: speaker')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: mockRequest.eventWebsite }),
    ).toHaveAttribute('href', mockRequest.eventWebsite)
    expect(screen.getByText(/Transport: ✈️ air/i)).toBeInTheDocument()
    expect(screen.getByText('Origin: Redmond')).toBeInTheDocument()
    expect(screen.getByText('Destination: Berlin')).toBeInTheDocument()
    expect(screen.getByText('Approved for Q1 budget.')).toBeInTheDocument()
    expect(
      screen.getByText('Approver • 2026-01-01T00:20:00.000Z'),
    ).toBeInTheDocument()
    expect(screen.getByText('$2,929.00')).toBeInTheDocument()
  })

  it('calls onBack when Back is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    vi.mocked(getRequestDetail).mockResolvedValue({ ...mockRequest })

    render(<RequestDetailPage onBack={onBack} requestId="req-1" />)

    await screen.findByRole('heading', { name: 'Global Engineering Summit' })
    await user.click(screen.getByRole('button', { name: '← Back' }))

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('shows empty selection state when no request is selected', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()

    render(<RequestDetailPage onBack={onBack} requestId={null} />)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Select a request to view details.',
    )

    await user.click(screen.getByRole('button', { name: '← Back' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(getRequestDetail).not.toHaveBeenCalled()
  })
})

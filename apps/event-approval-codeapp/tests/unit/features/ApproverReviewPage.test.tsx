import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApproverReviewPage } from '@/features/approver-review/ApproverReviewPage'
import {
  getRequestDetail,
  submitDecision,
} from '@/services/api-client/approvals'
import { getRequestHistory } from '@/services/api-client/history'
import { ApiError } from '@/services/api-client/types'

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

describe('ApproverReviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getRequestHistory).mockResolvedValue([])
  })

  it('renders request detail, travel info, comments, and cost breakdown', async () => {
    vi.mocked(getRequestDetail).mockResolvedValue({ ...mockRequest })
    vi.mocked(getRequestHistory).mockResolvedValue([
      {
        historyEntryId: 'history-1',
        requestId: 'req-1',
        eventType: 'rejected',
        actorId: 'approver-1',
        actorRole: 'approver',
        comment: 'Please add agenda and projected outcomes.',
        occurredAt: '2026-01-01T00:20:00.000Z',
      },
    ])

    render(
      <ApproverReviewPage
        onBack={vi.fn()}
        onDecisionComplete={vi.fn()}
        requestId="req-1"
      />,
    )

    await screen.findByRole('heading', { name: 'Global Engineering Summit' })

    expect(screen.getByText('Request #EA-1001')).toBeInTheDocument()
    expect(screen.getByText('Name: Alex Employee')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: mockRequest.eventWebsite }),
    ).toHaveAttribute('href', mockRequest.eventWebsite)
    expect(screen.getByText(/Transport: ✈️ air/i)).toBeInTheDocument()
    expect(
      screen.getByText('Please add agenda and projected outcomes.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Approver • 2026-01-01T00:20:00.000Z'),
    ).toBeInTheDocument()
    expect(screen.getByText('$2,929.00')).toBeInTheDocument()
  })

  it('approves without a comment and triggers completion callback', async () => {
    const user = userEvent.setup()
    const onDecisionComplete = vi.fn()

    vi.mocked(getRequestDetail).mockResolvedValue({ ...mockRequest })
    vi.mocked(submitDecision).mockResolvedValue({
      decisionId: 'decision-1',
      requestId: 'req-1',
      approverId: 'approver-1',
      approverDisplayName: 'Ava Approver',
      decisionType: 'approved',
      comment: '',
      decidedAt: '2026-01-01T00:20:00.000Z',
    })

    render(
      <ApproverReviewPage
        onBack={vi.fn()}
        onDecisionComplete={onDecisionComplete}
        requestId="req-1"
      />,
    )

    await screen.findByRole('heading', { name: 'Global Engineering Summit' })
    await user.click(screen.getByRole('button', { name: 'Approve' }))

    expect(submitDecision).toHaveBeenCalledWith('req-1', {
      decisionType: 'approved',
      comment: '',
      version: 1,
    })
    expect(onDecisionComplete).toHaveBeenCalledTimes(1)
  })

  it('blocks rejection when comment is empty', async () => {
    const user = userEvent.setup()

    vi.mocked(getRequestDetail).mockResolvedValue({ ...mockRequest })

    render(
      <ApproverReviewPage
        onBack={vi.fn()}
        onDecisionComplete={vi.fn()}
        requestId="req-1"
      />,
    )

    await screen.findByRole('heading', { name: 'Global Engineering Summit' })
    await user.click(screen.getByRole('button', { name: 'Reject' }))

    expect(
      screen.getByText('Comment is required to reject a request.'),
    ).toBeInTheDocument()
    expect(submitDecision).not.toHaveBeenCalled()
  })

  it('rejects with a comment and triggers completion callback', async () => {
    const user = userEvent.setup()
    const onDecisionComplete = vi.fn()

    vi.mocked(getRequestDetail).mockResolvedValue({ ...mockRequest })
    vi.mocked(submitDecision).mockResolvedValue({
      decisionId: 'decision-2',
      requestId: 'req-1',
      approverId: 'approver-1',
      approverDisplayName: 'Ava Approver',
      decisionType: 'rejected',
      comment: 'Insufficient business alignment.',
      decidedAt: '2026-01-01T00:20:00.000Z',
    })

    render(
      <ApproverReviewPage
        onBack={vi.fn()}
        onDecisionComplete={onDecisionComplete}
        requestId="req-1"
      />,
    )

    await screen.findByRole('heading', { name: 'Global Engineering Summit' })
    await user.type(
      screen.getByLabelText('Comment'),
      'Insufficient business alignment.',
    )
    await user.click(screen.getByRole('button', { name: 'Reject' }))

    expect(submitDecision).toHaveBeenCalledWith('req-1', {
      decisionType: 'rejected',
      comment: 'Insufficient business alignment.',
      version: 1,
    })
    expect(onDecisionComplete).toHaveBeenCalledTimes(1)
  })

  it('shows a user-friendly conflict message when decision version is stale', async () => {
    const user = userEvent.setup()
    const onDecisionComplete = vi.fn()

    vi.mocked(getRequestDetail).mockResolvedValue({ ...mockRequest })
    vi.mocked(submitDecision).mockRejectedValue(
      new ApiError(
        'CONFLICT',
        'Version mismatch: expected 1, current is 2',
        409,
      ),
    )

    render(
      <ApproverReviewPage
        onBack={vi.fn()}
        onDecisionComplete={onDecisionComplete}
        requestId="req-1"
      />,
    )

    await screen.findByRole('heading', { name: 'Global Engineering Summit' })
    await user.click(screen.getByRole('button', { name: 'Approve' }))

    expect(
      screen.getByText(
        'This request was already decided. Refresh and try again.',
      ),
    ).toBeInTheDocument()
    expect(onDecisionComplete).not.toHaveBeenCalled()
  })
})

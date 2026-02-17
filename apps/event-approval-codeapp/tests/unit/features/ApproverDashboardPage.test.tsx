import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApproverDashboardPage } from '@/features/approver-dashboard/ApproverDashboardPage'
import { listAllRequests } from '@/services/api-client/approvals'

vi.mock('@/services/api-client/approvals', () => ({
  listAllRequests: vi.fn(),
}))

describe('ApproverDashboardPage', () => {
  it('renders summary counts and cards with requester/comment context', async () => {
    vi.mocked(listAllRequests).mockResolvedValue([
      {
        requestId: 'req-1',
        requestNumber: 'EA-2001',
        eventName: 'Global Engineering Summit',
        role: 'speaker',
        status: 'submitted',
        submittedAt: '2026-02-17T08:00:00.000Z',
        destination: 'Berlin',
        totalCost: 2929,
        submitterDisplayName: 'Jordan Employee',
      },
      {
        requestId: 'req-2',
        requestNumber: 'EA-2002',
        eventName: 'Cloud Architecture Expo',
        role: 'organizer',
        status: 'approved',
        submittedAt: '2026-02-16T08:00:00.000Z',
        destination: 'Amsterdam',
        totalCost: 1200,
        submitterDisplayName: 'Leslie Employee',
        latestComment: 'Approved for strategic relevance.',
      },
      {
        requestId: 'req-3',
        requestNumber: 'EA-2003',
        eventName: 'Product Leaders Forum',
        role: 'assistant',
        status: 'rejected',
        submittedAt: '2026-02-15T08:00:00.000Z',
        destination: 'Dublin',
        totalCost: 950,
        submitterDisplayName: 'Sam Employee',
        latestComment: 'Budget cap exceeded.',
      },
    ])

    const onSummaryChange = vi.fn()

    render(
      <ApproverDashboardPage
        onSummaryChange={onSummaryChange}
        onViewDetails={vi.fn()}
      />,
    )

    await screen.findByText('Global Engineering Summit')

    expect(screen.getByText('All Event Requests')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(3)
    expect(
      screen.getByText('Requested by: Jordan Employee'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Latest comment: Approved for strategic relevance.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Latest comment:')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(onSummaryChange).toHaveBeenLastCalledWith({
        total: 3,
        pending: 1,
        approved: 1,
        rejected: 1,
      })
    })
  })

  it('invokes onViewDetails when a card action is clicked', async () => {
    const user = userEvent.setup()
    const onViewDetails = vi.fn()

    vi.mocked(listAllRequests).mockResolvedValue([
      {
        requestId: 'req-1',
        requestNumber: 'EA-2001',
        eventName: 'Global Engineering Summit',
        role: 'speaker',
        status: 'submitted',
        submittedAt: '2026-02-17T08:00:00.000Z',
        destination: 'Berlin',
        totalCost: 2929,
        submitterDisplayName: 'Jordan Employee',
      },
    ])

    render(<ApproverDashboardPage onViewDetails={onViewDetails} />)

    await screen.findByText('Global Engineering Summit')
    await user.click(screen.getByRole('button', { name: 'View Details' }))

    expect(onViewDetails).toHaveBeenCalledWith('req-1')
  })

  it('shows loading and then empty state', async () => {
    let resolveRequest: ((value: []) => void) | undefined
    vi.mocked(listAllRequests).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve as (value: []) => void
        }),
    )

    render(<ApproverDashboardPage onViewDetails={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading requests…')

    resolveRequest?.([])

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'No requests found yet.',
      )
    })
  })
})

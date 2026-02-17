import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmployeeDashboardPage } from '@/features/employee-dashboard/EmployeeDashboardPage'
import { listMyRequests } from '@/services/api-client/requests'

vi.mock('@/services/api-client/requests', () => ({
  listMyRequests: vi.fn(),
}))

describe('EmployeeDashboardPage', () => {
  it('renders summary counts and request cards', async () => {
    vi.mocked(listMyRequests).mockResolvedValue([
      {
        requestId: 'req-1',
        requestNumber: 'EA-1001',
        eventName: 'Global Engineering Summit',
        role: 'speaker',
        status: 'submitted',
        submittedAt: '2026-02-17T08:00:00.000Z',
        destination: 'Berlin',
        totalCost: 2929,
      },
      {
        requestId: 'req-2',
        requestNumber: 'EA-1002',
        eventName: 'Cloud Architecture Expo',
        role: 'organizer',
        status: 'approved',
        submittedAt: '2026-02-16T08:00:00.000Z',
        destination: 'Amsterdam',
        totalCost: 1200,
      },
      {
        requestId: 'req-3',
        requestNumber: 'EA-1003',
        eventName: 'Product Leaders Forum',
        role: 'assistant',
        status: 'rejected',
        submittedAt: '2026-02-15T08:00:00.000Z',
        destination: 'Dublin',
        totalCost: 950,
      },
    ])

    render(<EmployeeDashboardPage onViewDetails={vi.fn()} />)

    await screen.findByText('Global Engineering Summit')

    expect(screen.getByText('My Event Requests')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(3)
    expect(screen.getByText('Cloud Architecture Expo')).toBeInTheDocument()
    expect(screen.getByText('Product Leaders Forum')).toBeInTheDocument()
  })

  it('invokes onViewDetails when a card action is clicked', async () => {
    const user = userEvent.setup()
    const onViewDetails = vi.fn()

    vi.mocked(listMyRequests).mockResolvedValue([
      {
        requestId: 'req-1',
        requestNumber: 'EA-1001',
        eventName: 'Global Engineering Summit',
        role: 'speaker',
        status: 'submitted',
        submittedAt: '2026-02-17T08:00:00.000Z',
        destination: 'Berlin',
        totalCost: 2929,
      },
    ])

    render(<EmployeeDashboardPage onViewDetails={onViewDetails} />)

    await screen.findByText('Global Engineering Summit')
    await user.click(screen.getByRole('button', { name: 'View Details' }))

    expect(onViewDetails).toHaveBeenCalledWith('req-1')
  })

  it('shows loading and then empty state', async () => {
    let resolveRequest: ((value: []) => void) | undefined
    vi.mocked(listMyRequests).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve as (value: []) => void
        }),
    )

    render(<EmployeeDashboardPage onViewDetails={vi.fn()} />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading requests…')

    resolveRequest?.([])

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'No requests found yet.',
      )
    })
  })
})

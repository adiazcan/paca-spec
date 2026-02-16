import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/services/api-client/types'
import { RequestReviewPanel } from '@/features/approver-dashboard/RequestReviewPanel'

const { getRequestMock, decideRequestMock } = vi.hoisted(() => ({
  getRequestMock: vi.fn(),
  decideRequestMock: vi.fn(),
}))

vi.mock('@/services/api-client/providerFactory', () => ({
  createDataProvider: () => ({
    getRequest: getRequestMock,
  }),
}))

vi.mock('@/services/api-client/approvals', () => ({
  decideRequest: decideRequestMock,
  listPendingApprovals: vi.fn(),
}))

describe('request review panel view states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state while request details are loading', () => {
    getRequestMock.mockReturnValue(new Promise(() => undefined))

    render(createElement(RequestReviewPanel, { requestId: 'request-1' }))

    expect(screen.getByText(/Loading request details…/i)).toBeInTheDocument()
  })

  it('renders error state when request details fail to load', async () => {
    getRequestMock.mockRejectedValueOnce(new Error('Unable to load request details.'))

    render(createElement(RequestReviewPanel, { requestId: 'request-1' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to load request details\./i,
    )
  })

  it('renders stale conflict message when decision submit returns conflict', async () => {
    const user = userEvent.setup()
    getRequestMock.mockResolvedValueOnce({
      requestId: 'request-1',
      requestNumber: 'EA-1001',
      submitterId: 'employee-001',
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
    })
    decideRequestMock.mockRejectedValueOnce(new ApiError('CONFLICT', 'stale', 409))

    render(createElement(RequestReviewPanel, { requestId: 'request-1' }))

    await screen.findByText(/Request Review/i)
    await user.type(screen.getByLabelText('Decision comment'), 'Needs more details')
    await user.click(screen.getByRole('button', { name: 'Reject request' }))

    expect(
      await screen.findByText(/already updated\. Reload and review the latest state\./i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Request details are stale because another decision was saved\./i),
    ).toBeInTheDocument()
  })
})

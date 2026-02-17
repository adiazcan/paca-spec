import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApproveRequestPage } from '@/features/approve-request/ApproveRequestPage'
import { ApiError } from '@/services/api-client/types'

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

function createRequest() {
  return {
    requestId: 'request-1',
    requestNumber: 'EA-1001',
    submitterId: 'employee-001',
    submitterDisplayName: 'Alex Employee',
    eventName: 'Tech Conference 2026',
    eventWebsite: 'https://events.contoso.example/tech-conf-2026',
    role: 'speaker' as const,
    transportationMode: 'air' as const,
    origin: 'Redmond',
    destination: 'Seattle',
    costEstimate: {
      registration: 500,
      travel: 700,
      hotels: 400,
      meals: 150,
      other: 50,
      currencyCode: 'USD',
      total: 1800,
    },
    status: 'submitted' as const,
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-02-10T00:10:00.000Z',
    submittedAt: '2026-02-10T00:05:00.000Z',
    version: 1,
  }
}

describe('approve request page view states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state while request details are loading', () => {
    getRequestMock.mockReturnValue(new Promise(() => undefined))

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    expect(screen.getByText(/Loading request details…/i)).toBeInTheDocument()
  })

  it('renders error state when request details fail to load', async () => {
    getRequestMock.mockRejectedValueOnce(
      new Error('Unable to load request details.'),
    )

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to load request details\./i,
    )
  })

  it('renders request details and actions when request loads successfully', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest())

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    expect(
      await screen.findByRole('heading', { name: /Tech Conference 2026/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Approve Request/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Reject Request/i }),
    ).toBeInTheDocument()
  })

  it('renders stale message and error when decision submit returns conflict', async () => {
    const user = userEvent.setup()
    getRequestMock.mockResolvedValueOnce(createRequest())
    decideRequestMock.mockRejectedValueOnce(
      new ApiError('CONFLICT', 'stale', 409),
    )

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    await screen.findByRole('heading', { name: /Tech Conference 2026/i })

    await user.type(
      screen.getByPlaceholderText(
        /Add a comment \(optional for approval, required for rejection\)\.\.\./i,
      ),
      'Needs more details',
    )
    await user.click(screen.getByRole('button', { name: /Reject Request/i }))

    expect(
      await screen.findByText(
        /This request was already updated\. Reload and review the latest state\./i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Request details are stale because another update was saved\./i,
      ),
    ).toBeInTheDocument()
  })
})

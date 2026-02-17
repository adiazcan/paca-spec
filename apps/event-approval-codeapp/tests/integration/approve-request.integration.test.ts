import { createElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
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

function createRequest(
  status: 'submitted' | 'approved' | 'rejected' | 'draft' = 'submitted',
) {
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
    status,
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-02-10T00:10:00.000Z',
    submittedAt: '2026-02-10T00:05:00.000Z',
    version: 7,
  }
}

describe('approve request page integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all request details and formatted costs', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest())

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    await screen.findByRole('heading', { name: /Tech Conference 2026/i })

    expect(
      screen.getByText(/Submitted on February 10, 2026/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Alex Employee/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: /events\.contoso\.example\/tech-conf-2026/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Role: Speaker/i)).toBeInTheDocument()
    expect(screen.getByText(/^Flight$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Redmond$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Seattle$/i)).toBeInTheDocument()

    expect(screen.getByText('Registration')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('Hotel')).toBeInTheDocument()
    expect(screen.getByText('Meals')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()

    expect(screen.getByText('$500')).toBeInTheDocument()
    expect(screen.getByText('$700')).toBeInTheDocument()
    expect(screen.getByText('$400')).toBeInTheDocument()
    expect(screen.getByText('$150')).toBeInTheDocument()
    expect(screen.getByText('$50')).toBeInTheDocument()
    expect(screen.getByText('$1,800')).toBeInTheDocument()
  })

  it('calls onNavigateBack when back button is clicked', async () => {
    const user = userEvent.setup()
    const onNavigateBack = vi.fn()
    getRequestMock.mockResolvedValueOnce(createRequest())

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack,
      }),
    )

    await screen.findByRole('heading', { name: /Tech Conference 2026/i })

    await user.click(screen.getByRole('button', { name: /Back/i }))

    expect(onNavigateBack).toHaveBeenCalledTimes(1)
  })

  it('uses submitted badge variant for submitted requests', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest('submitted'))

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    const badge = await screen.findByText('Pending')
    expect(badge.className).toContain('status-badge--submitted')
  })

  it('uses approved badge variant for approved requests', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest('approved'))

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    const badge = await screen.findByText('Approved')
    expect(badge.className).toContain('status-badge--approved')
  })

  it('uses rejected badge variant for rejected requests', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest('rejected'))

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    const badge = await screen.findByText('Rejected')
    expect(badge.className).toContain('status-badge--rejected')
  })

  it('updates the textarea value as the user types', async () => {
    const user = userEvent.setup()
    getRequestMock.mockResolvedValueOnce(createRequest())

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    const textarea = await screen.findByPlaceholderText(
      /Add a comment \(optional for approval, required for rejection\)\.\.\./i,
    )

    await user.type(textarea, 'Looks good to approve')

    expect(textarea).toHaveValue('Looks good to approve')
  })

  it('calls decideRequest with approved decision when approving', async () => {
    const user = userEvent.setup()
    getRequestMock.mockResolvedValueOnce(createRequest())
    decideRequestMock.mockResolvedValueOnce({})

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    await screen.findByRole('heading', { name: /Tech Conference 2026/i })

    await user.click(screen.getByRole('button', { name: /Approve Request/i }))

    await waitFor(() => {
      expect(decideRequestMock).toHaveBeenCalledWith('request-1', {
        decisionType: 'approved',
        comment: '',
        version: 7,
      })
    })
  })

  it('shows validation error when rejecting without comment', async () => {
    const user = userEvent.setup()
    getRequestMock.mockResolvedValueOnce(createRequest())

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    await screen.findByRole('heading', { name: /Tech Conference 2026/i })

    await user.click(screen.getByRole('button', { name: /Reject Request/i }))

    expect(
      await screen.findByText(/Comment is required for rejection\./i),
    ).toBeInTheDocument()
    expect(decideRequestMock).not.toHaveBeenCalled()
  })

  it('calls decideRequest with rejected decision when rejecting with comment', async () => {
    const user = userEvent.setup()
    getRequestMock.mockResolvedValueOnce(createRequest())
    decideRequestMock.mockResolvedValueOnce({})

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
      'Need additional justification for spend.',
    )

    await user.click(screen.getByRole('button', { name: /Reject Request/i }))

    await waitFor(() => {
      expect(decideRequestMock).toHaveBeenCalledWith('request-1', {
        decisionType: 'rejected',
        comment: 'Need additional justification for spend.',
        version: 7,
      })
    })
  })

  it('shows success message and calls onDecisionSaved when approval succeeds', async () => {
    const user = userEvent.setup()
    const onDecisionSaved = vi.fn()
    getRequestMock.mockResolvedValueOnce(createRequest())
    decideRequestMock.mockResolvedValueOnce({})

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
        onDecisionSaved,
      }),
    )

    await screen.findByRole('heading', { name: /Tech Conference 2026/i })

    await user.click(screen.getByRole('button', { name: /Approve Request/i }))

    expect(
      await screen.findByText(/Decision recorded as approved\./i),
    ).toBeInTheDocument()
    expect(onDecisionSaved).toHaveBeenCalledTimes(1)
  })

  it('shows stale warning when decision returns conflict', async () => {
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
      'Needs further review',
    )

    await user.click(screen.getByRole('button', { name: /Reject Request/i }))

    expect(
      await screen.findByText(
        /Request details are stale because another update was saved\./i,
      ),
    ).toBeInTheDocument()
  })

  it('disables action buttons while submission is in progress', async () => {
    const user = userEvent.setup()
    getRequestMock.mockResolvedValueOnce(createRequest())
    decideRequestMock.mockReturnValue(new Promise(() => undefined))

    render(
      createElement(ApproveRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    await screen.findByRole('heading', { name: /Tech Conference 2026/i })

    const approveButton = screen.getByRole('button', {
      name: /Approve Request/i,
    })
    const rejectButton = screen.getByRole('button', { name: /Reject Request/i })

    await user.click(approveButton)

    expect(approveButton).toBeDisabled()
    expect(rejectButton).toBeDisabled()
  })
})

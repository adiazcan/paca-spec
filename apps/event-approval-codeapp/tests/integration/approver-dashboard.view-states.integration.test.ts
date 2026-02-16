import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/services/api-client/types'
import { ApproverDashboardPage } from '@/features/approver-dashboard/ApproverDashboardPage'

const { listPendingApprovalsMock } = vi.hoisted(() => ({
  listPendingApprovalsMock: vi.fn(),
}))

vi.mock('@/services/api-client/approvals', () => ({
  listPendingApprovals: listPendingApprovalsMock,
  decideRequest: vi.fn(),
}))

describe('approver dashboard view states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state while pending approvals are in flight', () => {
    listPendingApprovalsMock.mockReturnValue(new Promise(() => undefined))

    render(createElement(ApproverDashboardPage))

    expect(screen.getByText(/Loading pending approvals…/i)).toBeInTheDocument()
  })

  it('renders empty state when there are no pending approvals', async () => {
    listPendingApprovalsMock.mockResolvedValueOnce([])

    render(createElement(ApproverDashboardPage))

    expect(await screen.findByText(/No pending requests available\./i)).toBeInTheDocument()
  })

  it('renders error state when loading pending approvals fails', async () => {
    listPendingApprovalsMock.mockRejectedValueOnce(new Error('Unable to load pending approvals.'))

    render(createElement(ApproverDashboardPage))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to load pending approvals\./i,
    )
  })

  it('renders stale state when a conflict occurs during load', async () => {
    listPendingApprovalsMock.mockRejectedValueOnce(
      new ApiError('CONFLICT', 'stale', 409),
    )

    render(createElement(ApproverDashboardPage))

    expect(
      await screen.findByText(/Pending approvals are stale\. Reload and try again\./i),
    ).toBeInTheDocument()
  })
})

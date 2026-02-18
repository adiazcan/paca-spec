import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from '@/app/App'

vi.mock('@/features/employee-dashboard/EmployeeDashboardPage', () => ({
  EmployeeDashboardPage: () => <div>Employee dashboard content</div>,
}))

vi.mock('@/features/submit-request/SubmitRequestPage', () => ({
  SubmitRequestPage: () => <div>Submit request content</div>,
}))

vi.mock('@/features/request-detail/RequestDetailPage', () => ({
  RequestDetailPage: () => <div>Request detail content</div>,
}))

vi.mock('@/features/approver-dashboard/ApproverDashboardPage', () => ({
  ApproverDashboardPage: () => <div>Approver dashboard content</div>,
}))

vi.mock('@/features/approver-review/ApproverReviewPage', () => ({
  ApproverReviewPage: () => <div>Approver review content</div>,
}))

describe('role switching', () => {
  it('updates nav items and resets to dashboard when switching roles', async () => {
    const user = userEvent.setup()

    render(<App />)

    expect(
      screen.getByRole('button', { name: 'Dashboard' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'New Request' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Event Approval System' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'New Request' }))

    expect(
      screen.getByRole('heading', { name: 'Submit Event Request' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Submit request content')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to Approver' }))

    expect(
      screen.getByRole('heading', { name: 'All Event Requests' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Approver dashboard content')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'New Request' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Approvals/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to Employee' }))

    expect(
      screen.getByRole('heading', { name: 'Event Approval System' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Employee dashboard content')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'New Request' }),
    ).toBeInTheDocument()
  })

  it('hides switch button for single-role users', () => {
    render(<App availableRoles={['employee']} />)

    expect(
      screen.queryByRole('button', { name: /Switch to/i }),
    ).not.toBeInTheDocument()
  })
})

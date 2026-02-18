import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Header } from '@/components/Header'

describe('Header', () => {
  it('renders employee navigation and switch role action', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    const onSwitchRole = vi.fn()

    render(
      <Header
        activeScreen="employee-dashboard"
        canSwitchRole
        onNavigate={onNavigate}
        onSwitchRole={onSwitchRole}
        pendingCount={3}
        role="employee"
        userName="Jordan"
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Event Approval System' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Jordan')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Dashboard' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'New Request' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to Approver' }))

    expect(onSwitchRole).toHaveBeenCalledTimes(1)
  })

  it('renders approver approvals badge and routes nav clicks', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()

    render(
      <Header
        activeScreen="approver-dashboard"
        canSwitchRole
        onNavigate={onNavigate}
        onSwitchRole={vi.fn()}
        pendingCount={5}
        role="approver"
        userName="Avery"
      />,
    )

    expect(screen.getByLabelText('pending approvals')).toHaveTextContent('5')

    await user.click(screen.getByRole('button', { name: /Approvals/i }))

    expect(onNavigate).toHaveBeenCalledWith('approver-dashboard')
  })
})

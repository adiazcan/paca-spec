import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/app/App'
import { resetDataProviderCache } from '@/services/api-client/providerFactory'

describe('approver decision approve flow', () => {
  beforeEach(() => {
    resetDataProviderCache()
  })

  it('allows approver to approve a pending request with a comment', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    await user.click(screen.getByRole('button', { name: 'Switch to Approver' }))
    await user.click(screen.getByRole('button', { name: /Approvals/i }))

    await screen.findByRole('heading', { name: 'Pending Approvals' })

    const firstPending = await screen.findByRole('button', {
      name: /EA-1001/i,
    })
    await user.click(firstPending)

    await screen.findByRole('button', { name: /Approve Request/i })
    await user.type(
      screen.getByPlaceholderText(
        /Add a comment \(optional for approval, required for rejection\)\.\.\./i,
      ),
      'Approved for Q2 goals.',
    )

    await user.click(screen.getByRole('button', { name: 'Approve Request' }))

    expect(
      await screen.findByRole('heading', { name: /All Event Requests/i }),
    ).toBeInTheDocument()
  }, 15000)
})

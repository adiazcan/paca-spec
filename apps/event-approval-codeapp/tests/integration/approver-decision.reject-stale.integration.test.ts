import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/app/App'
import { createDataProvider, resetDataProviderCache } from '@/services/api-client/providerFactory'

describe('approver decision reject stale flow', () => {
  beforeEach(() => {
    resetDataProviderCache()
  })

  it('shows stale conflict message when deciding with an outdated version', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    await user.click(screen.getByRole('button', { name: 'Switch to Approver' }))
    await user.click(screen.getByRole('button', { name: /Approvals/i }))

    const firstPending = await screen.findByRole('button', { name: /EA-1001/i })
    await user.click(firstPending)

    await screen.findByRole('button', { name: /Reject Request/i })

    const provider = createDataProvider()
    const pending = await provider.listPendingApprovals()
    const latest = await provider.getRequest(pending[0].requestId)

    await provider.decideRequest(latest.requestId, {
      decisionType: 'approved',
      comment: 'Approved by another approver',
      version: latest.version,
    })

    await user.type(
      screen.getByPlaceholderText(
        /Add a comment \(optional for approval, required for rejection\)\.\.\./i,
      ),
      'Reject due to overlap',
    )
    await user.click(screen.getByRole('button', { name: 'Reject Request' }))

    expect(
      await screen.findByText(/already updated\. Reload and review the latest state\./i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Request details are stale because another update was saved\./i),
    ).toBeInTheDocument()
  }, 15000)
})

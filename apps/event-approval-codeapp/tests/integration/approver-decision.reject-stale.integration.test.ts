import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/app/App'
import {
  createDataProvider,
  resetDataProviderCache,
} from '@/services/api-client/providerFactory'

describe('approver decision reject stale flow', () => {
  beforeEach(() => {
    resetDataProviderCache()
  })

  it('shows stale conflict message when deciding with an outdated version', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    await user.click(screen.getByRole('button', { name: 'Switch to Approver' }))

    const firstPending = (
      await screen.findAllByRole('button', {
        name: 'View Details',
      })
    )[0]
    await user.click(firstPending)

    await screen.findByRole('heading', { name: 'Actions' })

    const provider = createDataProvider()
    const pending = await provider.listPendingApprovals()
    const latest = await provider.getRequest(pending[0].requestId)

    await provider.decideRequest(latest.requestId, {
      decisionType: 'approved',
      comment: 'Approved by another approver',
      version: latest.version,
    })

    await user.type(screen.getByLabelText('Comment'), 'Reject due to overlap')
    await user.click(screen.getByRole('button', { name: 'Reject' }))

    expect(
      await screen.findByText(/already decided\. Refresh and try again\./i),
    ).toBeInTheDocument()
  }, 15000)
})

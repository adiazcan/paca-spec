import { createElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
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

    await user.click(screen.getByRole('button', { name: 'Approver View' }))

    await screen.findByRole('heading', { name: 'Approver Dashboard' })

    const firstPending = await screen.findByRole('button', {
      name: /EA-1001/i,
    })
    await user.click(firstPending)

    await screen.findByText(/Request Review/i)
    await user.type(
      screen.getByLabelText('Decision comment'),
      'Approved for Q2 goals.',
    )

    await user.click(screen.getByRole('button', { name: 'Approve request' }))

    await waitFor(() => {
      expect(screen.getByText(/No pending requests available./i)).toBeInTheDocument()
    })
  }, 15000)
})

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

    await user.click(screen.getByRole('button', { name: 'Switch to Approver' }))

    await screen.findAllByRole('heading', { name: 'All Event Requests' })

    const firstPending = (
      await screen.findAllByRole('button', {
        name: 'View Details',
      })
    )[0]
    await user.click(firstPending)

    await screen.findByRole('heading', { name: 'Actions' })
    await user.type(screen.getByLabelText('Comment'), 'Approved for Q2 goals.')

    await user.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'All Event Requests' }).length,
      ).toBeGreaterThan(0)
    })
  }, 15000)
})

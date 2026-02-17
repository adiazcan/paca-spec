import { createElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/app/App'
import { resetDataProviderCache } from '@/services/api-client/providerFactory'

describe('approver review figma workflow', () => {
  beforeEach(() => {
    resetDataProviderCache()
  })

  it('allows approval without a comment and redirects to approver dashboard', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    await user.click(screen.getByRole('button', { name: 'Switch to Approver' }))

    await screen.findAllByRole('heading', { name: 'All Event Requests' })

    await user.click(
      (await screen.findAllByRole('button', { name: 'View Details' }))[0],
    )
    await screen.findByRole('heading', { name: 'Actions' })

    await user.click(screen.getByRole('button', { name: 'Approve' }))

    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'All Event Requests' }).length,
      ).toBeGreaterThan(0)
    })
  })

  it('requires a comment to reject, then allows rejection with comment', async () => {
    const user = userEvent.setup()
    render(createElement(App))

    await user.click(screen.getByRole('button', { name: 'Switch to Approver' }))
    await screen.findAllByRole('heading', { name: 'All Event Requests' })

    await user.click(
      (await screen.findAllByRole('button', { name: 'View Details' }))[0],
    )
    await screen.findByRole('heading', { name: 'Actions' })

    await user.click(screen.getByRole('button', { name: 'Reject' }))

    expect(
      screen.getByText('Comment is required to reject a request.'),
    ).toBeInTheDocument()

    await user.type(
      screen.getByLabelText('Comment'),
      'Missing justification for travel budget.',
    )
    await user.click(screen.getByRole('button', { name: 'Reject' }))

    await waitFor(() => {
      expect(
        screen.getAllByRole('heading', { name: 'All Event Requests' }).length,
      ).toBeGreaterThan(0)
    })
  })
})

import { createElement } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/app/App'
import { resetDataProviderCache } from '@/services/api-client/providerFactory'

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Event Name *'), 'Contoso Ignite 2026')
  await user.type(
    screen.getByLabelText('Event Website *'),
    'https://events.contoso.com/ignite-2026',
  )
  await user.type(screen.getByLabelText('Origin *'), 'Redmond')
  await user.type(screen.getByLabelText('Destination *'), 'London')

  await user.clear(screen.getByLabelText('Registration Fee ($)'))
  await user.type(screen.getByLabelText('Registration Fee ($)'), '500')
}

describe('submit request journey', () => {
  beforeEach(() => {
    resetDataProviderCache()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 200 })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('submits a valid request and shows it in employee history', async () => {
    const user = userEvent.setup()

    render(createElement(App))

    await user.click(screen.getByRole('button', { name: 'New Request' }))

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Submit Request' }))

    await screen.findByText(/submitted with status submitted/i)

    await user.click(screen.getByRole('button', { name: 'Dashboard' }))

    await waitFor(() => {
      expect(screen.getByText(/Contoso Ignite 2026/)).toBeInTheDocument()
    })
  })
})

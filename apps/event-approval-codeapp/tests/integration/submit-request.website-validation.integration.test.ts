import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SubmitRequestPage } from '@/features/submit-request/SubmitRequestPage'
import { resetDataProviderCache } from '@/services/api-client/providerFactory'

async function fillCommonFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Event name'), 'Fabrikam AI Summit')
  await user.type(screen.getByLabelText('Origin'), 'Seattle')
  await user.type(screen.getByLabelText('Destination'), 'Tokyo')
  await user.clear(screen.getByLabelText('Registration'))
  await user.type(screen.getByLabelText('Registration'), '350')
}

describe('website validation behavior', () => {
  beforeEach(() => {
    resetDataProviderCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('blocks invalid non-https website URLs', async () => {
    const user = userEvent.setup()
    render(createElement(SubmitRequestPage))

    await fillCommonFields(user)
    await user.type(screen.getByLabelText('Event website'), 'http://example.com')

    await user.click(screen.getByRole('button', { name: 'Submit request' }))

    expect(await screen.findByText('Event website must use https.')).toBeInTheDocument()
  })

  it('shows non-blocking warning when website is unreachable and still submits', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network timeout')))

    const user = userEvent.setup()
    render(createElement(SubmitRequestPage))

    await fillCommonFields(user)
    await user.type(screen.getByLabelText('Event website'), 'https://example.com')

    await user.click(screen.getByRole('button', { name: 'Submit request' }))

    expect(
      await screen.findByText(/Website could not be reached right now/i),
    ).toBeInTheDocument()
    expect(await screen.findByText(/submitted with status submitted/i)).toBeInTheDocument()
  })
})

import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { SubmitRequestPage } from '@/features/submit-request/SubmitRequestPage'
import { resetDataProviderCache } from '@/services/api-client/providerFactory'

describe('submit request validation errors', () => {
  beforeEach(() => {
    resetDataProviderCache()
  })

  it('shows required-field and zero-cost validation errors', async () => {
    const user = userEvent.setup()

    render(createElement(SubmitRequestPage))

    await user.click(screen.getByRole('button', { name: /Submit Request/i }))

    expect(
      await screen.findByText('Event name is required (min 3 characters).'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('At least one cost category must be greater than zero'),
    ).toBeInTheDocument()
  })
})

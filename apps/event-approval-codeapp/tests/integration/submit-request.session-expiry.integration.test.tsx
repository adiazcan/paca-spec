import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/services/api-client/types'
import { SubmitRequestPage } from '@/features/submit-request/SubmitRequestPage'
import { submitRequest } from '@/services/api-client/requests'

vi.mock('@/services/api-client/requests', () => ({
  submitRequest: vi.fn(),
}))

describe('submit request session expiry handling (Phase 7 - US4)', () => {
  it('T039a prompts re-authentication and preserves form values on UNAUTHORIZED', async () => {
    const user = userEvent.setup()

    vi.mocked(submitRequest).mockRejectedValue(
      new ApiError('UNAUTHORIZED', 'Authentication required', 401),
    )

    render(createElement(SubmitRequestPage))

    await user.type(screen.getByLabelText('Event name'), 'Identity Test Event')
    await user.type(
      screen.getByLabelText('Event website'),
      'https://contoso.com/event',
    )
    await user.type(screen.getByLabelText('Origin'), 'Seattle')
    await user.type(screen.getByLabelText('Destination'), 'Austin')
    await user.clear(screen.getByLabelText('Registration'))
    await user.type(screen.getByLabelText('Registration'), '100')

    await user.click(screen.getByRole('button', { name: 'Submit request' }))

    expect(
      await screen.findByText(
        'Your session expired. Please sign in again and resubmit your request.',
      ),
    ).toBeInTheDocument()

    expect(screen.getByLabelText('Event name')).toHaveValue(
      'Identity Test Event',
    )
    expect(screen.getByLabelText('Origin')).toHaveValue('Seattle')
  })
})

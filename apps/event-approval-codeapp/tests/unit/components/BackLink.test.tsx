import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { BackLink } from '@/components/BackLink'

describe('BackLink', () => {
  it('renders label and invokes callback', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<BackLink label="Back to Dashboard" onClick={onClick} />)

    await user.click(
      screen.getByRole('button', { name: '← Back to Dashboard' }),
    )

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { RequestCard } from '@/components/RequestCard'

describe('RequestCard', () => {
  it('renders request content and invokes view details callback', async () => {
    const user = userEvent.setup()
    const onViewDetails = vi.fn()

    render(
      <RequestCard
        destination="Chicago"
        eventName="React Summit"
        latestComment="Approved quickly"
        onViewDetails={onViewDetails}
        requestId="req-10"
        role="speaker"
        status="approved"
        submittedAt="2026-02-17T08:00:00.000Z"
        submitterDisplayName="Jordan Employee"
        totalCost={1234.56}
      />,
    )

    expect(screen.getByText('React Summit')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('Role: speaker')).toBeInTheDocument()
    expect(screen.getByText('Destination: Chicago')).toBeInTheDocument()
    expect(
      screen.getByText('Requested by: Jordan Employee'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Latest comment: Approved quickly'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'View Details' }))

    expect(onViewDetails).toHaveBeenCalledWith('req-10')
  })
})

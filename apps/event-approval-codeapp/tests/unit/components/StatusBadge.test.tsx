import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from '@/components/StatusBadge'

describe('StatusBadge', () => {
  it('renders user-facing status labels', () => {
    const { rerender } = render(<StatusBadge status="submitted" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()

    rerender(<StatusBadge status="approved" />)
    expect(screen.getByText('Approved')).toBeInTheDocument()

    rerender(<StatusBadge status="rejected" />)
    expect(screen.getByText('Rejected')).toBeInTheDocument()
  })
})

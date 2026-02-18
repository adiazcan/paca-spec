import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from '@/components/StatusBadge'

describe('StatusBadge', () => {
  it('renders user-facing status labels', () => {
    const { rerender } = render(<StatusBadge status="submitted" />)
    expect(screen.getByText('PENDING')).toBeInTheDocument()

    rerender(<StatusBadge status="approved" />)
    expect(screen.getByText('APPROVED')).toBeInTheDocument()

    rerender(<StatusBadge status="rejected" />)
    expect(screen.getByText('REJECTED')).toBeInTheDocument()
  })
})

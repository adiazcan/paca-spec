import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SummaryCards } from '@/components/SummaryCards'

describe('SummaryCards', () => {
  it('renders the four summary counts', () => {
    render(<SummaryCards approved={7} pending={4} rejected={2} total={13} />)

    expect(screen.getByText('Total Requests')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Approved')).toBeInTheDocument()
    expect(screen.getByText('Rejected')).toBeInTheDocument()

    expect(screen.getByText('13')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })
})

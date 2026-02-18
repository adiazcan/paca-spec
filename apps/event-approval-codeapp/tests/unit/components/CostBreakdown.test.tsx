import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CostBreakdown } from '@/components/CostBreakdown'

describe('CostBreakdown', () => {
  it('renders itemized costs and highlighted total', () => {
    render(
      <CostBreakdown
        hotels={300}
        meals={80}
        other={20}
        registration={150}
        total={1050}
        travel={500}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Cost Breakdown' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Registration')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('Hotels')).toBeInTheDocument()
    expect(screen.getByText('Meals')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('$1,050.00')).toBeInTheDocument()
  })
})

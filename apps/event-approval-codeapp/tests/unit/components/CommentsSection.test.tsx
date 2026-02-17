import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CommentsSection } from '@/components/CommentsSection'

describe('CommentsSection', () => {
  it('renders empty state when no comments are provided', () => {
    render(<CommentsSection comments={[]} />)

    expect(screen.getByText('No comments yet')).toBeInTheDocument()
  })

  it('renders comment list with author, content, and timestamp', () => {
    render(
      <CommentsSection
        comments={[
          {
            author: 'Approver',
            content: 'Please provide updated budget details.',
            timestamp: '2026-01-01T00:20:00.000Z',
          },
          {
            author: 'Approver',
            content: 'Approved after budget clarification.',
            timestamp: '2026-01-01T01:10:00.000Z',
          },
        ]}
      />,
    )

    expect(
      screen.getByText('Please provide updated budget details.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Approved after budget clarification.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Approver • 2026-01-01T00:20:00.000Z'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Approver • 2026-01-01T01:10:00.000Z'),
    ).toBeInTheDocument()
  })
})

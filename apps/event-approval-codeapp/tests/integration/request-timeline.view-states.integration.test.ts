import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/services/api-client/types'
import { RequestTimeline } from '@/features/request-history/RequestTimeline'

const { getRequestHistoryMock } = vi.hoisted(() => ({
  getRequestHistoryMock: vi.fn(),
}))

vi.mock('@/services/api-client/history', () => ({
  getRequestHistory: getRequestHistoryMock,
}))

describe('request timeline view states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state while timeline is loading', () => {
    getRequestHistoryMock.mockReturnValue(new Promise(() => undefined))

    render(createElement(RequestTimeline, { requestId: 'request-1' }))

    expect(screen.getByText(/Loading request timeline…/i)).toBeInTheDocument()
  })

  it('renders empty state when timeline has no entries', async () => {
    getRequestHistoryMock.mockResolvedValueOnce([])

    render(createElement(RequestTimeline, { requestId: 'request-1' }))

    expect(await screen.findByText(/No timeline events found\./i)).toBeInTheDocument()
  })

  it('renders error state when timeline load fails', async () => {
    getRequestHistoryMock.mockRejectedValueOnce(new Error('Unable to load request timeline.'))

    render(createElement(RequestTimeline, { requestId: 'request-1' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to load request timeline\./i,
    )
  })

  it('renders stale state when timeline load returns conflict', async () => {
    getRequestHistoryMock.mockRejectedValueOnce(new ApiError('CONFLICT', 'stale', 409))

    render(createElement(RequestTimeline, { requestId: 'request-1' }))

    expect(
      await screen.findByText(/Request timeline is stale\. Reload and try again\./i),
    ).toBeInTheDocument()
  })
})
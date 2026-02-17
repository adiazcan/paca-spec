import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ViewRequestPage } from '@/features/view-request/ViewRequestPage'
import { ApiError } from '@/services/api-client/types'

const { getRequestMock } = vi.hoisted(() => ({
  getRequestMock: vi.fn(),
}))

vi.mock('@/services/api-client/providerFactory', () => ({
  createDataProvider: () => ({
    getRequest: getRequestMock,
  }),
}))

function createRequest() {
  return {
    requestId: 'request-1',
    requestNumber: 'EA-1001',
    submitterId: 'employee-001',
    submitterDisplayName: 'Alex Employee',
    eventName: 'Tech Conference 2026',
    eventWebsite: 'https://events.contoso.example/tech-conf-2026',
    role: 'speaker' as const,
    transportationMode: 'air' as const,
    origin: 'Redmond',
    destination: 'Seattle',
    costEstimate: {
      registration: 400,
      travel: 600,
      hotels: 500,
      meals: 200,
      other: 100,
      currencyCode: 'USD',
      total: 1800,
    },
    status: 'submitted' as const,
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-02-10T00:10:00.000Z',
    submittedAt: '2026-02-10T00:05:00.000Z',
    version: 1,
  }
}

describe('view request page view states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state while request details are loading', () => {
    getRequestMock.mockReturnValue(new Promise(() => undefined))

    render(
      createElement(ViewRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    expect(
      screen.getByText(/Loading request details\.\.\./i),
    ).toBeInTheDocument()
  })

  it('renders error state when request details fail to load', async () => {
    getRequestMock.mockRejectedValueOnce(
      new Error('Unable to load request details.'),
    )

    render(
      createElement(ViewRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to load request details\./i,
    )
  })

  it('renders request details when request loads successfully', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest())

    render(
      createElement(ViewRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    expect(
      await screen.findByRole('heading', { name: /Tech Conference 2026/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Submitted on February 10, 2026/i),
    ).toBeInTheDocument()
  })

  it('renders stale state when request details return conflict', async () => {
    getRequestMock.mockRejectedValueOnce(new ApiError('CONFLICT', 'stale', 409))

    render(
      createElement(ViewRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    expect(
      await screen.findByText(
        /Request details are stale because another update was saved\./i,
      ),
    ).toBeInTheDocument()
  })
})

import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ViewRequestPage } from '@/features/view-request/ViewRequestPage'

const { getRequestMock } = vi.hoisted(() => ({
  getRequestMock: vi.fn(),
}))

vi.mock('@/services/api-client/providerFactory', () => ({
  createDataProvider: () => ({
    getRequest: getRequestMock,
  }),
}))

function createRequest(
  status: 'submitted' | 'approved' | 'rejected' | 'draft' = 'submitted',
) {
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
      registration: 500,
      travel: 700,
      hotels: 400,
      meals: 150,
      other: 50,
      currencyCode: 'USD',
      total: 1800,
    },
    status,
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-02-10T00:10:00.000Z',
    submittedAt: '2026-02-10T00:05:00.000Z',
    version: 1,
  }
}

describe('view request detail rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all key request details and formatted costs', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest())

    render(
      createElement(ViewRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    await screen.findByRole('heading', { name: /Tech Conference 2026/i })

    expect(
      screen.getByText(/Submitted on February 10, 2026/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Alex Employee/i)).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: /events\.contoso\.example\/tech-conf-2026/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Role: Speaker/i)).toBeInTheDocument()
    expect(screen.getByText(/^Flight$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Redmond$/i)).toBeInTheDocument()
    expect(screen.getByText(/^Seattle$/i)).toBeInTheDocument()

    expect(screen.getByText('Registration')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
    expect(screen.getByText('Hotel')).toBeInTheDocument()
    expect(screen.getByText('Meals')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()

    expect(screen.getByText('$500')).toBeInTheDocument()
    expect(screen.getByText('$700')).toBeInTheDocument()
    expect(screen.getByText('$400')).toBeInTheDocument()
    expect(screen.getByText('$150')).toBeInTheDocument()
    expect(screen.getByText('$50')).toBeInTheDocument()
    expect(screen.getByText('$1,800')).toBeInTheDocument()
  })

  it('calls onNavigateBack when back button is clicked', async () => {
    const user = userEvent.setup()
    const onNavigateBack = vi.fn()
    getRequestMock.mockResolvedValueOnce(createRequest())

    render(
      createElement(ViewRequestPage, {
        requestId: 'request-1',
        onNavigateBack,
      }),
    )

    await screen.findByRole('heading', { name: /Tech Conference 2026/i })

    await user.click(screen.getByRole('button', { name: /Back/i }))

    expect(onNavigateBack).toHaveBeenCalledTimes(1)
  })

  it('uses submitted badge variant for submitted requests', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest('submitted'))

    render(
      createElement(ViewRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    const badge = await screen.findByText('Pending')
    expect(badge.className).toContain('status-badge--submitted')
  })

  it('uses approved badge variant for approved requests', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest('approved'))

    render(
      createElement(ViewRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    const badge = await screen.findByText('Approved')
    expect(badge.className).toContain('status-badge--approved')
  })

  it('uses rejected badge variant for rejected requests', async () => {
    getRequestMock.mockResolvedValueOnce(createRequest('rejected'))

    render(
      createElement(ViewRequestPage, {
        requestId: 'request-1',
        onNavigateBack: vi.fn(),
      }),
    )

    const badge = await screen.findByText('Rejected')
    expect(badge.className).toContain('status-badge--rejected')
  })
})

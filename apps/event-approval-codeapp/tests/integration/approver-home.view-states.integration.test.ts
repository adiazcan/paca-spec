import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApproverHomePage } from '@/features/approver-home/ApproverHomePage'

const { listAllRequestsMock } = vi.hoisted(() => ({
  listAllRequestsMock: vi.fn(),
}))

vi.mock('@/services/api-client/providerFactory', () => ({
  createDataProvider: () => ({
    listAllRequests: listAllRequestsMock,
  }),
}))

describe('approver home view states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state while requests are in flight', () => {
    listAllRequestsMock.mockReturnValue(new Promise(() => undefined))

    render(createElement(ApproverHomePage))

    expect(screen.getByText(/Loading team event requests…/i)).toBeInTheDocument()
  })

  it('renders error state when requests fail to load', async () => {
    listAllRequestsMock.mockRejectedValueOnce(new Error('Unable to load team event requests.'))

    render(createElement(ApproverHomePage))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to load team event requests\./i,
    )
  })

  it('renders ready state summary cards and request list', async () => {
    listAllRequestsMock.mockResolvedValueOnce([
      {
        requestId: 'request-1',
        requestNumber: 'EA-1001',
        eventName: 'Global Engineering Summit',
        role: 'speaker',
        status: 'submitted',
        submittedAt: '2026-02-10T00:00:00.000Z',
        submitterDisplayName: 'Alex Employee',
        destination: 'Berlin',
        costTotal: 1800,
      },
      {
        requestId: 'request-2',
        requestNumber: 'EA-1002',
        eventName: 'Cloud Architecture Expo',
        role: 'organizer',
        status: 'approved',
        submittedAt: '2026-02-12T00:00:00.000Z',
        submitterDisplayName: 'Jordan Employee',
        destination: 'Amsterdam',
        costTotal: 1200,
        latestComment: 'Approved for strategic planning.',
      },
    ])

    render(createElement(ApproverHomePage))

    expect(
      await screen.findByRole('heading', { name: /All Event Requests/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Total Requests')).toBeInTheDocument()
    expect(screen.getByText('Pending', { selector: '.stat-card__label' })).toBeInTheDocument()
    expect(screen.getByText('Approved', { selector: '.stat-card__label' })).toBeInTheDocument()
    expect(screen.getByText('Rejected', { selector: '.stat-card__label' })).toBeInTheDocument()
    expect(screen.getByText(/Global Engineering Summit/i)).toBeInTheDocument()
    expect(screen.getByText(/Cloud Architecture Expo/i)).toBeInTheDocument()
  })
})

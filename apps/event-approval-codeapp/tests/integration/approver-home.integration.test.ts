import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

function createApproverRequests() {
  return [
    {
      requestId: 'request-1',
      requestNumber: 'EA-1001',
      eventName: 'Global Engineering Summit',
      role: 'speaker' as const,
      status: 'submitted' as const,
      submittedAt: '2026-02-10T00:00:00.000Z',
      submitterDisplayName: 'Alex Employee',
      destination: 'Berlin',
      costTotal: 1800,
    },
    {
      requestId: 'request-2',
      requestNumber: 'EA-1002',
      eventName: 'Cloud Architecture Expo',
      role: 'organizer' as const,
      status: 'approved' as const,
      submittedAt: '2026-02-12T00:00:00.000Z',
      submitterDisplayName: 'Jordan Employee',
      destination: 'Amsterdam',
      costTotal: 1200,
      latestComment: 'Approved for strategic customer alignment.',
    },
    {
      requestId: 'request-3',
      requestNumber: 'EA-1003',
      eventName: 'Modern Data Platform Forum',
      role: 'assistant' as const,
      status: 'rejected' as const,
      submittedAt: '2026-02-14T00:00:00.000Z',
      submitterDisplayName: 'Riley Employee',
      destination: 'Portland',
      costTotal: 750,
      latestComment: 'Please revise budget and resubmit for next quarter.',
    },
  ]
}

describe('approver home page rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all request details, counts, and formatting', async () => {
    listAllRequestsMock.mockResolvedValueOnce(createApproverRequests())

    render(createElement(ApproverHomePage))

    await screen.findByRole('heading', { name: /All Event Requests/i })

    expect(screen.getByText(/Review and manage event attendance requests from your team/i)).toBeInTheDocument()

    expect(screen.getByText('Total Requests')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Pending', { selector: '.stat-card__label' })).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(3)
    expect(screen.getByText('Approved', { selector: '.stat-card__label' })).toBeInTheDocument()
    expect(screen.getByText('Rejected', { selector: '.stat-card__label' })).toBeInTheDocument()

    expect(screen.getByText(/Global Engineering Summit/i)).toBeInTheDocument()
    expect(screen.getByText(/Cloud Architecture Expo/i)).toBeInTheDocument()
    expect(screen.getByText(/Modern Data Platform Forum/i)).toBeInTheDocument()

    expect(screen.getByText(/Speaker/i)).toBeInTheDocument()
    expect(screen.getByText(/Organizer/i)).toBeInTheDocument()
    expect(screen.getByText(/Assistant/i)).toBeInTheDocument()

    expect(screen.getByText('Feb 10, 2026')).toBeInTheDocument()
    expect(screen.getByText('$1,800')).toBeInTheDocument()
    expect(screen.getByText(/Requested by: Alex Employee/i)).toBeInTheDocument()

    expect(screen.getByText(/Latest comment: Approved for strategic customer alignment\./i)).toBeInTheDocument()
    expect(screen.getByText(/Latest comment: Please revise budget and resubmit for next quarter\./i)).toBeInTheDocument()
  })

  it('shows latest comment only for decided requests', async () => {
    listAllRequestsMock.mockResolvedValueOnce(createApproverRequests())

    render(createElement(ApproverHomePage))

    await screen.findByRole('heading', { name: /All Event Requests/i })

    const comments = screen.getAllByText(/Latest comment:/i)
    expect(comments).toHaveLength(2)
  })

  it('applies status badge variants by status', async () => {
    listAllRequestsMock.mockResolvedValueOnce(createApproverRequests())

    render(createElement(ApproverHomePage))

    const pendingBadge = await screen.findByText('Pending', {
      selector: '.status-badge',
    })
    const approvedBadge = screen.getByText('APPROVED')
    const rejectedBadge = screen.getByText('REJECTED')

    expect(pendingBadge.className).toContain('status-badge--pending')
    expect(approvedBadge.className).toContain('status-badge--approved')
    expect(rejectedBadge.className).toContain('status-badge--rejected')
  })

  it('triggers onViewDetails callback when details link is clicked', async () => {
    const user = userEvent.setup()
    const onViewDetails = vi.fn()
    listAllRequestsMock.mockResolvedValueOnce(createApproverRequests())

    render(createElement(ApproverHomePage, { onViewDetails }))

    const detailsLinks = await screen.findAllByRole('link', {
      name: /View Details/i,
    })

    await user.click(detailsLinks[0])

    expect(onViewDetails).toHaveBeenCalledTimes(1)
    expect(onViewDetails).toHaveBeenCalledWith('request-1')
  })
})

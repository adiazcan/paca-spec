import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/services/api-client/types'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'

const { listNotificationsMock } = vi.hoisted(() => ({
  listNotificationsMock: vi.fn(),
}))

vi.mock('@/services/api-client/notifications', () => ({
  listNotifications: listNotificationsMock,
}))

describe('notifications center view states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state while notifications are loading', () => {
    listNotificationsMock.mockReturnValue(new Promise(() => undefined))

    render(createElement(NotificationsPage))

    expect(screen.getByText(/Loading notifications…/i)).toBeInTheDocument()
  })

  it('renders empty state when notifications are unavailable', async () => {
    listNotificationsMock.mockResolvedValueOnce([])

    render(createElement(NotificationsPage))

    expect(
      await screen.findByText(/No notifications available\./i),
    ).toBeInTheDocument()
  })

  it('renders error state when notifications fail to load', async () => {
    listNotificationsMock.mockRejectedValueOnce(
      new Error('Unable to load notifications.'),
    )

    render(createElement(NotificationsPage))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Unable to load notifications\./i,
    )
  })

  it('renders stale state when notifications conflict is returned', async () => {
    listNotificationsMock.mockRejectedValueOnce(
      new ApiError('CONFLICT', 'stale', 409),
    )

    render(createElement(NotificationsPage))

    expect(
      await screen.findByText(
        /Notifications are stale\. Reload and try again\./i,
      ),
    ).toBeInTheDocument()
  })
})

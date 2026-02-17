import { describe, expect, it } from 'vitest'

import { MockDataProvider } from '@/services/mocks/mockDataProvider'

describe('GET /notifications contract', () => {
  it('returns notifications for current user', async () => {
    const provider = new MockDataProvider()

    const items = await provider.listNotifications()

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.recipientId === 'employee-001')).toBe(
      true,
    )
  })

  it('returns payload fields with request id, status, and comment', async () => {
    const provider = new MockDataProvider()

    const items = await provider.listNotifications()

    expect(items[0]).toEqual(
      expect.objectContaining({
        notificationId: expect.any(String),
        requestId: expect.any(String),
        recipientId: expect.any(String),
        channel: 'in_app',
        payload: expect.objectContaining({
          requestId: expect.any(String),
          status: expect.any(String),
          comment: expect.any(String),
        }),
        deliveryStatus: expect.any(String),
        createdAt: expect.any(String),
      }),
    )
  })
})

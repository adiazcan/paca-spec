import { describe, expect, it } from 'vitest'

import { createFixtureSeed } from '@/services/mocks/fixtures'
import { MockDataProvider } from '@/services/mocks/mockDataProvider'

describe('indefinite retention retrieval', () => {
  it('keeps aged records retrievable in requests, history, and notifications', async () => {
    const seed = createFixtureSeed()
    const historicalTimestamp = '1999-06-01T12:00:00.000Z'
    const targetRequest = seed.requests[0]

    targetRequest.createdAt = historicalTimestamp
    targetRequest.updatedAt = historicalTimestamp
    targetRequest.submittedAt = historicalTimestamp

    seed.historyEntries
      .filter((entry) => entry.requestId === targetRequest.requestId)
      .forEach((entry) => {
        entry.occurredAt = historicalTimestamp
      })

    seed.notifications.push({
      notificationId: '00000000-0000-4000-8000-000000000777',
      requestId: targetRequest.requestId,
      recipientId: targetRequest.submitterId,
      channel: 'in_app',
      payload: {
        requestId: targetRequest.requestId,
        status: targetRequest.status,
        comment: 'Historical notification retained',
      },
      deliveryStatus: 'sent',
      createdAt: historicalTimestamp,
      sentAt: historicalTimestamp,
    })

    const provider = new MockDataProvider(seed)

    const requests = await provider.listMyRequests(undefined, {
      currentUser: {
        userId: targetRequest.submitterId,
        displayName: targetRequest.submitterDisplayName,
        role: 'employee',
      },
    })
    const history = await provider.getRequestHistory(targetRequest.requestId)
    const notifications = await provider.listNotifications({
      currentUser: {
        userId: targetRequest.submitterId,
        displayName: targetRequest.submitterDisplayName,
        role: 'employee',
      },
    })

    expect(requests.some((request) => request.requestId === targetRequest.requestId)).toBe(
      true,
    )
    expect(history.some((entry) => entry.occurredAt === historicalTimestamp)).toBe(true)
    expect(
      notifications.some(
        (notification) =>
          notification.requestId === targetRequest.requestId &&
          notification.createdAt === historicalTimestamp,
      ),
    ).toBe(true)
  })
})
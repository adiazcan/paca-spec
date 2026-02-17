import { describe, expect, it } from 'vitest'

import { MockDataProvider } from '@/services/mocks/mockDataProvider'

describe('status-change notification creation', () => {
  it('creates a notification with request id, status, and latest comment after decision', async () => {
    const provider = new MockDataProvider()
    const pending = await provider.listPendingApprovals()
    const request = await provider.getRequest(pending[0].requestId)

    await provider.decideRequest(request.requestId, {
      decisionType: 'approved',
      comment: 'Approved for strategic alignment.',
      version: request.version,
    })

    const notifications = await provider.listNotifications({
      currentUser: {
        userId: request.submitterId,
        displayName: request.submitterDisplayName,
        role: 'employee',
      },
    })

    const latest = notifications[notifications.length - 1]
    expect(latest).toEqual(
      expect.objectContaining({
        requestId: request.requestId,
        recipientId: request.submitterId,
        payload: {
          requestId: request.requestId,
          status: 'approved',
          comment: 'Approved for strategic alignment.',
        },
      }),
    )
  })
})

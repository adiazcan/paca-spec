import { describe, expect, it } from 'vitest'

import { MockDataProvider } from '@/services/mocks/mockDataProvider'

describe('GET /requests/{requestId}/history contract', () => {
  it('returns immutable lifecycle history entries for a request', async () => {
    const provider = new MockDataProvider()
    const pending = await provider.listPendingApprovals()

    const items = await provider.getRequestHistory(pending[0].requestId)

    expect(items.length).toBeGreaterThan(0)
    expect(
      items.every((entry) => entry.requestId === pending[0].requestId),
    ).toBe(true)
  })

  it('returns timeline payload fields for each history entry', async () => {
    const provider = new MockDataProvider()
    const pending = await provider.listPendingApprovals()

    const items = await provider.getRequestHistory(pending[0].requestId)

    expect(items[0]).toEqual(
      expect.objectContaining({
        historyEntryId: expect.any(String),
        requestId: pending[0].requestId,
        eventType: expect.any(String),
        actorId: expect.any(String),
        actorRole: expect.any(String),
        occurredAt: expect.any(String),
      }),
    )
  })
})

import { describe, expect, it } from 'vitest'

import { createFixtureSeed } from '@/services/mocks/fixtures'
import { MockDataProvider } from '@/services/mocks/mockDataProvider'

describe('audit retrieval contract', () => {
  it('applies history retrieval filters by event type and time range', async () => {
    const seed = createFixtureSeed()
    const approvedRequest = seed.requests.find(
      (request) => request.status === 'approved',
    )

    if (!approvedRequest) {
      throw new Error('Expected approved request in fixture seed')
    }

    const provider = new MockDataProvider(seed)
    const allItems = await provider.getRequestHistory(approvedRequest.requestId)
    const approvedEntry = allItems.find(
      (entry) => entry.eventType === 'approved',
    )

    if (!approvedEntry) {
      throw new Error('Expected approved history entry in fixture seed')
    }

    const filtered = await provider.getRequestHistory(
      approvedRequest.requestId,
      {
        eventTypes: ['approved'],
        from: approvedEntry.occurredAt,
        to: approvedEntry.occurredAt,
      },
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0].eventType).toBe('approved')
    expect(filtered[0].occurredAt).toBe(approvedEntry.occurredAt)
  })

  it('keeps audit entries retrievable for historical records under indefinite retention', async () => {
    const seed = createFixtureSeed()
    const approvedRequest = seed.requests.find(
      (request) => request.status === 'approved',
    )

    if (!approvedRequest) {
      throw new Error('Expected approved request in fixture seed')
    }

    const oldTimestamp = '2000-01-01T00:00:00.000Z'

    seed.historyEntries.push({
      historyEntryId: '00000000-0000-4000-8000-000000000999',
      requestId: approvedRequest.requestId,
      eventType: 'commented',
      actorId: 'approver-legacy',
      actorRole: 'approver',
      comment: 'Archived audit note',
      occurredAt: oldTimestamp,
    })

    const provider = new MockDataProvider(seed)
    const items = await provider.getRequestHistory(approvedRequest.requestId)

    expect(items.some((entry) => entry.occurredAt === oldTimestamp)).toBe(true)
  })
})

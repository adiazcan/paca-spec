import { describe, expect, it } from 'vitest'

import { MockDataProvider } from '@/services/mocks/mockDataProvider'

describe('GET /approvals/pending contract', () => {
  it('returns only requests in submitted status', async () => {
    const provider = new MockDataProvider()

    const items = await provider.listPendingApprovals()

    expect(items.length).toBeGreaterThan(0)
    expect(items.every((item) => item.status === 'submitted')).toBe(true)
  })

  it('returns summary payload fields for each pending request', async () => {
    const provider = new MockDataProvider()

    const items = await provider.listPendingApprovals()

    expect(items[0]).toEqual(
      expect.objectContaining({
        requestId: expect.any(String),
        requestNumber: expect.any(String),
        eventName: expect.any(String),
        role: expect.any(String),
        status: 'submitted',
        submittedAt: expect.any(String),
      }),
    )
  })
})

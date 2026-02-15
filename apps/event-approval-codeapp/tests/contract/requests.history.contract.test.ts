import { describe, expect, it } from 'vitest'

import { MockDataProvider } from '@/services/mocks/mockDataProvider'

describe('GET /requests/history contract', () => {
  it('returns employee request history summaries', async () => {
    const provider = new MockDataProvider()

    const items = await provider.listMyRequests(undefined, {
      currentUser: {
        userId: 'employee-001',
        displayName: 'Alex Employee',
        role: 'employee',
      },
    })

    expect(items.length).toBeGreaterThan(0)
    expect(items[0]).toEqual(
      expect.objectContaining({
        requestId: expect.any(String),
        requestNumber: expect.any(String),
        eventName: expect.any(String),
        role: expect.any(String),
        status: expect.any(String),
      }),
    )
  })

  it('supports status filtering for employee history', async () => {
    const provider = new MockDataProvider()

    const submittedOnly = await provider.listMyRequests(
      { status: 'submitted' },
      {
        currentUser: {
          userId: 'employee-001',
          displayName: 'Alex Employee',
          role: 'employee',
        },
      },
    )

    expect(submittedOnly.length).toBeGreaterThan(0)
    expect(submittedOnly.every((item) => item.status === 'submitted')).toBe(
      true,
    )
  })
})

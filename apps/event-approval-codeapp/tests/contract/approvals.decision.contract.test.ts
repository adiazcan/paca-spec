import { describe, expect, it } from 'vitest'

import { MockDataProvider } from '@/services/mocks/mockDataProvider'

describe('POST /approvals/{requestId}/decision contract', () => {
  it('records an approval decision for a pending request', async () => {
    const provider = new MockDataProvider()
    const pending = await provider.listPendingApprovals()

    const request = await provider.getRequest(pending[0].requestId)
    const decision = await provider.decideRequest(request.requestId, {
      decisionType: 'approved',
      comment: 'Approved with budget confirmation.',
      version: request.version,
    })

    expect(decision).toEqual(
      expect.objectContaining({
        decisionId: expect.any(String),
        requestId: request.requestId,
        decisionType: 'approved',
        comment: 'Approved with budget confirmation.',
      }),
    )

    const updated = await provider.getRequest(request.requestId)
    expect(updated.status).toBe('approved')
    expect(updated.version).toBe(request.version + 1)
  })

  it('returns 409 conflict when request version is stale', async () => {
    const provider = new MockDataProvider()
    const pending = await provider.listPendingApprovals()
    const request = await provider.getRequest(pending[0].requestId)

    await provider.decideRequest(request.requestId, {
      decisionType: 'approved',
      comment: 'First decision',
      version: request.version,
    })

    await expect(
      provider.decideRequest(request.requestId, {
        decisionType: 'rejected',
        comment: 'Second decision with stale version',
        version: request.version,
      }),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      status: 409,
    })
  })
})

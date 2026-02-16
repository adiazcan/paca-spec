import { describe, expect, it } from 'vitest'

import type { SubmitRequestInput } from '@/models/eventApproval'
import { MockDataProvider } from '@/services/mocks/mockDataProvider'

function buildValidPayload(): SubmitRequestInput {
  return {
    eventName: 'Contoso Ignite 2026',
    eventWebsite: 'https://events.contoso.com/ignite-2026',
    role: 'speaker',
    transportationMode: 'air',
    origin: 'Redmond',
    destination: 'London',
    costEstimate: {
      registration: 500,
      travel: 1200,
      hotels: 800,
      meals: 200,
      other: 100,
      currencyCode: 'USD',
      total: 2800,
    },
  }
}

describe('POST /requests contract', () => {
  it('accepts a valid request and returns submitted status', async () => {
    const provider = new MockDataProvider()

    const response = await provider.submitRequest(buildValidPayload())

    expect(response.requestId).toMatch(
      /^00000000-0000-4000-8000-[0-9a-f]{12}$/,
    )
    expect(response.status).toBe('submitted')
    expect(response.submittedAt).not.toBeNull()
    expect(response.requestNumber).toMatch(/^EA-\d+$/)
  })

  it('rejects payloads with missing required fields', async () => {
    const provider = new MockDataProvider()
    const invalidPayload = {
      ...buildValidPayload(),
      eventName: '',
    }

    await expect(provider.submitRequest(invalidPayload)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    })
  })

  it('rejects payloads where all cost categories are zero', async () => {
    const provider = new MockDataProvider()
    const invalidPayload = {
      ...buildValidPayload(),
      costEstimate: {
        registration: 0,
        travel: 0,
        hotels: 0,
        meals: 0,
        other: 0,
        currencyCode: 'USD',
        total: 0,
      },
    }

    await expect(provider.submitRequest(invalidPayload)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    })
  })
})

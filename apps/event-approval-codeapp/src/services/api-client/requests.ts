import type {
  EventApprovalRequest,
  EventApprovalRequestSummary,
  RequestStatus,
  SubmitRequestInput,
} from '@/models/eventApproval'
import {
  createApiError,
  type ProviderContext,
} from '@/services/api-client/types'
import {
  getWebsiteReachabilityWarning,
  validateSubmitRequestInput,
} from '@/features/submit-request/submitRequestSchema'
import { recordPerfMetric } from '@/app/perfMetrics'

import { createDataProvider } from './providerFactory'

export interface SubmitRequestResult {
  request: EventApprovalRequest
  websiteWarning: string | null
}

export async function submitRequest(
  input: SubmitRequestInput,
  context?: ProviderContext,
): Promise<SubmitRequestResult> {
  return recordPerfMetric('submit-request', async () => {
    const validation = validateSubmitRequestInput(input)

    if (!validation.data) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Request payload failed validation',
        400,
        {
          errors: validation.errors,
        },
      )
    }

    const websiteWarning = await getWebsiteReachabilityWarning(
      validation.data.eventWebsite,
    )

    const provider = createDataProvider()
    const request = await provider.submitRequest(validation.data, context)

    return {
      request,
      websiteWarning,
    }
  })
}

export async function listMyRequests(
  status?: RequestStatus,
  context?: ProviderContext,
): Promise<EventApprovalRequestSummary[]> {
  const provider = createDataProvider()

  return provider.listMyRequests({ status }, context)
}

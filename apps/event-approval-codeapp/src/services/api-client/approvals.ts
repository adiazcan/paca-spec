import type {
  ApprovalDecision,
  DecisionInput,
  EventApprovalRequestSummary,
} from '@/models/eventApproval'
import { decisionInputSchema } from '@/validation/schemas'
import { recordPerfMetric } from '@/app/perfMetrics'

import { createDataProvider } from './providerFactory'
import { createApiError, type ProviderContext } from './types'

export async function listPendingApprovals(): Promise<
  EventApprovalRequestSummary[]
> {
  const provider = createDataProvider()

  return recordPerfMetric('dashboard-load', async () =>
    provider.listPendingApprovals(),
  )
}

export async function decideRequest(
  requestId: string,
  input: DecisionInput,
  context?: ProviderContext,
): Promise<ApprovalDecision> {
  const parsed = decisionInputSchema.safeParse(input)

  if (!parsed.success) {
    throw createApiError(
      'VALIDATION_ERROR',
      'Decision payload failed validation',
      400,
      {
        errors: parsed.error.issues,
      },
    )
  }

  const provider = createDataProvider()
  return recordPerfMetric('decision-propagation', async () =>
    provider.decideRequest(requestId, parsed.data, context),
  )
}

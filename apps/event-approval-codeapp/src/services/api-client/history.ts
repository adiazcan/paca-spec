import type { RequestHistoryEntry } from '@/models/eventApproval'
import { requestHistoryEntrySchema } from '@/validation/schemas'
import { recordPerfMetric } from '@/app/perfMetrics'

import { createDataProvider } from './providerFactory'
import { createApiError, type RequestHistoryQueryOptions } from './types'

export async function getRequestHistory(
  requestId: string,
  options?: RequestHistoryQueryOptions,
): Promise<RequestHistoryEntry[]> {
  return recordPerfMetric('history-retrieval', async () => {
    const provider = createDataProvider()
    const items = await provider.getRequestHistory(requestId, options)

    const parsed = requestHistoryEntrySchema.array().safeParse(items)
    if (!parsed.success) {
      throw createApiError('UNKNOWN', 'Invalid request timeline payload', 500, {
        issues: parsed.error.issues,
      })
    }

    return parsed.data.sort((left, right) =>
      left.occurredAt.localeCompare(right.occurredAt),
    )
  })
}

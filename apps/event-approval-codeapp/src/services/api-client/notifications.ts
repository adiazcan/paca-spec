import type { StatusNotification } from '@/models/eventApproval'
import { statusNotificationSchema } from '@/validation/schemas'

import { createDataProvider } from './providerFactory'
import { createApiError, type ProviderContext } from './types'

export async function listNotifications(
  context?: ProviderContext,
): Promise<StatusNotification[]> {
  const provider = createDataProvider()
  const items = await provider.listNotifications(context)

  const parsed = statusNotificationSchema.array().safeParse(items)
  if (!parsed.success) {
    throw createApiError('UNKNOWN', 'Invalid notifications payload', 500, {
      issues: parsed.error.issues,
    })
  }

  return parsed.data
}

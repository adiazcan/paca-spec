import { z } from 'zod'

import type { SubmitRequestInput } from '@/models/eventApproval'

const httpsWebsiteSchema = z.url('Event website must be a valid URL.').refine(
  (value) => {
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  },
  {
    message: 'Event website must use https.',
  },
)

export const submitRequestBusinessSchema = z.object({
  eventName: z
    .string()
    .trim()
    .min(3, 'Event name is required (min 3 characters).')
    .max(200),
  eventWebsite: httpsWebsiteSchema,
  role: z.enum(['speaker', 'organizer', 'assistant']),
  transportationMode: z.enum(['air', 'rail', 'car', 'bus', 'other']),
  origin: z.string().trim().min(1, 'Origin is required.').max(150),
  destination: z.string().trim().min(1, 'Destination is required.').max(150),
  costEstimate: z
    .object({
      registration: z.number().nonnegative(),
      travel: z.number().nonnegative(),
      hotels: z.number().nonnegative(),
      meals: z.number().nonnegative(),
      other: z.number().nonnegative(),
      currencyCode: z.string().trim().length(3),
      total: z.number().nonnegative(),
    })
    .refine(
      (cost) =>
        cost.registration +
          cost.travel +
          cost.hotels +
          cost.meals +
          cost.other >
        0,
      {
        message: 'At least one cost category must be greater than zero',
        path: ['total'],
      },
    ),
})

export interface SubmitRequestValidationResult {
  data?: SubmitRequestInput
  errors: Record<string, string>
}

export function validateSubmitRequestInput(
  input: SubmitRequestInput,
): SubmitRequestValidationResult {
  const result = submitRequestBusinessSchema.safeParse(input)

  if (result.success) {
    return {
      data: result.data,
      errors: {},
    }
  }

  const errors = result.error.issues.reduce<Record<string, string>>(
    (accumulator, issue) => {
      const key = issue.path.join('.') || 'form'
      if (!(key in accumulator)) {
        accumulator[key] = issue.message
      }

      return accumulator
    },
    {},
  )

  return { errors }
}

export async function getWebsiteReachabilityWarning(
  websiteUrl: string,
): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1500)

    await fetch(websiteUrl, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return null
  } catch {
    return 'Website could not be reached right now. You can still submit and verify details later.'
  }
}

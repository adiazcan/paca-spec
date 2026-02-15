import { z } from 'zod'

import {
  actorRoles,
  decisionTypes,
  historyEventTypes,
  requestStatuses,
  roleTypes,
  transportationModes,
} from '@/models/eventApproval'

export const costEstimateSchema = z
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
      cost.registration + cost.travel + cost.hotels + cost.meals + cost.other >
      0,
    {
      message: 'At least one cost category must be greater than zero',
      path: ['total'],
    },
  )

export const submitRequestInputSchema = z.object({
  eventName: z.string().trim().min(3).max(200),
  eventWebsite: z.url(),
  role: z.enum(roleTypes),
  transportationMode: z.enum(transportationModes),
  origin: z.string().trim().min(1).max(150),
  destination: z.string().trim().min(1).max(150),
  costEstimate: costEstimateSchema,
})

export const decisionInputSchema = z.object({
  decisionType: z.enum(decisionTypes),
  comment: z.string().trim().min(1).max(2000),
  version: z.number().int().min(1),
})

export const requestHistoryEntrySchema = z.object({
  historyEntryId: z.uuid(),
  requestId: z.uuid(),
  eventType: z.enum(historyEventTypes),
  actorId: z.string().trim().min(1),
  actorRole: z.enum(actorRoles),
  comment: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  occurredAt: z.iso.datetime(),
})

export const requestStatusSchema = z.enum(requestStatuses)

export const statusNotificationSchema = z.object({
  notificationId: z.uuid(),
  requestId: z.uuid(),
  recipientId: z.string().trim().min(1),
  channel: z.enum(['in_app', 'email', 'teams']),
  payload: z.object({
    requestId: z.uuid(),
    status: requestStatusSchema,
    comment: z.string(),
  }),
  deliveryStatus: z.enum(['queued', 'sent', 'failed']),
  createdAt: z.iso.datetime(),
  sentAt: z.iso.datetime().nullable(),
})

export type SubmitRequestInputSchema = z.infer<typeof submitRequestInputSchema>
export type DecisionInputSchema = z.infer<typeof decisionInputSchema>
export type RequestHistoryEntrySchema = z.infer<
  typeof requestHistoryEntrySchema
>
export type StatusNotificationSchema = z.infer<typeof statusNotificationSchema>

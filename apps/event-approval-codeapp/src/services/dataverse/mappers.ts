import type {
  ActorRole,
  ApprovalDecision,
  DecisionType,
  EventApprovalRequest,
  HistoryEventType,
  NotificationChannel,
  NotificationDeliveryStatus,
  RequestHistoryEntry,
  RequestStatus,
  RoleType,
  StatusNotification,
  TransportationMode,
} from '@/models/eventApproval'
import type {
  Paca_approvaldecisions,
  Paca_approvaldecisionsBase,
  Paca_approvaldecisionspaca_decisiontypecode,
} from '@/generated/models/Paca_approvaldecisionsModel'
import type {
  Paca_eventapprovalrequests,
  Paca_eventapprovalrequestsBase,
  Paca_eventapprovalrequestspaca_rolecode,
  Paca_eventapprovalrequestspaca_statuscode,
  Paca_eventapprovalrequestspaca_transportationmodecode,
} from '@/generated/models/Paca_eventapprovalrequestsModel'
import type {
  Paca_requesthistoryentries,
  Paca_requesthistoryentriesBase,
  Paca_requesthistoryentriespaca_actorrolecode,
  Paca_requesthistoryentriespaca_eventtypecode,
} from '@/generated/models/Paca_requesthistoryentriesModel'
import type {
  Paca_statusnotifications,
  Paca_statusnotificationsBase,
  Paca_statusnotificationspaca_channelcode,
  Paca_statusnotificationspaca_deliverystatuscode,
} from '@/generated/models/Paca_statusnotificationsModel'

const ROLE_TYPE_TO_CHOICE: Record<RoleType, number> = {
  speaker: 0,
  organizer: 1,
  assistant: 2,
}

const TRANSPORTATION_MODE_TO_CHOICE: Record<TransportationMode, number> = {
  air: 0,
  rail: 1,
  car: 2,
  bus: 3,
  other: 4,
}

const REQUEST_STATUS_TO_CHOICE: Record<RequestStatus, number> = {
  draft: 0,
  submitted: 1,
  approved: 2,
  rejected: 3,
}

const DECISION_TYPE_TO_CHOICE: Record<DecisionType, number> = {
  approved: 0,
  rejected: 1,
}

const HISTORY_EVENT_TYPE_TO_CHOICE: Record<HistoryEventType, number> = {
  submitted: 0,
  approved: 1,
  rejected: 2,
  commented: 3,
  notification_sent: 4,
  stale_detected: 5,
}

const ACTOR_ROLE_TO_CHOICE: Record<ActorRole, number> = {
  employee: 0,
  approver: 1,
  system: 2,
}

const NOTIFICATION_CHANNEL_TO_CHOICE: Record<NotificationChannel, number> = {
  in_app: 0,
  email: 1,
  teams: 2,
}

const NOTIFICATION_DELIVERY_STATUS_TO_CHOICE: Record<NotificationDeliveryStatus, number> = {
  queued: 0,
  sent: 1,
  failed: 2,
}

function parseChoiceValue(value: unknown, fieldName: string): number {
  const parsed = typeof value === 'string' ? Number(value) : Number(value)

  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid choice value for ${fieldName}: ${String(value)}`)
  }

  return parsed
}

function parseNumericValue(value: string | number | undefined, fieldName: string): number {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${fieldName}: ${String(value)}`)
  }

  return parsed
}

function requireLookupId(
  readLookupId: string | undefined,
  fallbackLookupBind: string | undefined,
  fieldName: string,
): string {
  if (typeof readLookupId === 'string' && readLookupId.length > 0) {
    return readLookupId
  }

  if (typeof fallbackLookupBind === 'string') {
    const match = fallbackLookupBind.match(/\(([^)]+)\)$/)
    if (match?.[1]) {
      return match[1]
    }
  }

  throw new Error(`Missing lookup id for ${fieldName}`)
}

function parseMetadata(metadata: string | undefined): Record<string, unknown> | undefined {
  if (!metadata) {
    return undefined
  }

  try {
    const parsed = JSON.parse(metadata) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return undefined
  } catch {
    return undefined
  }
}

function parseNotificationPayload(payload: string): StatusNotification['payload'] {
  const parsed = JSON.parse(payload) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Invalid notification payload')
  }

  const payloadRecord = parsed as Record<string, unknown>

  if (
    typeof payloadRecord.requestId !== 'string' ||
    typeof payloadRecord.status !== 'string' ||
    typeof payloadRecord.comment !== 'string'
  ) {
    throw new Error('Invalid notification payload shape')
  }

  return {
    requestId: payloadRecord.requestId,
    status: payloadRecord.status as RequestStatus,
    comment: payloadRecord.comment,
  }
}

export function roleTypeToChoice(value: RoleType): number {
  return ROLE_TYPE_TO_CHOICE[value]
}

export function roleTypeFromChoice(value: unknown): RoleType {
  switch (parseChoiceValue(value, 'RoleType')) {
    case 0:
      return 'speaker'
    case 1:
      return 'organizer'
    case 2:
      return 'assistant'
    default:
      throw new Error(`Unknown RoleType choice value: ${String(value)}`)
  }
}

export function transportationModeToChoice(value: TransportationMode): number {
  return TRANSPORTATION_MODE_TO_CHOICE[value]
}

export function transportationModeFromChoice(value: unknown): TransportationMode {
  switch (parseChoiceValue(value, 'TransportationMode')) {
    case 0:
      return 'air'
    case 1:
      return 'rail'
    case 2:
      return 'car'
    case 3:
      return 'bus'
    case 4:
      return 'other'
    default:
      throw new Error(`Unknown TransportationMode choice value: ${String(value)}`)
  }
}

export function requestStatusToChoice(value: RequestStatus): number {
  return REQUEST_STATUS_TO_CHOICE[value]
}

export function requestStatusFromChoice(value: unknown): RequestStatus {
  switch (parseChoiceValue(value, 'RequestStatus')) {
    case 0:
      return 'draft'
    case 1:
      return 'submitted'
    case 2:
      return 'approved'
    case 3:
      return 'rejected'
    default:
      throw new Error(`Unknown RequestStatus choice value: ${String(value)}`)
  }
}

export function decisionTypeToChoice(value: DecisionType): number {
  return DECISION_TYPE_TO_CHOICE[value]
}

export function decisionTypeFromChoice(value: unknown): DecisionType {
  switch (parseChoiceValue(value, 'DecisionType')) {
    case 0:
      return 'approved'
    case 1:
      return 'rejected'
    default:
      throw new Error(`Unknown DecisionType choice value: ${String(value)}`)
  }
}

export function historyEventTypeToChoice(value: HistoryEventType): number {
  return HISTORY_EVENT_TYPE_TO_CHOICE[value]
}

export function historyEventTypeFromChoice(value: unknown): HistoryEventType {
  switch (parseChoiceValue(value, 'HistoryEventType')) {
    case 0:
      return 'submitted'
    case 1:
      return 'approved'
    case 2:
      return 'rejected'
    case 3:
      return 'commented'
    case 4:
      return 'notification_sent'
    case 5:
      return 'stale_detected'
    default:
      throw new Error(`Unknown HistoryEventType choice value: ${String(value)}`)
  }
}

export function actorRoleToChoice(value: ActorRole): number {
  return ACTOR_ROLE_TO_CHOICE[value]
}

export function actorRoleFromChoice(value: unknown): ActorRole {
  switch (parseChoiceValue(value, 'ActorRole')) {
    case 0:
      return 'employee'
    case 1:
      return 'approver'
    case 2:
      return 'system'
    default:
      throw new Error(`Unknown ActorRole choice value: ${String(value)}`)
  }
}

export function notificationChannelToChoice(value: NotificationChannel): number {
  return NOTIFICATION_CHANNEL_TO_CHOICE[value]
}

export function notificationChannelFromChoice(value: unknown): NotificationChannel {
  switch (parseChoiceValue(value, 'NotificationChannel')) {
    case 0:
      return 'in_app'
    case 1:
      return 'email'
    case 2:
      return 'teams'
    default:
      throw new Error(`Unknown NotificationChannel choice value: ${String(value)}`)
  }
}

export function notificationDeliveryStatusToChoice(
  value: NotificationDeliveryStatus,
): number {
  return NOTIFICATION_DELIVERY_STATUS_TO_CHOICE[value]
}

export function notificationDeliveryStatusFromChoice(
  value: unknown,
): NotificationDeliveryStatus {
  switch (parseChoiceValue(value, 'NotificationDeliveryStatus')) {
    case 0:
      return 'queued'
    case 1:
      return 'sent'
    case 2:
      return 'failed'
    default:
      throw new Error(
        `Unknown NotificationDeliveryStatus choice value: ${String(value)}`,
      )
  }
}

export function assembleCostEstimateFromRequestRow(
  row: Pick<
    Paca_eventapprovalrequests,
    | 'paca_registrationfee'
    | 'paca_travelcost'
    | 'paca_hotelcost'
    | 'paca_mealscost'
    | 'paca_otherexpenses'
    | 'paca_currencycode'
    | 'paca_totalcost'
  >,
): EventApprovalRequest['costEstimate'] {
  return {
    registration: parseNumericValue(row.paca_registrationfee, 'paca_registrationfee'),
    travel: parseNumericValue(row.paca_travelcost, 'paca_travelcost'),
    hotels: parseNumericValue(row.paca_hotelcost, 'paca_hotelcost'),
    meals: parseNumericValue(row.paca_mealscost, 'paca_mealscost'),
    other: parseNumericValue(row.paca_otherexpenses, 'paca_otherexpenses'),
    currencyCode: row.paca_currencycode,
    total: parseNumericValue(row.paca_totalcost, 'paca_totalcost'),
  }
}

export function mapEventApprovalRequestRowToDomain(
  row: Paca_eventapprovalrequests,
): EventApprovalRequest {
  return {
    requestId: row.paca_eventapprovalrequestid,
    requestNumber: row.paca_requestnumber,
    submitterId: row.paca_submitterid,
    submitterDisplayName: row.paca_submitterdisplayname,
    eventName: row.paca_eventname,
    eventWebsite: row.paca_eventwebsite,
    role: roleTypeFromChoice(row.paca_rolecode),
    transportationMode: transportationModeFromChoice(
      row.paca_transportationmodecode,
    ),
    origin: row.paca_origin,
    destination: row.paca_destination,
    costEstimate: assembleCostEstimateFromRequestRow(row),
    status: requestStatusFromChoice(row.paca_statuscode),
    createdAt: row.createdon ?? '',
    updatedAt: row.modifiedon ?? row.createdon ?? '',
    submittedAt: row.paca_submittedat ?? null,
    version: parseNumericValue(row.paca_version, 'paca_version'),
  }
}

export type EventApprovalRequestUpsertRow = Partial<
  Omit<Paca_eventapprovalrequestsBase, 'paca_eventapprovalrequestid'>
>

export function mapEventApprovalRequestDomainToRow(
  request: EventApprovalRequest,
): EventApprovalRequestUpsertRow {
  return {
    paca_requestnumber: request.requestNumber,
    paca_submitterid: request.submitterId,
    paca_submitterdisplayname: request.submitterDisplayName,
    paca_eventname: request.eventName,
    paca_eventwebsite: request.eventWebsite,
    paca_rolecode: roleTypeToChoice(
      request.role,
    ) as Paca_eventapprovalrequestspaca_rolecode,
    paca_transportationmodecode: transportationModeToChoice(
      request.transportationMode,
    ) as Paca_eventapprovalrequestspaca_transportationmodecode,
    paca_origin: request.origin,
    paca_destination: request.destination,
    paca_registrationfee: String(request.costEstimate.registration),
    paca_travelcost: String(request.costEstimate.travel),
    paca_hotelcost: String(request.costEstimate.hotels),
    paca_mealscost: String(request.costEstimate.meals),
    paca_otherexpenses: String(request.costEstimate.other),
    paca_currencycode: request.costEstimate.currencyCode,
    paca_totalcost: String(request.costEstimate.total),
    paca_statuscode: requestStatusToChoice(
      request.status,
    ) as Paca_eventapprovalrequestspaca_statuscode,
    paca_submittedat: request.submittedAt ?? undefined,
    paca_version: String(request.version),
  }
}

export function mapApprovalDecisionRowToDomain(
  row: Paca_approvaldecisions,
): ApprovalDecision {
  return {
    decisionId: row.paca_approvaldecisionid,
    requestId: requireLookupId(
      row._paca_requestid_value,
      row['paca_requestid@odata.bind'],
      'paca_requestid',
    ),
    approverId: row.paca_approverid,
    approverDisplayName: row.paca_approverdisplayname,
    decisionType: decisionTypeFromChoice(row.paca_decisiontypecode),
    comment: row.paca_comment,
    decidedAt: row.paca_decidedat,
  }
}

export type ApprovalDecisionUpsertRow = Partial<
  Omit<Paca_approvaldecisionsBase, 'paca_approvaldecisionid'>
>

export function mapApprovalDecisionDomainToRow(
  decision: ApprovalDecision,
): ApprovalDecisionUpsertRow {
  return {
    paca_approverid: decision.approverId,
    paca_approverdisplayname: decision.approverDisplayName,
    paca_comment: decision.comment,
    paca_decidedat: decision.decidedAt,
    paca_decisiontypecode: decisionTypeToChoice(
      decision.decisionType,
    ) as Paca_approvaldecisionspaca_decisiontypecode,
    'paca_requestid@odata.bind': `/paca_eventapprovalrequests(${decision.requestId})`,
  }
}

export function mapRequestHistoryEntryRowToDomain(
  row: Paca_requesthistoryentries,
): RequestHistoryEntry {
  return {
    historyEntryId: row.paca_requesthistoryentryid,
    requestId: requireLookupId(
      row._paca_requestid_value,
      row['paca_requestid@odata.bind'],
      'paca_requestid',
    ),
    eventType: historyEventTypeFromChoice(row.paca_eventtypecode),
    actorId: row.paca_actorid,
    actorRole: actorRoleFromChoice(row.paca_actorrolecode),
    comment: row.paca_comment,
    metadata: parseMetadata(row.paca_metadata),
    occurredAt: row.paca_occurredat,
  }
}

export type RequestHistoryEntryUpsertRow = Partial<
  Omit<Paca_requesthistoryentriesBase, 'paca_requesthistoryentryid'>
>

export function mapRequestHistoryEntryDomainToRow(
  entry: RequestHistoryEntry,
): RequestHistoryEntryUpsertRow {
  return {
    paca_actorid: entry.actorId,
    paca_actorrolecode: actorRoleToChoice(
      entry.actorRole,
    ) as Paca_requesthistoryentriespaca_actorrolecode,
    paca_comment: entry.comment,
    paca_eventtypecode: historyEventTypeToChoice(
      entry.eventType,
    ) as Paca_requesthistoryentriespaca_eventtypecode,
    paca_metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
    paca_occurredat: entry.occurredAt,
    'paca_requestid@odata.bind': `/paca_eventapprovalrequests(${entry.requestId})`,
  }
}

export function mapStatusNotificationRowToDomain(
  row: Paca_statusnotifications,
): StatusNotification {
  return {
    notificationId: row.paca_statusnotificationid,
    requestId: requireLookupId(
      row._paca_requestid_value,
      row['paca_requestid@odata.bind'],
      'paca_requestid',
    ),
    recipientId: row.paca_recipientid,
    channel: notificationChannelFromChoice(row.paca_channelcode),
    payload: parseNotificationPayload(row.paca_payload),
    deliveryStatus: notificationDeliveryStatusFromChoice(
      row.paca_deliverystatuscode,
    ),
    createdAt: row.createdon ?? '',
    sentAt: row.paca_sentat ?? null,
  }
}

export type StatusNotificationUpsertRow = Partial<
  Omit<Paca_statusnotificationsBase, 'paca_statusnotificationid'>
>

export function mapStatusNotificationDomainToRow(
  notification: StatusNotification,
): StatusNotificationUpsertRow {
  return {
    paca_recipientid: notification.recipientId,
    paca_channelcode: notificationChannelToChoice(
      notification.channel,
    ) as Paca_statusnotificationspaca_channelcode,
    paca_payload: JSON.stringify(notification.payload),
    paca_deliverystatuscode: notificationDeliveryStatusToChoice(
      notification.deliveryStatus,
    ) as Paca_statusnotificationspaca_deliverystatuscode,
    paca_sentat: notification.sentAt ?? undefined,
    'paca_requestid@odata.bind': `/paca_eventapprovalrequests(${notification.requestId})`,
  }
}

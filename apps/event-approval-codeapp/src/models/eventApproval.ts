export const roleTypes = ['speaker', 'organizer', 'assistant'] as const
export type RoleType = (typeof roleTypes)[number]

export const transportationModes = [
  'air',
  'rail',
  'car',
  'bus',
  'other',
] as const
export type TransportationMode = (typeof transportationModes)[number]

export const requestStatuses = [
  'draft',
  'submitted',
  'approved',
  'rejected',
] as const
export type RequestStatus = (typeof requestStatuses)[number]

export const decisionTypes = ['approved', 'rejected'] as const
export type DecisionType = (typeof decisionTypes)[number]

export const actorRoles = ['employee', 'approver', 'system'] as const
export type ActorRole = (typeof actorRoles)[number]

export const historyEventTypes = [
  'submitted',
  'approved',
  'rejected',
  'commented',
  'notification_sent',
  'stale_detected',
] as const
export type HistoryEventType = (typeof historyEventTypes)[number]

export const notificationChannels = ['in_app', 'email', 'teams'] as const
export type NotificationChannel = (typeof notificationChannels)[number]

export const notificationDeliveryStatuses = [
  'queued',
  'sent',
  'failed',
] as const
export type NotificationDeliveryStatus =
  (typeof notificationDeliveryStatuses)[number]

export interface CostEstimate {
  registration: number
  travel: number
  hotels: number
  meals: number
  other: number
  currencyCode: string
  total: number
}

export interface SubmitRequestInput {
  eventName: string
  eventWebsite: string
  role: RoleType
  transportationMode: TransportationMode
  origin: string
  destination: string
  costEstimate: CostEstimate
}

export interface EventApprovalRequest {
  requestId: string
  requestNumber: string
  submitterId: string
  submitterDisplayName: string
  eventName: string
  eventWebsite: string
  role: RoleType
  transportationMode: TransportationMode
  origin: string
  destination: string
  costEstimate: CostEstimate
  status: RequestStatus
  createdAt: string
  updatedAt: string
  submittedAt: string | null
  version: number
}

export interface EventApprovalRequestSummary {
  requestId: string
  requestNumber: string
  eventName: string
  role: RoleType
  status: RequestStatus
  submittedAt: string | null
  destination?: string
  totalCost?: number
  submitterDisplayName?: string
  latestComment?: string
}

export interface DashboardSummary {
  total: number
  pending: number
  approved: number
  rejected: number
}

export interface RequestCardData {
  requestId: string
  eventName: string
  status: RequestStatus
  role: RoleType
  submittedAt: string | null
  destination: string
  totalCost: number
  submitterDisplayName?: string
  latestComment?: string
}

export interface RequestDetailData {
  requestId: string
  eventName: string
  status: RequestStatus
  submittedAt: string | null
  submitterDisplayName: string
  eventWebsite: string
  role: RoleType
  transportationMode: TransportationMode
  origin: string
  destination: string
  costEstimate: CostEstimate
  version: number
}

export const appScreens = [
  'employee-dashboard',
  'new-request',
  'view-request',
  'approver-dashboard',
  'approve-request',
] as const
export type AppScreen = (typeof appScreens)[number]

export interface AppNavState {
  role: 'employee' | 'approver'
  screen: AppScreen
  selectedRequestId: string | null
}

export interface DecisionInput {
  decisionType: DecisionType
  comment: string
  version: number
}

export interface ApprovalDecision {
  decisionId: string
  requestId: string
  approverId: string
  approverDisplayName: string
  decisionType: DecisionType
  comment: string
  decidedAt: string
}

export interface RequestHistoryEntry {
  historyEntryId: string
  requestId: string
  eventType: HistoryEventType
  actorId: string
  actorRole: ActorRole
  comment?: string
  metadata?: Record<string, unknown>
  occurredAt: string
}

export interface NotificationPayload {
  requestId: string
  status: RequestStatus
  comment: string
}

export interface StatusNotification {
  notificationId: string
  requestId: string
  recipientId: string
  channel: NotificationChannel
  payload: NotificationPayload
  deliveryStatus: NotificationDeliveryStatus
  createdAt: string
  sentAt: string | null
}

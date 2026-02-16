import type {
  ApprovalDecision,
  EventApprovalRequest,
  RequestHistoryEntry,
  StatusNotification,
} from '@/models/eventApproval'

export interface FixtureSeed {
  requests: EventApprovalRequest[]
  decisions: ApprovalDecision[]
  historyEntries: RequestHistoryEntry[]
  notifications: StatusNotification[]
}

const baseTimestamp = new Date('2026-01-01T09:00:00.000Z').getTime()

function deterministicUuid(index: number): string {
  return `00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`
}

function offsetIso(minutes: number): string {
  return new Date(baseTimestamp + minutes * 60_000).toISOString()
}

export function createFixtureSeed(): FixtureSeed {
  const requestSubmitted: EventApprovalRequest = {
    requestId: deterministicUuid(101),
    requestNumber: 'EA-1001',
    submitterId: 'employee-001',
    submitterDisplayName: 'Alex Employee',
    eventName: 'Global Engineering Summit',
    eventWebsite: 'https://events.contoso.example/summit',
    role: 'speaker',
    transportationMode: 'air',
    origin: 'Redmond',
    destination: 'Berlin',
    costEstimate: {
      registration: 499,
      travel: 1200,
      hotels: 850,
      meals: 280,
      other: 100,
      currencyCode: 'USD',
      total: 2929,
    },
    status: 'submitted',
    createdAt: offsetIso(0),
    updatedAt: offsetIso(15),
    submittedAt: offsetIso(15),
    version: 1,
  }

  const requestApproved: EventApprovalRequest = {
    requestId: deterministicUuid(102),
    requestNumber: 'EA-1002',
    submitterId: 'employee-001',
    submitterDisplayName: 'Alex Employee',
    eventName: 'Cloud Architecture Expo',
    eventWebsite: 'https://events.fabrikam.example/cloud-expo',
    role: 'organizer',
    transportationMode: 'rail',
    origin: 'Paris',
    destination: 'Amsterdam',
    costEstimate: {
      registration: 350,
      travel: 200,
      hotels: 420,
      meals: 150,
      other: 80,
      currencyCode: 'EUR',
      total: 1200,
    },
    status: 'approved',
    createdAt: offsetIso(30),
    updatedAt: offsetIso(70),
    submittedAt: offsetIso(40),
    version: 2,
  }

  const decision: ApprovalDecision = {
    decisionId: deterministicUuid(201),
    requestId: requestApproved.requestId,
    approverId: 'approver-001',
    approverDisplayName: 'Ari Approver',
    decisionType: 'approved',
    comment: 'Approved for strategic customer alignment.',
    decidedAt: offsetIso(70),
  }

  const historyEntries: RequestHistoryEntry[] = [
    {
      historyEntryId: deterministicUuid(301),
      requestId: requestSubmitted.requestId,
      eventType: 'submitted',
      actorId: 'employee-001',
      actorRole: 'employee',
      occurredAt: offsetIso(15),
    },
    {
      historyEntryId: deterministicUuid(302),
      requestId: requestApproved.requestId,
      eventType: 'submitted',
      actorId: 'employee-001',
      actorRole: 'employee',
      occurredAt: offsetIso(40),
    },
    {
      historyEntryId: deterministicUuid(303),
      requestId: requestApproved.requestId,
      eventType: 'approved',
      actorId: 'approver-001',
      actorRole: 'approver',
      comment: decision.comment,
      occurredAt: offsetIso(70),
    },
  ]

  const notifications: StatusNotification[] = [
    {
      notificationId: deterministicUuid(401),
      requestId: requestApproved.requestId,
      recipientId: requestApproved.submitterId,
      channel: 'in_app',
      payload: {
        requestId: requestApproved.requestId,
        status: requestApproved.status,
        comment: decision.comment,
      },
      deliveryStatus: 'sent',
      createdAt: offsetIso(71),
      sentAt: offsetIso(72),
    },
  ]

  return {
    requests: [requestSubmitted, requestApproved],
    decisions: [decision],
    historyEntries,
    notifications,
  }
}

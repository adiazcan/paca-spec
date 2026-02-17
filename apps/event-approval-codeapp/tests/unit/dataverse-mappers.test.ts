import { describe, expect, it } from 'vitest'
import type {
  ApprovalDecision,
  EventApprovalRequest,
  RequestHistoryEntry,
  StatusNotification,
} from '@/models/eventApproval'
import {
  actorRoleFromChoice,
  actorRoleToChoice,
  decisionTypeFromChoice,
  decisionTypeToChoice,
  historyEventTypeFromChoice,
  historyEventTypeToChoice,
  mapApprovalDecisionDomainToRow,
  mapApprovalDecisionRowToDomain,
  mapEventApprovalRequestDomainToRow,
  mapEventApprovalRequestRowToDomain,
  mapRequestHistoryEntryDomainToRow,
  mapRequestHistoryEntryRowToDomain,
  mapStatusNotificationDomainToRow,
  mapStatusNotificationRowToDomain,
  notificationChannelFromChoice,
  notificationChannelToChoice,
  notificationDeliveryStatusFromChoice,
  notificationDeliveryStatusToChoice,
  requestStatusFromChoice,
  requestStatusToChoice,
  roleTypeFromChoice,
  roleTypeToChoice,
  transportationModeFromChoice,
  transportationModeToChoice,
} from '@/services/dataverse/mappers'

describe('dataverse mappers', () => {
  it('roundtrips all choice mappings', () => {
    expect(roleTypeFromChoice(roleTypeToChoice('speaker'))).toBe('speaker')
    expect(roleTypeFromChoice(roleTypeToChoice('organizer'))).toBe('organizer')
    expect(roleTypeFromChoice(roleTypeToChoice('assistant'))).toBe('assistant')

    expect(
      transportationModeFromChoice(transportationModeToChoice('air')),
    ).toBe('air')
    expect(
      transportationModeFromChoice(transportationModeToChoice('rail')),
    ).toBe('rail')
    expect(
      transportationModeFromChoice(transportationModeToChoice('car')),
    ).toBe('car')
    expect(
      transportationModeFromChoice(transportationModeToChoice('bus')),
    ).toBe('bus')
    expect(
      transportationModeFromChoice(transportationModeToChoice('other')),
    ).toBe('other')

    expect(requestStatusFromChoice(requestStatusToChoice('draft'))).toBe(
      'draft',
    )
    expect(requestStatusFromChoice(requestStatusToChoice('submitted'))).toBe(
      'submitted',
    )
    expect(requestStatusFromChoice(requestStatusToChoice('approved'))).toBe(
      'approved',
    )
    expect(requestStatusFromChoice(requestStatusToChoice('rejected'))).toBe(
      'rejected',
    )

    expect(decisionTypeFromChoice(decisionTypeToChoice('approved'))).toBe(
      'approved',
    )
    expect(decisionTypeFromChoice(decisionTypeToChoice('rejected'))).toBe(
      'rejected',
    )

    expect(
      historyEventTypeFromChoice(historyEventTypeToChoice('submitted')),
    ).toBe('submitted')
    expect(
      historyEventTypeFromChoice(historyEventTypeToChoice('approved')),
    ).toBe('approved')
    expect(
      historyEventTypeFromChoice(historyEventTypeToChoice('rejected')),
    ).toBe('rejected')
    expect(
      historyEventTypeFromChoice(historyEventTypeToChoice('commented')),
    ).toBe('commented')
    expect(
      historyEventTypeFromChoice(historyEventTypeToChoice('notification_sent')),
    ).toBe('notification_sent')
    expect(
      historyEventTypeFromChoice(historyEventTypeToChoice('stale_detected')),
    ).toBe('stale_detected')

    expect(actorRoleFromChoice(actorRoleToChoice('employee'))).toBe('employee')
    expect(actorRoleFromChoice(actorRoleToChoice('approver'))).toBe('approver')
    expect(actorRoleFromChoice(actorRoleToChoice('system'))).toBe('system')

    expect(
      notificationChannelFromChoice(notificationChannelToChoice('in_app')),
    ).toBe('in_app')
    expect(
      notificationChannelFromChoice(notificationChannelToChoice('email')),
    ).toBe('email')
    expect(
      notificationChannelFromChoice(notificationChannelToChoice('teams')),
    ).toBe('teams')

    expect(
      notificationDeliveryStatusFromChoice(
        notificationDeliveryStatusToChoice('queued'),
      ),
    ).toBe('queued')
    expect(
      notificationDeliveryStatusFromChoice(
        notificationDeliveryStatusToChoice('sent'),
      ),
    ).toBe('sent')
    expect(
      notificationDeliveryStatusFromChoice(
        notificationDeliveryStatusToChoice('failed'),
      ),
    ).toBe('failed')
  })

  it('maps event approval request rows both directions with cost assembly', () => {
    const dataverseRow = {
      paca_eventapprovalrequestid: 'req-1',
      paca_requestnumber: 'EA-1001',
      paca_submitterid: 'user-1',
      paca_submitterdisplayname: 'Taylor Approver',
      paca_eventname: 'Build 2026',
      paca_eventwebsite: 'https://example.com/build',
      paca_rolecode: 1,
      paca_transportationmodecode: 0,
      paca_origin: 'Seattle',
      paca_destination: 'Las Vegas',
      paca_registrationfee: '100',
      paca_travelcost: '500',
      paca_hotelcost: '400',
      paca_mealscost: '125',
      paca_otherexpenses: '50',
      paca_currencycode: 'USD',
      paca_totalcost: '1175',
      paca_statuscode: 1,
      paca_submittedat: '2026-02-16T10:00:00.000Z',
      paca_version: '2',
      createdon: '2026-02-16T10:00:00.000Z',
      modifiedon: '2026-02-16T11:00:00.000Z',
    }

    const mapped = mapEventApprovalRequestRowToDomain(dataverseRow as never)

    expect(mapped.costEstimate).toEqual({
      registration: 100,
      travel: 500,
      hotels: 400,
      meals: 125,
      other: 50,
      currencyCode: 'USD',
      total: 1175,
    })
    expect(mapped.role).toBe('organizer')
    expect(mapped.transportationMode).toBe('air')
    expect(mapped.status).toBe('submitted')
    expect(mapped.version).toBe(2)

    const reverse = mapEventApprovalRequestDomainToRow(mapped)
    expect(reverse.paca_rolecode).toBe(1)
    expect(reverse.paca_transportationmodecode).toBe(0)
    expect(reverse.paca_statuscode).toBe(1)
    expect(reverse.paca_totalcost).toBe('1175')
  })

  it('maps approval decision rows both directions', () => {
    const domainDecision: ApprovalDecision = {
      decisionId: 'dec-1',
      requestId: 'req-1',
      approverId: 'approver-1',
      approverDisplayName: 'Avery Approver',
      decisionType: 'approved',
      comment: 'Looks good',
      decidedAt: '2026-02-16T12:00:00.000Z',
    }

    const row = mapApprovalDecisionDomainToRow(domainDecision)
    expect(row.paca_decisiontypecode).toBe(0)
    expect(row['paca_requestid@odata.bind']).toBe(
      '/paca_eventapprovalrequests(req-1)',
    )

    const mappedBack = mapApprovalDecisionRowToDomain({
      paca_approvaldecisionid: 'dec-1',
      paca_approverid: 'approver-1',
      paca_approverdisplayname: 'Avery Approver',
      paca_comment: 'Looks good',
      paca_decidedat: '2026-02-16T12:00:00.000Z',
      paca_decisiontypecode: 0,
      _paca_requestid_value: 'req-1',
    } as never)

    expect(mappedBack).toEqual(domainDecision)
  })

  it('maps request history rows both directions', () => {
    const entry: RequestHistoryEntry = {
      historyEntryId: 'hist-1',
      requestId: 'req-1',
      eventType: 'notification_sent',
      actorId: 'system-1',
      actorRole: 'system',
      comment: 'Sent via Teams',
      metadata: { channel: 'teams' },
      occurredAt: '2026-02-16T12:10:00.000Z',
    }

    const row = mapRequestHistoryEntryDomainToRow(entry)
    expect(row.paca_eventtypecode).toBe(4)
    expect(row.paca_actorrolecode).toBe(2)
    expect(row.paca_metadata).toBe('{"channel":"teams"}')

    const mappedBack = mapRequestHistoryEntryRowToDomain({
      paca_requesthistoryentryid: 'hist-1',
      _paca_requestid_value: 'req-1',
      paca_eventtypecode: 4,
      paca_actorid: 'system-1',
      paca_actorrolecode: 2,
      paca_comment: 'Sent via Teams',
      paca_metadata: '{"channel":"teams"}',
      paca_occurredat: '2026-02-16T12:10:00.000Z',
    } as never)

    expect(mappedBack).toEqual(entry)
  })

  it('maps status notification rows both directions', () => {
    const notification: StatusNotification = {
      notificationId: 'noti-1',
      requestId: 'req-1',
      recipientId: 'user-1',
      channel: 'teams',
      payload: {
        requestId: 'req-1',
        status: 'approved',
        comment: 'Approved by manager',
      },
      deliveryStatus: 'sent',
      createdAt: '2026-02-16T12:30:00.000Z',
      sentAt: '2026-02-16T12:30:01.000Z',
    }

    const row = mapStatusNotificationDomainToRow(notification)
    expect(row.paca_channelcode).toBe(2)
    expect(row.paca_deliverystatuscode).toBe(1)
    expect(row.paca_payload).toContain('"status":"approved"')

    const mappedBack = mapStatusNotificationRowToDomain({
      paca_statusnotificationid: 'noti-1',
      _paca_requestid_value: 'req-1',
      paca_recipientid: 'user-1',
      paca_channelcode: 2,
      paca_payload:
        '{"requestId":"req-1","status":"approved","comment":"Approved by manager"}',
      paca_deliverystatuscode: 1,
      createdon: '2026-02-16T12:30:00.000Z',
      paca_sentat: '2026-02-16T12:30:01.000Z',
    } as never)

    expect(mappedBack).toEqual(notification)
  })

  it('throws on unsupported choice values', () => {
    expect(() => roleTypeFromChoice(999)).toThrow(/Unknown RoleType/)
    expect(() => requestStatusFromChoice(999)).toThrow(/Unknown RequestStatus/)
    expect(() => notificationChannelFromChoice(999)).toThrow(
      /Unknown NotificationChannel/,
    )
  })

  it('handles lookup ids from bind fallback', () => {
    const mapped = mapApprovalDecisionRowToDomain({
      paca_approvaldecisionid: 'dec-1',
      paca_approverid: 'approver-1',
      paca_approverdisplayname: 'Avery Approver',
      paca_comment: 'Approved',
      paca_decidedat: '2026-02-16T12:00:00.000Z',
      paca_decisiontypecode: 0,
      'paca_requestid@odata.bind': '/paca_eventapprovalrequests(req-2)',
    } as never)

    expect(mapped.requestId).toBe('req-2')
  })

  it('supports a full request row roundtrip', () => {
    const domainRequest: EventApprovalRequest = {
      requestId: 'req-200',
      requestNumber: 'EA-200',
      submitterId: 'user-200',
      submitterDisplayName: 'Jordan Employee',
      eventName: 'Ignite',
      eventWebsite: 'https://example.com/ignite',
      role: 'speaker',
      transportationMode: 'rail',
      origin: 'Austin',
      destination: 'Chicago',
      costEstimate: {
        registration: 120,
        travel: 300,
        hotels: 400,
        meals: 80,
        other: 20,
        currencyCode: 'USD',
        total: 920,
      },
      status: 'approved',
      createdAt: '2026-02-16T09:00:00.000Z',
      updatedAt: '2026-02-16T10:00:00.000Z',
      submittedAt: '2026-02-16T09:10:00.000Z',
      version: 4,
    }

    const row = mapEventApprovalRequestDomainToRow(domainRequest)
    const mappedBack = mapEventApprovalRequestRowToDomain({
      paca_eventapprovalrequestid: domainRequest.requestId,
      paca_requestnumber: String(row.paca_requestnumber),
      paca_submitterid: String(row.paca_submitterid),
      paca_submitterdisplayname: String(row.paca_submitterdisplayname),
      paca_eventname: String(row.paca_eventname),
      paca_eventwebsite: String(row.paca_eventwebsite),
      paca_rolecode: Number(row.paca_rolecode),
      paca_transportationmodecode: Number(row.paca_transportationmodecode),
      paca_origin: String(row.paca_origin),
      paca_destination: String(row.paca_destination),
      paca_registrationfee: String(row.paca_registrationfee),
      paca_travelcost: String(row.paca_travelcost),
      paca_hotelcost: String(row.paca_hotelcost),
      paca_mealscost: String(row.paca_mealscost),
      paca_otherexpenses: String(row.paca_otherexpenses),
      paca_currencycode: String(row.paca_currencycode),
      paca_totalcost: String(row.paca_totalcost),
      paca_statuscode: Number(row.paca_statuscode),
      paca_submittedat: row.paca_submittedat,
      paca_version: String(row.paca_version),
      createdon: domainRequest.createdAt,
      modifiedon: domainRequest.updatedAt,
    } as never)

    expect(mappedBack).toEqual(domainRequest)
  })
})

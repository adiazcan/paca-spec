import type {
  ApprovalDecision,
  DecisionInput,
  EventApprovalRequest,
  EventApprovalRequestSummary,
  RequestHistoryEntry,
  StatusNotification,
  SubmitRequestInput,
} from '@/models/eventApproval'
import {
  decisionInputSchema,
  submitRequestInputSchema,
} from '@/validation/schemas'
import {
  createApiError,
  type IDataProvider,
  type ListMyRequestsOptions,
  type RequestHistoryQueryOptions,
  type ProviderContext,
} from '@/services/api-client/types'

import { createFixtureSeed, type FixtureSeed } from './fixtures'

const defaultEmployee = {
  userId: 'employee-001',
  displayName: 'Alex Employee',
  role: 'employee' as const,
}

const defaultApprover = {
  userId: 'approver-001',
  displayName: 'Ari Approver',
  role: 'approver' as const,
}

export class MockDataProvider implements IDataProvider {
  private readonly requests: EventApprovalRequest[]
  private readonly decisions: ApprovalDecision[]
  private readonly historyEntries: RequestHistoryEntry[]
  private readonly notifications: StatusNotification[]
  private idCounter: number

  public constructor(seed: FixtureSeed = createFixtureSeed()) {
    this.requests = seed.requests.map((request) => ({ ...request }))
    this.decisions = seed.decisions.map((decision) => ({ ...decision }))
    this.historyEntries = seed.historyEntries.map((entry) => ({ ...entry }))
    this.notifications = seed.notifications.map((item) => ({ ...item }))
    this.idCounter =
      this.requests.length +
      this.decisions.length +
      this.historyEntries.length +
      this.notifications.length +
      1
  }

  public async submitRequest(
    input: SubmitRequestInput,
    context?: ProviderContext,
  ): Promise<EventApprovalRequest> {
    const parsedInput = submitRequestInputSchema.safeParse(input)

    if (!parsedInput.success) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Request payload failed validation',
        400,
        {
          issues: parsedInput.error.issues,
        },
      )
    }

    const now = new Date().toISOString()
    const submitter = context?.currentUser ?? defaultEmployee
    const request: EventApprovalRequest = {
      requestId: this.generateUuid(),
      requestNumber: `EA-${1000 + this.requests.length + 1}`,
      submitterId: submitter.userId,
      submitterDisplayName: submitter.displayName,
      eventName: parsedInput.data.eventName,
      eventWebsite: parsedInput.data.eventWebsite,
      role: parsedInput.data.role,
      transportationMode: parsedInput.data.transportationMode,
      origin: parsedInput.data.origin,
      destination: parsedInput.data.destination,
      costEstimate: parsedInput.data.costEstimate,
      status: 'submitted',
      createdAt: now,
      updatedAt: now,
      submittedAt: now,
      version: 1,
    }

    this.requests.unshift(request)
    this.appendHistory({
      requestId: request.requestId,
      eventType: 'submitted',
      actorId: submitter.userId,
      actorRole: 'employee',
      occurredAt: now,
    })

    return { ...request }
  }

  public async listMyRequests(
    options?: ListMyRequestsOptions,
    context?: ProviderContext,
  ): Promise<EventApprovalRequestSummary[]> {
    const currentUser = context?.currentUser ?? defaultEmployee

    return this.requests
      .filter((request) => request.submitterId === currentUser.userId)
      .filter((request) =>
        this.shouldRetainRecord(request.submittedAt ?? request.createdAt),
      )
      .filter((request) =>
        options?.status ? request.status === options.status : true,
      )
      .map((request) => this.toSummary(request))
  }

  public async listAllRequests(): Promise<EventApprovalRequestSummary[]> {
    return this.requests
      .filter((request) =>
        this.shouldRetainRecord(request.submittedAt ?? request.createdAt),
      )
      .map((request) => this.toSummary(request))
  }

  public async getRequest(requestId: string): Promise<EventApprovalRequest> {
    const request = this.requests.find((item) => item.requestId === requestId)

    if (!request || !this.shouldRetainRecord(request.submittedAt ?? request.createdAt)) {
      throw createApiError(
        'NOT_FOUND',
        `Request ${requestId} was not found`,
        404,
      )
    }

    return { ...request }
  }

  public async listPendingApprovals(): Promise<EventApprovalRequestSummary[]> {
    return this.requests
      .filter(
        (request) =>
          request.status === 'submitted' &&
          this.shouldRetainRecord(request.submittedAt ?? request.createdAt),
      )
      .map((request) => this.toSummary(request))
  }

  public async decideRequest(
    requestId: string,
    input: DecisionInput,
    context?: ProviderContext,
  ): Promise<ApprovalDecision> {
    const parsedDecision = decisionInputSchema.safeParse(input)

    if (!parsedDecision.success) {
      throw createApiError(
        'VALIDATION_ERROR',
        'Decision payload failed validation',
        400,
        {
          issues: parsedDecision.error.issues,
        },
      )
    }

    const requestIndex = this.findRequestIndexOrThrow(requestId)
    const existingRequest = this.requests[requestIndex]

    this.assertVersion(existingRequest, parsedDecision.data.version)

    if (existingRequest.status !== 'submitted') {
      throw createApiError(
        'CONFLICT',
        'Request is no longer pending review',
        409,
      )
    }

    const actor = context?.currentUser ?? defaultApprover
    const now = new Date().toISOString()

    const decision: ApprovalDecision = {
      decisionId: this.generateUuid(),
      requestId,
      approverId: actor.userId,
      approverDisplayName: actor.displayName,
      decisionType: parsedDecision.data.decisionType,
      comment: parsedDecision.data.comment,
      decidedAt: now,
    }

    this.decisions.push(decision)
    this.requests[requestIndex] = this.applyFinalDecisionTransition(
      existingRequest,
      parsedDecision.data,
      now,
    )

    this.appendHistory({
      requestId,
      eventType: parsedDecision.data.decisionType,
      actorId: actor.userId,
      actorRole: 'approver',
      comment: parsedDecision.data.comment,
      occurredAt: now,
      metadata: {
        version: this.requests[requestIndex].version,
      },
    })

    const notification = this.createStatusNotification(
      this.requests[requestIndex],
      parsedDecision.data.comment,
      now,
    )
    this.notifications.push(notification)

    this.appendHistory({
      requestId,
      eventType: 'notification_sent',
      actorId: 'system',
      actorRole: 'system',
      comment: `Status notification ${notification.notificationId} created for ${notification.recipientId}.`,
      occurredAt: now,
      metadata: {
        notificationId: notification.notificationId,
        deliveryStatus: notification.deliveryStatus,
      },
    })

    return { ...decision }
  }

  public async getRequestHistory(
    requestId: string,
    options?: RequestHistoryQueryOptions,
  ): Promise<RequestHistoryEntry[]> {
    return this.historyEntries
      .filter((entry) => entry.requestId === requestId)
      .filter((entry) => this.shouldRetainRecord(entry.occurredAt))
      .filter((entry) =>
        options?.eventTypes?.length
          ? options.eventTypes.includes(entry.eventType)
          : true,
      )
      .filter((entry) => (options?.from ? entry.occurredAt >= options.from : true))
      .filter((entry) => (options?.to ? entry.occurredAt <= options.to : true))
      .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt))
      .map((entry) => ({ ...entry }))
  }

  public async listNotifications(
    context?: ProviderContext,
  ): Promise<StatusNotification[]> {
    const currentUser = context?.currentUser ?? defaultEmployee

    return this.notifications
      .filter((notification) => notification.recipientId === currentUser.userId)
      .filter((notification) => this.shouldRetainRecord(notification.createdAt))
      .map((notification) => ({ ...notification }))
  }

  private shouldRetainRecord(_timestamp: string): boolean {
    return true
  }

  private toSummary(
    request: EventApprovalRequest,
  ): EventApprovalRequestSummary {
    const latestDecision = this.decisions
      .filter((decision) => decision.requestId === request.requestId)
      .sort((left, right) => right.decidedAt.localeCompare(left.decidedAt))[0]

    return {
      requestId: request.requestId,
      requestNumber: request.requestNumber,
      eventName: request.eventName,
      role: request.role,
      status: request.status,
      submittedAt: request.submittedAt,
      submitterDisplayName: request.submitterDisplayName,
      destination: request.destination,
      costTotal: request.costEstimate.total,
      latestComment: latestDecision?.comment,
    }
  }

  private findRequestIndexOrThrow(requestId: string): number {
    const requestIndex = this.requests.findIndex(
      (request) => request.requestId === requestId,
    )

    if (requestIndex < 0) {
      throw createApiError(
        'NOT_FOUND',
        `Request ${requestId} was not found`,
        404,
      )
    }

    return requestIndex
  }

  private assertVersion(
    request: EventApprovalRequest,
    expectedVersion: number,
  ): void {
    if (request.version !== expectedVersion) {
      this.appendHistory({
        requestId: request.requestId,
        eventType: 'stale_detected',
        actorId: 'system',
        actorRole: 'system',
        comment: `Version mismatch. Expected ${expectedVersion}, received ${request.version}.`,
        occurredAt: new Date().toISOString(),
      })

      throw createApiError(
        'CONFLICT',
        'Request version is stale. Reload and retry.',
        409,
        {
          expectedVersion,
          currentVersion: request.version,
        },
      )
    }
  }

  private applyFinalDecisionTransition(
    request: EventApprovalRequest,
    input: DecisionInput,
    now: string,
  ): EventApprovalRequest {
    return {
      ...request,
      status: input.decisionType,
      updatedAt: now,
      version: request.version + 1,
    }
  }

  private appendHistory(
    entry: Omit<RequestHistoryEntry, 'historyEntryId'> & {
      historyEntryId?: string
    },
  ): void {
    this.historyEntries.push({
      historyEntryId: entry.historyEntryId ?? this.generateUuid(),
      ...entry,
    })
  }

  private createStatusNotification(
    request: EventApprovalRequest,
    comment: string,
    createdAt: string,
  ): StatusNotification {
    return {
      notificationId: this.generateUuid(),
      requestId: request.requestId,
      recipientId: request.submitterId,
      channel: 'in_app',
      payload: {
        requestId: request.requestId,
        status: request.status,
        comment,
      },
      deliveryStatus: 'queued',
      createdAt,
      sentAt: null,
    }
  }

  private generateUuid(): string {
    const nextId = this.idCounter
    this.idCounter += 1

    return `00000000-0000-4000-8000-${nextId.toString(16).padStart(12, '0')}`
  }
}

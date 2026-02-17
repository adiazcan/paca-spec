/* eslint-disable @typescript-eslint/no-explicit-any */
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
  createApiError,
  type IDataProvider,
  type ListMyRequestsOptions,
  type RequestHistoryQueryOptions,
  type ProviderContext,
} from '@/services/api-client/types'
import { Paca_eventapprovalrequestsService } from '@/generated/services/Paca_eventapprovalrequestsService'
import { Paca_approvaldecisionsService } from '@/generated/services/Paca_approvaldecisionsService'
import { Paca_requesthistoryentriesService } from '@/generated/services/Paca_requesthistoryentriesService'
import { Paca_statusnotificationsService } from '@/generated/services/Paca_statusnotificationsService'
import {
  mapEventApprovalRequestRowToDomain,
  mapApprovalDecisionRowToDomain,
  mapRequestHistoryEntryRowToDomain,
  mapStatusNotificationRowToDomain,
  requestStatusToChoice,
  requestStatusFromChoice,
  roleTypeToChoice,
  roleTypeFromChoice,
  transportationModeToChoice,
  decisionTypeToChoice,
  historyEventTypeToChoice,
  actorRoleToChoice,
} from './mappers'
import { identityService } from './identityService'

/**
 * Helper function to map Dataverse service errors to ApiError codes
 *
 * Maps common Dataverse error scenarios:
 * - 404: NOT_FOUND
 * - 409/412: CONFLICT (optimistic concurrency)
 * - 403: FORBIDDEN (insufficient privileges)
 * - 401: UNAUTHORIZED
 * - Network errors: UNKNOWN with user-friendly message
 */
function handleDataverseError(error: unknown, context: string): never {
  // If already an ApiError, rethrow
  if (error instanceof Error && error.name === 'ApiError') {
    throw error
  }

  // Handle standard error objects
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase()

    // HTTP 404 - Not Found
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      throw createApiError('NOT_FOUND', `${context}: Resource not found`, 404)
    }

    // HTTP 409/412 - Conflict (concurrency or constraint violation)
    if (
      errorMessage.includes('conflict') ||
      errorMessage.includes('409') ||
      errorMessage.includes('412') ||
      errorMessage.includes('version')
    ) {
      throw createApiError(
        'CONFLICT',
        `${context}: Concurrency conflict or constraint violation`,
        409,
      )
    }

    // HTTP 403 - Forbidden (insufficient privileges)
    if (
      errorMessage.includes('forbidden') ||
      errorMessage.includes('403') ||
      errorMessage.includes('privilege') ||
      errorMessage.includes('permission')
    ) {
      throw createApiError(
        'FORBIDDEN',
        `${context}: Insufficient privileges to perform this operation`,
        403,
      )
    }

    // HTTP 401 - Unauthorized
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      throw createApiError(
        'UNAUTHORIZED',
        `${context}: Authentication required`,
        401,
      )
    }

    // Network or connection errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection')
    ) {
      throw createApiError(
        'UNKNOWN',
        `${context}: Unable to connect to Dataverse. Please check your network connection.`,
        503,
      )
    }

    // Generic error with original message
    throw createApiError('UNKNOWN', `${context}: ${error.message}`, 500)
  }

  // Unknown error type
  throw createApiError(
    'UNKNOWN',
    `${context}: An unexpected error occurred`,
    500,
  )
}

function isForbiddenDataverseError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return (
    message.includes('forbidden') ||
    message.includes('403') ||
    message.includes('privilege') ||
    message.includes('permission')
  )
}

/**
 * Validates an IOperationResult and throws if the operation was unsuccessful.
 * This catches silent SDK failures where the result is returned without throwing.
 */
function requireSuccessResult<T>(
  result: { success?: boolean; data?: T; error?: unknown },
  context: string,
): T {
  if (result.success === false) {
    const errorDetail =
      result.error instanceof Error
        ? result.error.message
        : typeof result.error === 'string'
          ? result.error
          : JSON.stringify(result.error ?? 'Unknown SDK error')
    console.error(`[DataverseProvider] ${context}: success=false`, result.error)
    throw new Error(`${context}: ${errorDetail}`)
  }

  return result.data as T
}

export class DataverseDataProvider implements IDataProvider {
  /**
   * T023: Implement submitRequest
   *
   * Creates a new event approval request in Dataverse:
   * 1. Resolve current user identity from identityService
   * 2. Auto-generate request number
   * 3. Create paca_eventapprovalrequest row with status 'submitted' and version 1
   * 4. Create accompanying paca_requesthistoryentry for 'submitted' event
   */
  public async submitRequest(
    input: SubmitRequestInput,
    _context?: ProviderContext,
  ): Promise<EventApprovalRequest> {
    try {
      // Get current user identity from Entra ID
      const currentUser = await identityService.getCurrentUser()

      // Generate request number (simplified - in production, use sequence or guid)
      const timestamp = Date.now()
      const requestNumber = `EA-${timestamp.toString().slice(-6)}`

      const now = new Date().toISOString()

      // Create the request row
      const createResult = await Paca_eventapprovalrequestsService.create({
        paca_requestnumber: requestNumber,
        paca_submitterid: currentUser.id,
        paca_submitterdisplayname: currentUser.displayName,
        paca_eventname: input.eventName,
        paca_eventwebsite: input.eventWebsite,
        paca_rolecode: roleTypeToChoice(input.role) as any,
        paca_transportationmodecode: transportationModeToChoice(
          input.transportationMode,
        ) as any,
        paca_origin: input.origin,
        paca_destination: input.destination,
        paca_registrationfee: String(input.costEstimate.registration),
        paca_travelcost: String(input.costEstimate.travel),
        paca_hotelcost: String(input.costEstimate.hotels),
        paca_mealscost: String(input.costEstimate.meals),
        paca_otherexpenses: String(input.costEstimate.other),
        paca_currencycode: input.costEstimate.currencyCode,
        paca_totalcost: String(input.costEstimate.total),
        paca_statuscode: requestStatusToChoice('submitted') as any,
        paca_submittedat: now,
        paca_version: '1',
      } as any)

      requireSuccessResult(createResult, 'Create request')

      let createdRequestRow = createResult.data

      if (!createdRequestRow?.paca_eventapprovalrequestid) {
        console.warn(
          '[DataverseProvider] create returned no row data, querying by requestNumber fallback',
        )
        const queryResult = await Paca_eventapprovalrequestsService.getAll({
          filter: `paca_requestnumber eq '${requestNumber}' and paca_submitterid eq '${currentUser.id}'`,
          orderBy: ['createdon desc'],
          top: 1,
        })

        requireSuccessResult(queryResult, 'Fallback query for created request')
        createdRequestRow = queryResult.data?.[0]
      } else {
        const createdRequestResult =
          await Paca_eventapprovalrequestsService.get(
            createdRequestRow.paca_eventapprovalrequestid,
          )

        createdRequestRow = createdRequestResult.data ?? createdRequestRow
      }

      if (!createdRequestRow?.paca_eventapprovalrequestid) {
        throw createApiError(
          'UNKNOWN',
          'Request was created but could not be retrieved from Dataverse',
          500,
        )
      }

      console.info(
        '[DataverseProvider] Request created:',
        createdRequestRow.paca_eventapprovalrequestid,
      )
      const createdRequest =
        mapEventApprovalRequestRowToDomain(createdRequestRow)

      // Create history entry for 'submitted' event
      try {
        await Paca_requesthistoryentriesService.create({
          'paca_requestid@odata.bind': `/paca_eventapprovalrequests(${createdRequest.requestId})`,
          paca_eventtypecode: historyEventTypeToChoice('submitted') as any,
          paca_actorid: currentUser.id,
          paca_actorrolecode: actorRoleToChoice('employee') as any,
          paca_occurredat: now,
        } as any)
      } catch (historyError) {
        if (!isForbiddenDataverseError(historyError)) {
          throw historyError
        }
      }

      return createdRequest
    } catch (error) {
      handleDataverseError(error, 'Submit request failed')
    }
  }

  /**
   * T024: Implement listMyRequests
   *
   * Retrieves requests for the current user:
   * 1. Get current user from identityService
   * 2. Query with OData filter on paca_submitterid
   * 3. Optional status filter
   */
  public async listMyRequests(
    options?: ListMyRequestsOptions,
    _context?: ProviderContext,
  ): Promise<EventApprovalRequestSummary[]> {
    try {
      // Get current user identity
      const currentUser = await identityService.getCurrentUser()

      // Build OData filter
      let filter = `paca_submitterid eq '${currentUser.id}'`

      if (options?.status) {
        const statusCode = requestStatusToChoice(options.status)
        filter += ` and paca_statuscode eq ${statusCode}`
      }

      console.info('[DataverseProvider] listMyRequests filter:', filter)

      const result = await Paca_eventapprovalrequestsService.getAll({
        filter: filter,
        orderBy: ['createdon desc'],
      })

      requireSuccessResult(result, 'List my requests')

      if (!result.data || result.data.length === 0) {
        console.info('[DataverseProvider] listMyRequests returned 0 rows')
        return []
      }

      console.info(
        '[DataverseProvider] listMyRequests returned',
        result.data.length,
        'rows',
      )

      // Map to summary format
      return result.data.map((row) => ({
        requestId: row.paca_eventapprovalrequestid,
        requestNumber: row.paca_requestnumber,
        eventName: row.paca_eventname,
        role: roleTypeFromChoice(row.paca_rolecode),
        status: requestStatusFromChoice(row.paca_statuscode),
        submittedAt: row.paca_submittedat ?? null,
        destination: row.paca_destination,
        totalCost: Number(row.paca_totalcost),
        submitterDisplayName: row.paca_submitterdisplayname,
      }))
    } catch (error) {
      handleDataverseError(error, 'List my requests failed')
    }
  }

  /**
   * T025: Implement getRequest
   *
   * Retrieves full request details by ID with assembled CostEstimate

  public async listAllRequests(): Promise<EventApprovalRequestSummary[]> {
    try {
      const [requestsResult, decisionsResult] = await Promise.all([
        Paca_eventapprovalrequestsService.getAll({
          orderBy: ['paca_submittedat desc'],
        }),
        Paca_approvaldecisionsService.getAll({
          orderBy: ['paca_decidedat desc'],
        }),
      ])

      requireSuccessResult(requestsResult, 'List all requests')
      requireSuccessResult(decisionsResult, 'List approval decisions')

      if (!requestsResult.data || requestsResult.data.length === 0) {
        return []
      }

      const latestCommentsByRequestId = new Map<string, string>()

      for (const decision of decisionsResult.data ?? []) {
        const requestId = decision._paca_requestid_value

        if (!requestId || latestCommentsByRequestId.has(requestId)) {
          continue
        }

        latestCommentsByRequestId.set(requestId, decision.paca_comment)
      }

      return requestsResult.data.map((row) => ({
        requestId: row.paca_eventapprovalrequestid,
        requestNumber: row.paca_requestnumber,
        eventName: row.paca_eventname,
        role: roleTypeFromChoice(row.paca_rolecode),
        status: requestStatusFromChoice(row.paca_statuscode),
        submittedAt: row.paca_submittedat ?? null,
        destination: row.paca_destination,
        totalCost: Number(row.paca_totalcost),
        submitterDisplayName: row.paca_submitterdisplayname,
        latestComment: latestCommentsByRequestId.get(
          row.paca_eventapprovalrequestid,
        ),
      }))
    } catch (error) {
      handleDataverseError(error, 'List all requests failed')
    }
  }
   */
  public async getRequest(requestId: string): Promise<EventApprovalRequest> {
    try {
      const result = await Paca_eventapprovalrequestsService.get(requestId)

      requireSuccessResult(result, `Get request ${requestId}`)

      if (!result.data) {
        throw createApiError('NOT_FOUND', `Request ${requestId} not found`, 404)
      }

      return mapEventApprovalRequestRowToDomain(result.data)
    } catch (error) {
      handleDataverseError(error, 'Get request failed')
    }
  }

  /**
   * T026: Implement listPendingApprovals
   *
   * Retrieves all requests with status 'submitted' for approvers
   */
  public async listPendingApprovals(): Promise<EventApprovalRequestSummary[]> {
    try {
      // Filter for submitted status (choice value 1)
      const submittedCode = requestStatusToChoice('submitted')

      const result = await Paca_eventapprovalrequestsService.getAll({
        filter: `paca_statuscode eq ${submittedCode}`,
        orderBy: ['paca_submittedat desc'],
      })

      requireSuccessResult(result, 'List pending approvals')

      if (!result.data || result.data.length === 0) {
        return []
      }

      // Map to summary format
      return result.data.map((row) => ({
        requestId: row.paca_eventapprovalrequestid,
        requestNumber: row.paca_requestnumber,
        eventName: row.paca_eventname,
        role: roleTypeFromChoice(row.paca_rolecode),
        status: requestStatusFromChoice(row.paca_statuscode),
        submittedAt: row.paca_submittedat ?? null,
        destination: row.paca_destination,
        totalCost: Number(row.paca_totalcost),
        submitterDisplayName: row.paca_submitterdisplayname,
      }))
    } catch (error) {
      handleDataverseError(error, 'List pending approvals failed')
    }
  }

  /**
   * T027: Implement decideRequest
   *
   * Makes an approval decision:
   * 1. Read current request and verify version matches (optimistic concurrency)
   * 2. Create paca_approvaldecision row
   * 3. Update request status and increment version
   * 4. Create paca_requesthistoryentry for the decision event
   */
  public async decideRequest(
    requestId: string,
    input: DecisionInput,
    _context?: ProviderContext,
  ): Promise<ApprovalDecision> {
    try {
      // Get current user (approver)
      const currentUser = await identityService.getCurrentUser()

      // Step 1: Read current request and verify version
      const currentRequest = await this.getRequest(requestId)

      if (currentRequest.version !== input.version) {
        throw createApiError(
          'CONFLICT',
          `Version mismatch: expected ${input.version}, current is ${currentRequest.version}`,
          409,
        )
      }

      const now = new Date().toISOString()

      // Step 2: Create decision row
      const decisionResult = await Paca_approvaldecisionsService.create({
        'paca_requestid@odata.bind': `/paca_eventapprovalrequests(${requestId})`,
        paca_approverid: currentUser.id,
        paca_approverdisplayname: currentUser.displayName,
        paca_decisiontypecode: decisionTypeToChoice(input.decisionType) as any,
        paca_comment: input.comment,
        paca_decidedat: now,
      } as any)

      requireSuccessResult(decisionResult, 'Create decision')

      if (!decisionResult.data) {
        throw createApiError(
          'UNKNOWN',
          'Failed to create decision in Dataverse',
          500,
        )
      }

      // Step 3: Update request status and version
      const newStatus =
        input.decisionType === 'approved' ? 'approved' : 'rejected'
      const newVersion = currentRequest.version + 1

      await Paca_eventapprovalrequestsService.update(requestId, {
        paca_statuscode: requestStatusToChoice(newStatus) as any,
        paca_version: String(newVersion),
      })

      // Step 4: Create history entry
      const historyEventType =
        input.decisionType === 'approved' ? 'approved' : 'rejected'

      await Paca_requesthistoryentriesService.create({
        'paca_requestid@odata.bind': `/paca_eventapprovalrequests(${requestId})`,
        paca_eventtypecode: historyEventTypeToChoice(historyEventType) as any,
        paca_actorid: currentUser.id,
        paca_actorrolecode: actorRoleToChoice('approver') as any,
        paca_comment: input.comment,
        paca_occurredat: now,
      } as any)

      return mapApprovalDecisionRowToDomain(decisionResult.data)
    } catch (error) {
      handleDataverseError(error, 'Decide request failed')
    }
  }

  /**
   * T028: Implement getRequestHistory
   *
   * Retrieves history entries for a request:
   * 1. Filter by requestId lookup
   * 2. Sort by occurredAt ascending (chronological)
   * 3. Apply optional eventType and date range filters
   */
  public async getRequestHistory(
    requestId: string,
    options?: RequestHistoryQueryOptions,
  ): Promise<RequestHistoryEntry[]> {
    try {
      // Build OData filter
      let filter = `_paca_requestid_value eq ${requestId}`

      if (options?.eventTypes && options.eventTypes.length > 0) {
        const eventTypeCodes = options.eventTypes.map((et) =>
          historyEventTypeToChoice(et),
        )
        const eventTypeFilter = eventTypeCodes
          .map((code) => `paca_eventtypecode eq ${code}`)
          .join(' or ')
        filter += ` and (${eventTypeFilter})`
      }

      if (options?.from) {
        filter += ` and paca_occurredat ge ${options.from}`
      }

      if (options?.to) {
        filter += ` and paca_occurredat le ${options.to}`
      }

      const result = await Paca_requesthistoryentriesService.getAll({
        filter: filter,
        orderBy: ['paca_occurredat asc'],
      })

      requireSuccessResult(result, 'Get request history')

      if (!result.data || result.data.length === 0) {
        return []
      }

      return result.data.map((row) => mapRequestHistoryEntryRowToDomain(row))
    } catch (error) {
      handleDataverseError(error, 'Get request history failed')
    }
  }

  /**
   * T029: Implement listNotifications
   *
   * Retrieves notifications for the current user:
   * 1. Get current user from identityService
   * 2. Filter by paca_recipientid
   * 3. Parse JSON payload into NotificationPayload
   */
  public async listNotifications(
    _context?: ProviderContext,
  ): Promise<StatusNotification[]> {
    try {
      // Get current user identity
      const currentUser = await identityService.getCurrentUser()

      const result = await Paca_statusnotificationsService.getAll({
        filter: `paca_recipientid eq '${currentUser.id}'`,
        orderBy: ['createdon desc'],
      })

      requireSuccessResult(result, 'List notifications')

      if (!result.data || result.data.length === 0) {
        return []
      }

      return result.data.map((row) => mapStatusNotificationRowToDomain(row))
    } catch (error) {
      handleDataverseError(error, 'List notifications failed')
    }
  }
}

import type {
  ApprovalDecision,
  DecisionInput,
  EventApprovalRequest,
  EventApprovalRequestSummary,
  RequestStatus,
  RequestHistoryEntry,
  StatusNotification,
  SubmitRequestInput,
} from '@/models/eventApproval'

export type AppUserRole = 'employee' | 'approver'

export interface ProviderUser {
  userId: string
  displayName: string
  role: AppUserRole
}

export interface ProviderContext {
  currentUser: ProviderUser
}

export interface ListMyRequestsOptions {
  status?: RequestStatus
}

export interface RequestHistoryQueryOptions {
  eventTypes?: RequestHistoryEntry['eventType'][]
  from?: string
  to?: string
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FORBIDDEN'
  | 'UNAUTHORIZED'
  | 'NOT_IMPLEMENTED'
  | 'UNKNOWN'

export interface ApiErrorDetails {
  [key: string]: unknown
}

export class ApiError extends Error {
  public readonly code: ApiErrorCode
  public readonly status: number
  public readonly details?: ApiErrorDetails

  public constructor(
    code: ApiErrorCode,
    message: string,
    status = 500,
    details?: ApiErrorDetails,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export function createApiError(
  code: ApiErrorCode,
  message: string,
  status?: number,
  details?: ApiErrorDetails,
): ApiError {
  return new ApiError(code, message, status, details)
}

export interface IDataProvider {
  submitRequest(
    input: SubmitRequestInput,
    context?: ProviderContext,
  ): Promise<EventApprovalRequest>
  listAllRequests(): Promise<EventApprovalRequestSummary[]>
  listMyRequests(
    options?: ListMyRequestsOptions,
    context?: ProviderContext,
  ): Promise<EventApprovalRequestSummary[]>
  getRequest(requestId: string): Promise<EventApprovalRequest>
  listPendingApprovals(): Promise<EventApprovalRequestSummary[]>
  decideRequest(
    requestId: string,
    input: DecisionInput,
    context?: ProviderContext,
  ): Promise<ApprovalDecision>
  getRequestHistory(
    requestId: string,
    options?: RequestHistoryQueryOptions,
  ): Promise<RequestHistoryEntry[]>
  listNotifications(context?: ProviderContext): Promise<StatusNotification[]>
}

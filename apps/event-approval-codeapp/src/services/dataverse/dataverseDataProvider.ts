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

export class DataverseDataProvider implements IDataProvider {
  public async submitRequest(
    _input: SubmitRequestInput,
    _context?: ProviderContext,
  ): Promise<EventApprovalRequest> {
    void _input
    void _context
    throw createApiError(
      'NOT_IMPLEMENTED',
      'Dataverse submitRequest is not implemented yet.',
      501,
    )
  }

  public async listMyRequests(
    _options?: ListMyRequestsOptions,
    _context?: ProviderContext,
  ): Promise<EventApprovalRequestSummary[]> {
    void _options
    void _context
    throw createApiError(
      'NOT_IMPLEMENTED',
      'Dataverse listMyRequests is not implemented yet.',
      501,
    )
  }

  public async listAllRequests(): Promise<EventApprovalRequestSummary[]> {
    throw createApiError(
      'NOT_IMPLEMENTED',
      'Dataverse listAllRequests is not implemented yet.',
      501,
    )
  }

  public async getRequest(_requestId: string): Promise<EventApprovalRequest> {
    void _requestId
    throw createApiError(
      'NOT_IMPLEMENTED',
      'Dataverse getRequest is not implemented yet.',
      501,
    )
  }

  public async listPendingApprovals(): Promise<EventApprovalRequestSummary[]> {
    throw createApiError(
      'NOT_IMPLEMENTED',
      'Dataverse listPendingApprovals is not implemented yet.',
      501,
    )
  }

  public async decideRequest(
    _requestId: string,
    _input: DecisionInput,
    _context?: ProviderContext,
  ): Promise<ApprovalDecision> {
    void _requestId
    void _input
    void _context
    throw createApiError(
      'NOT_IMPLEMENTED',
      'Dataverse decideRequest is not implemented yet.',
      501,
    )
  }

  public async getRequestHistory(
    _requestId: string,
    _options?: RequestHistoryQueryOptions,
  ): Promise<RequestHistoryEntry[]> {
    void _requestId
    void _options
    throw createApiError(
      'NOT_IMPLEMENTED',
      'Dataverse getRequestHistory is not implemented yet.',
      501,
    )
  }

  public async listNotifications(
    _context?: ProviderContext,
  ): Promise<StatusNotification[]> {
    void _context
    throw createApiError(
      'NOT_IMPLEMENTED',
      'Dataverse listNotifications is not implemented yet.',
      501,
    )
  }
}

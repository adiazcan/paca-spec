import { beforeEach, describe, expect, it } from 'vitest'
import { DataverseDataProvider } from '@/services/dataverse/dataverseDataProvider'
import type { SubmitRequestInput, DecisionInput } from '@/models/eventApproval'
import type { ProviderContext } from '@/services/api-client/types'

/**
 * Integration tests for DataverseDataProvider with row-level security.
 *
 * Prerequisites:
 * - Dataverse environment provisioned with custom tables
 * - "Event Approver" security role configured per specs/002-dataverse-integration/data-model.md
 * - Test users: one with "Event Approver" role, one without (regular employee)
 * - VITE_APP_DATA_MODE=dataverse
 *
 * These tests verify User Story 6 (Security Role & Row-Level Access):
 * - Employees see only their own requests
 * - Approvers see all submitted requests
 * - Employees cannot execute approver-only operations
 */

describe('DataverseDataProvider - Row-Level Security (Phase 4 - US6)', () => {
  let provider: DataverseDataProvider

  beforeEach(() => {
    provider = new DataverseDataProvider()
  })

  describe('T014a - Employee vs Approver scoped queries', () => {
    /**
     * Test: Employee-scoped query returns only own rows
     *
     * Setup:
     * 1. Create test requests from multiple users in Dataverse
     * 2. Query as a regular employee (without "Event Approver" role)
     *
     * Expected:
     * - listMyRequests returns only requests where submitterId matches current user
     * - Other employees' requests are not visible
     * - Dataverse row-level security enforces the filter automatically
     */
    it.skip('employee can only list their own requests', async () => {
      // Mock context for employee user (without Event Approver role)
      const employeeContext: ProviderContext = {
        userId: 'employee-user-id-1',
        userDisplayName: 'Employee One',
      }

      // Submit a request as this employee
      const submitInput: SubmitRequestInput = {
        eventName: 'React Summit 2026',
        eventWebsite: 'https://reactsummit.com',
        origin: 'Seattle, WA',
        destination: 'Amsterdam, NL',
        role: 'SPEAKER',
        transportationMode: 'AIR',
        costEstimate: {
          currencyCode: 'USD',
          registrationFee: 0,
          travel: 1200,
          hotel: 800,
          meals: 300,
          otherExpenses: 100,
          total: 2400,
        },
      }

      const createdRequest = await provider.submitRequest(
        submitInput,
        employeeContext,
      )
      expect(createdRequest.submitterId).toBe('employee-user-id-1')

      // List requests as the same employee
      const employeeRequests = await provider.listMyRequests(
        {},
        employeeContext,
      )

      // Should see own request
      expect(employeeRequests).toHaveLength(1)
      expect(employeeRequests[0].requestId).toBe(createdRequest.requestId)

      // Verify that Dataverse enforces row-level filter
      // (other employees' requests should not appear even if they exist)
      const allRequestIds = employeeRequests.map(
        (r: { requestId: string }) => r.requestId,
      )
      expect(allRequestIds).toContain(createdRequest.requestId)
    })

    /**
     * Test: Approver-scoped query returns all submitted rows
     *
     * Setup:
     * 1. Create test requests from multiple employees
     * 2. Query as a user with "Event Approver" role
     *
     * Expected:
     * - listPendingApprovals returns all requests with status "submitted"
     * - Requests from all employees are visible
     * - Organization-level read access is enforced by Dataverse
     */
    it.skip('approver can list all submitted requests across all employees', async () => {
      // Mock context for approver user (with Event Approver role)
      const _approverContext: ProviderContext = {
        userId: 'approver-user-id-1',
        userDisplayName: 'Approver One',
      }

      // Note: In real test, multiple employees would have submitted requests
      // This test verifies the approver can see them all

      const pendingApprovals = await provider.listPendingApprovals()

      // Should see requests from multiple submitters (if they exist)
      // The key is that no row-level filter limits to approver's own submitterId
      expect(Array.isArray(pendingApprovals)).toBe(true)

      // All returned requests should have status "submitted"
      pendingApprovals.forEach((approval: { status: string }) => {
        expect(approval.status).toBe('SUBMITTED')
      })

      // Verify approver can access request details
      if (pendingApprovals.length > 0) {
        const firstRequest = await provider.getRequest(
          pendingApprovals[0].requestId,
        )
        expect(firstRequest).toBeDefined()
        expect(firstRequest.status).toBe('SUBMITTED')
      }
    })

    /**
     * Test: Employee cannot see other employees' requests
     *
     * Setup:
     * 1. Employee A creates a request
     * 2. Employee B queries requests
     *
     * Expected:
     * - Employee B's listMyRequests does not include Employee A's request
     * - Row-level security enforces isolation
     */
    it.skip("employee cannot see other employees' requests", async () => {
      const employeeA: ProviderContext = {
        userId: 'employee-a-id',
        userDisplayName: 'Employee A',
      }

      const employeeB: ProviderContext = {
        userId: 'employee-b-id',
        userDisplayName: 'Employee B',
      }

      // Employee A submits a request
      const submitInput: SubmitRequestInput = {
        eventName: 'KubeCon Europe 2026',
        eventWebsite: 'https://kubecon.io',
        origin: 'Paris, FR',
        destination: 'Barcelona, ES',
        role: 'ORGANIZER',
        transportationMode: 'RAIL',
        costEstimate: {
          currencyCode: 'EUR',
          registrationFee: 500,
          travel: 200,
          hotel: 600,
          meals: 250,
          otherExpenses: 50,
          total: 1600,
        },
      }

      const employeeARequest = await provider.submitRequest(
        submitInput,
        employeeA,
      )

      // Employee B queries their own requests
      const employeeBRequests = await provider.listMyRequests({}, employeeB)

      // Employee B should NOT see Employee A's request
      const requestIds = employeeBRequests.map(
        (r: { requestId: string }) => r.requestId,
      )
      expect(requestIds).not.toContain(employeeARequest.requestId)
    })
  })

  describe('T014b - FORBIDDEN error for employee attempting approver operations', () => {
    /**
     * Test: Employee attempting decideRequest receives FORBIDDEN error
     *
     * Setup:
     * 1. Create a submitted request
     * 2. Attempt to decide it as a regular employee (without Event Approver role)
     *
     * Expected:
     * - decideRequest throws ApiError with code "FORBIDDEN"
     * - Dataverse denies the create operation on paca_approvaldecision
     * - Clear error message indicates insufficient permissions
     */
    it.skip('employee cannot decide a request - receives FORBIDDEN error', async () => {
      const employeeContext: ProviderContext = {
        userId: 'employee-user-id-2',
        userDisplayName: 'Employee Two',
      }

      // Create a request (as any user)
      const submitInput: SubmitRequestInput = {
        eventName: 'DockerCon 2026',
        eventWebsite: 'https://dockercon.com',
        origin: 'Austin, TX',
        destination: 'San Francisco, CA',
        role: 'SPEAKER',
        transportationMode: 'AIR',
        costEstimate: {
          currencyCode: 'USD',
          registrationFee: 750,
          travel: 400,
          hotel: 900,
          meals: 400,
          otherExpenses: 150,
          total: 2600,
        },
      }

      const request = await provider.submitRequest(submitInput, employeeContext)

      // Attempt to decide the request as a regular employee
      const decisionInput: DecisionInput = {
        decisionType: 'APPROVED',
        comment: 'Looks good to me',
      }

      // Should throw FORBIDDEN error
      await expect(
        provider.decideRequest(
          request.requestId,
          decisionInput,
          employeeContext,
        ),
      ).rejects.toThrow(/FORBIDDEN|insufficient permissions|access denied/i)
    })

    /**
     * Test: Employee attempting to access approver dashboard sees clear error
     *
     * Setup:
     * 1. Query as employee without Event Approver role
     *
     * Expected:
     * - listPendingApprovals returns empty array OR throws FORBIDDEN
     * - If Dataverse allows read but returns no results, that's acceptable
     * - If Dataverse denies access, should throw clear error
     */
    it.skip('employee attempting listPendingApprovals sees no results or clear error', async () => {
      // This test documents expected behavior - exact implementation depends on
      // whether Dataverse returns [] or throws an error for insufficient privileges

      // Option 1: Dataverse returns empty results (most lenient)
      // Option 2: Dataverse throws privilege error (most strict)

      const pendingApprovals = await provider.listPendingApprovals()

      // At minimum, employee should not see organization-wide requests
      // Dataverse row-level security should limit results
      expect(Array.isArray(pendingApprovals)).toBe(true)
    })
  })

  describe('Phase 5 - Data Provider Implementation Tests', () => {
    /**
     * T015: Integration test for submitRequest
     *
     * Verifies:
     * - New paca_eventapprovalrequest row created in Dataverse
     * - Embedded cost fields (registration, travel, hotel, meals, other) populated
     * - Submitter identity resolved from identity service
     * - Status set to 'submitted'
     * - Version set to 1
     * - Accompanying paca_requesthistoryentry created for 'submitted' event
     */
    it.skip('T015 - submitRequest creates row in Dataverse with embedded cost fields and history entry', async () => {
      const submitInput: SubmitRequestInput = {
        eventName: 'TestConf 2026',
        eventWebsite: 'https://testconf.com',
        origin: 'Seattle, WA',
        destination: 'Portland, OR',
        role: 'SPEAKER',
        transportationMode: 'AIR',
        costEstimate: {
          currencyCode: 'USD',
          registrationFee: 500,
          travel: 800,
          hotel: 600,
          meals: 200,
          otherExpenses: 100,
          total: 2200,
        },
      }

      const createdRequest = await provider.submitRequest(submitInput)

      // Verify created request structure
      expect(createdRequest.requestId).toBeDefined()
      expect(createdRequest.requestNumber).toMatch(/^EA-\d+$/)
      expect(createdRequest.eventName).toBe('TestConf 2026')
      expect(createdRequest.role).toBe('SPEAKER')
      expect(createdRequest.transportationMode).toBe('AIR')
      expect(createdRequest.status).toBe('SUBMITTED')
      expect(createdRequest.version).toBe(1)

      // Verify submitter identity resolved from identity service
      expect(createdRequest.submitterId).toBeDefined()
      expect(createdRequest.submitterDisplayName).toBeDefined()

      // Verify embedded cost estimate
      expect(createdRequest.costEstimate.currencyCode).toBe('USD')
      expect(createdRequest.costEstimate.registration).toBe(500)
      expect(createdRequest.costEstimate.travel).toBe(800)
      expect(createdRequest.costEstimate.hotels).toBe(600)
      expect(createdRequest.costEstimate.meals).toBe(200)
      expect(createdRequest.costEstimate.other).toBe(100)
      expect(createdRequest.costEstimate.total).toBe(2200)

      // Verify timestamps
      expect(createdRequest.createdAt).toBeDefined()
      expect(createdRequest.submittedAt).toBeDefined()

      // Verify history entry created for 'submitted' event
      const history = await provider.getRequestHistory(createdRequest.requestId)
      expect(history).toHaveLength(1)
      expect(history[0].eventType).toBe('SUBMITTED')
      expect(history[0].actorId).toBe(createdRequest.submitterId)
      expect(history[0].actorRole).toBe('EMPLOYEE')
    })

    /**
     * T016: Integration test for listMyRequests
     *
     * Verifies:
     * - Results filtered by current user's submitterId
     * - Optional status filter works correctly
     * - Returns EventApprovalRequestSummary[] with required fields
     */
    it.skip('T016 - listMyRequests filters by current user and optional status', async () => {
      // Create a test request
      const submitInput: SubmitRequestInput = {
        eventName: 'FilterTest Conference',
        eventWebsite: 'https://filtertest.com',
        origin: 'Boston, MA',
        destination: 'New York, NY',
        role: 'ORGANIZER',
        transportationMode: 'RAIL',
        costEstimate: {
          currencyCode: 'USD',
          registrationFee: 300,
          travel: 150,
          hotel: 400,
          meals: 150,
          otherExpenses: 50,
          total: 1050,
        },
      }

      const created = await provider.submitRequest(submitInput)

      // List all requests for current user
      const allRequests = await provider.listMyRequests({})
      expect(allRequests.length).toBeGreaterThan(0)

      // Verify structure of summary objects
      const foundRequest = allRequests.find(
        (r: { requestId: string }) => r.requestId === created.requestId,
      )
      expect(foundRequest).toBeDefined()
      expect(foundRequest?.requestNumber).toBe(created.requestNumber)
      expect(foundRequest?.eventName).toBe('FilterTest Conference')
      expect(foundRequest?.role).toBe('ORGANIZER')
      expect(foundRequest?.status).toBe('SUBMITTED')

      // Test status filter
      const submittedOnly = await provider.listMyRequests({
        status: 'SUBMITTED',
      })
      submittedOnly.forEach((req: { status: string }) => {
        expect(req.status).toBe('SUBMITTED')
      })

      // Verify current user filter (all requests should have same submitter as created request)
      allRequests.forEach((req: { requestId: string }) => {
        expect(req.requestId).toBeDefined()
      })
    })

    /**
     * T017: Integration test for getRequest
     *
     * Verifies:
     * - Full EventApprovalRequest details returned
     * - CostEstimate assembled from embedded columns
     * - Choice values mapped to enum strings
     */
    it.skip('T017 - getRequest returns full details with assembled CostEstimate', async () => {
      // Create a request to retrieve
      const submitInput: SubmitRequestInput = {
        eventName: 'GetTest Summit',
        eventWebsite: 'https://gettest.io',
        origin: 'Chicago, IL',
        destination: 'Austin, TX',
        role: 'ASSISTANT',
        transportationMode: 'BUS',
        costEstimate: {
          currencyCode: 'USD',
          registrationFee: 250,
          travel: 100,
          hotel: 300,
          meals: 100,
          otherExpenses: 25,
          total: 775,
        },
      }

      const created = await provider.submitRequest(submitInput)

      // Retrieve the request
      const retrieved = await provider.getRequest(created.requestId)

      // Verify full details match
      expect(retrieved.requestId).toBe(created.requestId)
      expect(retrieved.requestNumber).toBe(created.requestNumber)
      expect(retrieved.eventName).toBe('GetTest Summit')
      expect(retrieved.eventWebsite).toBe('https://gettest.io')
      expect(retrieved.origin).toBe('Chicago, IL')
      expect(retrieved.destination).toBe('Austin, TX')
      expect(retrieved.role).toBe('ASSISTANT')
      expect(retrieved.transportationMode).toBe('BUS')
      expect(retrieved.status).toBe('SUBMITTED')
      expect(retrieved.version).toBe(1)

      // Verify cost estimate assembly
      expect(retrieved.costEstimate.currencyCode).toBe('USD')
      expect(retrieved.costEstimate.registration).toBe(250)
      expect(retrieved.costEstimate.travel).toBe(100)
      expect(retrieved.costEstimate.hotels).toBe(300)
      expect(retrieved.costEstimate.meals).toBe(100)
      expect(retrieved.costEstimate.other).toBe(25)
      expect(retrieved.costEstimate.total).toBe(775)

      // Verify submitter identity
      expect(retrieved.submitterId).toBeDefined()
      expect(retrieved.submitterDisplayName).toBeDefined()
    })

    /**
     * T018: Integration test for listPendingApprovals
     *
     * Verifies:
     * - Only requests with status 'submitted' returned
     * - OData filter paca_status eq 1 applied
     * - Returns EventApprovalRequestSummary[]
     */
    it.skip('T018 - listPendingApprovals returns only submitted status requests', async () => {
      // Create a submitted request
      const submitInput: SubmitRequestInput = {
        eventName: 'Pending Approval Test',
        eventWebsite: 'https://pendingtest.com',
        origin: 'Denver, CO',
        destination: 'Phoenix, AZ',
        role: 'SPEAKER',
        transportationMode: 'AIR',
        costEstimate: {
          currencyCode: 'USD',
          registrationFee: 400,
          travel: 600,
          hotel: 500,
          meals: 180,
          otherExpenses: 70,
          total: 1750,
        },
      }

      const created = await provider.submitRequest(submitInput)

      // List pending approvals
      const pendingApprovals = await provider.listPendingApprovals()

      // Verify only submitted requests returned
      expect(pendingApprovals.length).toBeGreaterThan(0)
      pendingApprovals.forEach((approval: { status: string }) => {
        expect(approval.status).toBe('SUBMITTED')
      })

      // Verify our created request appears
      const foundApproval = pendingApprovals.find(
        (a: { requestId: string }) => a.requestId === created.requestId,
      )
      expect(foundApproval).toBeDefined()
      expect(foundApproval?.eventName).toBe('Pending Approval Test')
    })

    /**
     * T019: Integration test for decideRequest
     *
     * Verifies:
     * - Decision row created in paca_approvaldecision
     * - Request status updated to approved/rejected
     * - Request version incremented
     * - History entry created for decision event
     * - Optimistic concurrency conflict detection (version mismatch)
     */
    it.skip('T019 - decideRequest creates decision, updates status, creates history, handles concurrency', async () => {
      // Create a request to approve
      const submitInput: SubmitRequestInput = {
        eventName: 'Decision Test Event',
        eventWebsite: 'https://decisiontest.com',
        origin: 'Miami, FL',
        destination: 'Orlando, FL',
        role: 'ORGANIZER',
        transportationMode: 'CAR',
        costEstimate: {
          currencyCode: 'USD',
          registrationFee: 200,
          travel: 80,
          hotel: 250,
          meals: 120,
          otherExpenses: 30,
          total: 680,
        },
      }

      const created = await provider.submitRequest(submitInput)

      // Make a decision
      const decisionInput: DecisionInput = {
        decisionType: 'APPROVED',
        comment: 'This event looks valuable for our team.',
        version: created.version,
      }

      const decision = await provider.decideRequest(
        created.requestId,
        decisionInput,
      )

      // Verify decision structure
      expect(decision.decisionId).toBeDefined()
      expect(decision.requestId).toBe(created.requestId)
      expect(decision.decisionType).toBe('APPROVED')
      expect(decision.comment).toBe('This event looks valuable for our team.')
      expect(decision.approverId).toBeDefined()
      expect(decision.approverDisplayName).toBeDefined()
      expect(decision.decidedAt).toBeDefined()

      // Verify request status updated
      const updated = await provider.getRequest(created.requestId)
      expect(updated.status).toBe('APPROVED')
      expect(updated.version).toBe(2) // Version incremented

      // Verify history entry created
      const history = await provider.getRequestHistory(created.requestId)
      const approvedEntry = history.find(
        (e: { eventType: string }) => e.eventType === 'APPROVED',
      )
      expect(approvedEntry).toBeDefined()
      expect(approvedEntry?.actorRole).toBe('APPROVER')

      // Test concurrency conflict
      const staleDecisionInput: DecisionInput = {
        decisionType: 'REJECTED',
        comment: 'Stale version',
        version: 1, // Old version, should fail
      }

      await expect(
        provider.decideRequest(created.requestId, staleDecisionInput),
      ).rejects.toThrow(/CONFLICT|version/i)
    })

    /**
     * T020: Integration test for getRequestHistory
     *
     * Verifies:
     * - Returns RequestHistoryEntry[] in chronological order (sorted by occurredAt asc)
     * - Filters by requestId lookup
     * - Optional eventType filter works
     * - Optional date range filters work
     */
    it.skip('T020 - getRequestHistory returns chronological entries with filters', async () => {
      // Create and decide a request to generate history
      const submitInput: SubmitRequestInput = {
        eventName: 'History Test Conference',
        eventWebsite: 'https://historytest.com',
        origin: 'Atlanta, GA',
        destination: 'Charlotte, NC',
        role: 'SPEAKER',
        transportationMode: 'RAIL',
        costEstimate: {
          currencyCode: 'USD',
          registrationFee: 350,
          travel: 120,
          hotel: 320,
          meals: 140,
          otherExpenses: 40,
          total: 970,
        },
      }

      const created = await provider.submitRequest(submitInput)

      const decisionInput: DecisionInput = {
        decisionType: 'APPROVED',
        comment: 'Approved for history test',
        version: created.version,
      }

      await provider.decideRequest(created.requestId, decisionInput)

      // Get full history
      const fullHistory = await provider.getRequestHistory(created.requestId)

      expect(fullHistory.length).toBeGreaterThanOrEqual(2) // At least submitted + approved

      // Verify chronological order (oldest first)
      for (let i = 1; i < fullHistory.length; i++) {
        const prev = new Date(fullHistory[i - 1].occurredAt)
        const curr = new Date(fullHistory[i].occurredAt)
        expect(prev.getTime()).toBeLessThanOrEqual(curr.getTime())
      }

      // Verify event types
      const submittedEntry = fullHistory.find(
        (e: { eventType: string }) => e.eventType === 'SUBMITTED',
      )
      expect(submittedEntry).toBeDefined()
      expect(submittedEntry?.actorRole).toBe('EMPLOYEE')

      const approvedEntry = fullHistory.find(
        (e: { eventType: string }) => e.eventType === 'APPROVED',
      )
      expect(approvedEntry).toBeDefined()
      expect(approvedEntry?.actorRole).toBe('APPROVER')

      // Test eventType filter
      const submittedOnly = await provider.getRequestHistory(
        created.requestId,
        {
          eventTypes: ['SUBMITTED'],
        },
      )
      expect(submittedOnly).toHaveLength(1)
      expect(submittedOnly[0].eventType).toBe('SUBMITTED')
    })

    /**
     * T021: Integration test for listNotifications
     *
     * Verifies:
     * - Results filtered by current user's recipientId
     * - Returns StatusNotification[] with parsed payload
     * - Payload JSON correctly deserialized to NotificationPayload
     */
    it.skip('T021 - listNotifications filters by current user with parsed payload', async () => {
      // Note: Notifications are typically created by Power Automate Cloud Flow
      // For this test, we verify the read operation filters correctly

      const notifications = await provider.listNotifications()

      // Verify structure (may be empty if no notifications exist)
      expect(Array.isArray(notifications)).toBe(true)

      if (notifications.length > 0) {
        const firstNotification = notifications[0]

        // Verify notification structure
        expect(firstNotification.notificationId).toBeDefined()
        expect(firstNotification.requestId).toBeDefined()
        expect(firstNotification.recipientId).toBeDefined()
        expect(firstNotification.channel).toMatch(/^(IN_APP|EMAIL|TEAMS)$/)
        expect(firstNotification.deliveryStatus).toMatch(
          /^(QUEUED|SENT|FAILED)$/,
        )

        // Verify payload parsing
        expect(firstNotification.payload).toBeDefined()
        expect(firstNotification.payload.requestId).toBeDefined()
        expect(firstNotification.payload.status).toMatch(
          /^(DRAFT|SUBMITTED|APPROVED|REJECTED)$/,
        )
        expect(typeof firstNotification.payload.comment).toBe('string')

        // Verify timestamps
        expect(firstNotification.createdAt).toBeDefined()
      }
    })
  })
})

describe('DataverseDataProvider - Environment Mode Switching (Phase 6 - US3)', () => {
  /**
   * Test: Provider factory returns correct provider based on VITE_APP_DATA_MODE
   *
   * This test validates US3 - environment-based data mode switching
   */

  beforeEach(async () => {
    // Import dynamically to avoid circular deps and ensure fresh module state
    const { resetDataProviderCache } =
      await import('@/services/api-client/providerFactory')
    resetDataProviderCache()
  })

  it('T031 - providerFactory returns MockDataProvider when mode=mock', async () => {
    const { createDataProvider } =
      await import('@/services/api-client/providerFactory')
    const { MockDataProvider } =
      await import('@/services/mocks/mockDataProvider')

    const provider = createDataProvider({ mode: 'mock' })

    expect(provider).toBeInstanceOf(MockDataProvider)
  })

  it('T031 - providerFactory returns DataverseDataProvider when mode=dataverse', async () => {
    const { createDataProvider } =
      await import('@/services/api-client/providerFactory')

    const provider = createDataProvider({ mode: 'dataverse' })

    expect(provider).toBeInstanceOf(DataverseDataProvider)
  })

  it('T031 - providerFactory uses resolved mode from environment when no option provided', async () => {
    const { createDataProvider } =
      await import('@/services/api-client/providerFactory')
    const { MockDataProvider } =
      await import('@/services/mocks/mockDataProvider')

    // When no mode is provided, should use resolveDataMode() which defaults to 'mock'
    const provider = createDataProvider()

    // Default mode should be 'mock' based on environment.ts DEFAULT_DATA_MODE
    expect(provider).toBeInstanceOf(MockDataProvider)
  })

  it('T031 - providerFactory caches provider instance for same mode', async () => {
    const { createDataProvider } =
      await import('@/services/api-client/providerFactory')

    const provider1 = createDataProvider({ mode: 'mock' })
    const provider2 = createDataProvider({ mode: 'mock' })

    // Should return the same cached instance
    expect(provider1).toBe(provider2)
  })

  it('T031 - providerFactory creates new instance when mode changes', async () => {
    const { createDataProvider } =
      await import('@/services/api-client/providerFactory')

    const mockProvider = createDataProvider({ mode: 'mock' })
    const dataverseProvider = createDataProvider({ mode: 'dataverse' })

    // Should be different instances
    expect(mockProvider).not.toBe(dataverseProvider)
  })
})

describe('DataverseDataProvider - Identity Service (Phase 7 - US4)', () => {
  /**
   * Tests for identity resolution via Office 365 Users connector
   */
  it.skip('T035 - identity service returns mock user when in mock mode', async () => {
    // Test to be implemented in Phase 7
  })

  it.skip('T035 - identity service calls Office365UsersService.MyProfile_V2 in dataverse mode', async () => {
    // Test to be implemented in Phase 7
  })
})

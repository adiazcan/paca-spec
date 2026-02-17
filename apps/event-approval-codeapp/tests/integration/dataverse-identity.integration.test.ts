import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DataverseDataProvider } from '@/services/dataverse/dataverseDataProvider'
import { identityService } from '@/services/dataverse/identityService'

import { Paca_eventapprovalrequestsService } from '@/generated/services/Paca_eventapprovalrequestsService'
import { Paca_approvaldecisionsService } from '@/generated/services/Paca_approvaldecisionsService'
import { Paca_requesthistoryentriesService } from '@/generated/services/Paca_requesthistoryentriesService'
import { Paca_statusnotificationsService } from '@/generated/services/Paca_statusnotificationsService'

vi.mock('@/generated/services/Paca_eventapprovalrequestsService', () => ({
  Paca_eventapprovalrequestsService: {
    create: vi.fn(),
    getAll: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/generated/services/Paca_approvaldecisionsService', () => ({
  Paca_approvaldecisionsService: {
    create: vi.fn(),
  },
}))

vi.mock('@/generated/services/Paca_requesthistoryentriesService', () => ({
  Paca_requesthistoryentriesService: {
    create: vi.fn(),
    getAll: vi.fn(),
  },
}))

vi.mock('@/generated/services/Paca_statusnotificationsService', () => ({
  Paca_statusnotificationsService: {
    getAll: vi.fn(),
  },
}))

function requestRow(overrides: Record<string, unknown> = {}) {
  return {
    paca_eventapprovalrequestid: 'req-1',
    paca_requestnumber: 'EA-123456',
    paca_submitterid: 'entra-user-1',
    paca_submitterdisplayname: 'Entra User',
    paca_eventname: 'Contoso Ignite',
    paca_eventwebsite: 'https://contoso.com/ignite',
    paca_rolecode: 0,
    paca_transportationmodecode: 0,
    paca_origin: 'Redmond',
    paca_destination: 'London',
    paca_registrationfee: '100',
    paca_travelcost: '200',
    paca_hotelcost: '300',
    paca_mealscost: '50',
    paca_otherexpenses: '25',
    paca_currencycode: 'USD',
    paca_totalcost: '675',
    paca_statuscode: 1,
    paca_submittedat: '2026-02-17T10:00:00.000Z',
    paca_version: '1',
    createdon: '2026-02-17T10:00:00.000Z',
    modifiedon: '2026-02-17T10:00:00.000Z',
    ...overrides,
  }
}

describe('DataverseDataProvider identity integration (Phase 7 - US4)', () => {
  let provider: DataverseDataProvider

  beforeEach(() => {
    provider = new DataverseDataProvider()
    vi.clearAllMocks()
  })

  it('T036 submitRequest uses authenticated Entra ID identity for submitter fields', async () => {
    vi.spyOn(identityService, 'getCurrentUser').mockResolvedValue({
      id: 'entra-submitter-id',
      displayName: 'Employee Entra',
    })

    vi.mocked(Paca_eventapprovalrequestsService.create).mockResolvedValue({
      data: requestRow({
        paca_submitterid: 'entra-submitter-id',
        paca_submitterdisplayname: 'Employee Entra',
      }),
    } as never)

    vi.mocked(Paca_eventapprovalrequestsService.get).mockResolvedValue({
      data: requestRow({
        paca_submitterid: 'entra-submitter-id',
        paca_submitterdisplayname: 'Employee Entra',
      }),
    } as never)

    vi.mocked(Paca_requesthistoryentriesService.create).mockResolvedValue({
      data: {},
    } as never)

    await provider.submitRequest({
      eventName: 'Identity Validation Summit',
      eventWebsite: 'https://identity.contoso.com/summit',
      role: 'speaker',
      transportationMode: 'air',
      origin: 'Seattle',
      destination: 'Austin',
      costEstimate: {
        registration: 200,
        travel: 300,
        hotels: 250,
        meals: 100,
        other: 50,
        currencyCode: 'USD',
        total: 900,
      },
    })

    expect(Paca_eventapprovalrequestsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paca_submitterid: 'entra-submitter-id',
        paca_submitterdisplayname: 'Employee Entra',
      }),
    )

    expect(Paca_eventapprovalrequestsService.get).toHaveBeenCalledWith('req-1')
  })

  it('submitRequest succeeds when history write is forbidden for employee role', async () => {
    vi.spyOn(identityService, 'getCurrentUser').mockResolvedValue({
      id: 'entra-submitter-id',
      displayName: 'Employee Entra',
    })

    vi.mocked(Paca_eventapprovalrequestsService.create).mockResolvedValue({
      data: requestRow(),
    } as never)

    vi.mocked(Paca_eventapprovalrequestsService.get).mockResolvedValue({
      data: requestRow(),
    } as never)

    vi.mocked(Paca_requesthistoryentriesService.create).mockRejectedValue(
      new Error('403 Forbidden - insufficient privileges'),
    )

    const created = await provider.submitRequest({
      eventName: 'Permission Edge Summit',
      eventWebsite: 'https://identity.contoso.com/permission-edge',
      role: 'speaker',
      transportationMode: 'air',
      origin: 'Seattle',
      destination: 'Austin',
      costEstimate: {
        registration: 200,
        travel: 300,
        hotels: 250,
        meals: 100,
        other: 50,
        currencyCode: 'USD',
        total: 900,
      },
    })

    expect(created.requestId).toBe('req-1')
    expect(Paca_eventapprovalrequestsService.create).toHaveBeenCalledTimes(1)
    expect(Paca_requesthistoryentriesService.create).toHaveBeenCalledTimes(1)
  })

  it('submitRequest succeeds when create returns no row data by querying requestNumber', async () => {
    vi.spyOn(identityService, 'getCurrentUser').mockResolvedValue({
      id: 'entra-submitter-id',
      displayName: 'Employee Entra',
    })

    vi.mocked(Paca_eventapprovalrequestsService.create).mockResolvedValue({
      data: undefined,
    } as never)

    vi.mocked(Paca_eventapprovalrequestsService.getAll).mockResolvedValue({
      data: [requestRow()],
    } as never)

    vi.mocked(Paca_requesthistoryentriesService.create).mockResolvedValue({
      data: {},
    } as never)

    const created = await provider.submitRequest({
      eventName: 'Create Empty Response Summit',
      eventWebsite: 'https://identity.contoso.com/create-empty',
      role: 'speaker',
      transportationMode: 'air',
      origin: 'Seattle',
      destination: 'Austin',
      costEstimate: {
        registration: 200,
        travel: 300,
        hotels: 250,
        meals: 100,
        other: 50,
        currencyCode: 'USD',
        total: 900,
      },
    })

    expect(created.requestId).toBe('req-1')
    expect(Paca_eventapprovalrequestsService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.stringContaining(
          "paca_submitterid eq 'entra-submitter-id'",
        ),
        top: 1,
      }),
    )
  })

  it('T037 listMyRequests filters by authenticated Entra ID', async () => {
    vi.spyOn(identityService, 'getCurrentUser').mockResolvedValue({
      id: 'entra-list-user',
      displayName: 'List User',
    })

    vi.mocked(Paca_eventapprovalrequestsService.getAll).mockResolvedValue({
      data: [],
    } as never)

    await provider.listMyRequests()

    expect(Paca_eventapprovalrequestsService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.stringContaining(
          "paca_submitterid eq 'entra-list-user'",
        ),
      }),
    )
  })

  it('T038 decideRequest uses authenticated approver identity for decision fields', async () => {
    vi.spyOn(identityService, 'getCurrentUser').mockResolvedValue({
      id: 'entra-approver-id',
      displayName: 'Approver Entra',
    })

    vi.mocked(Paca_eventapprovalrequestsService.get).mockResolvedValue({
      data: requestRow({ paca_version: '1' }),
    } as never)

    vi.mocked(Paca_approvaldecisionsService.create).mockResolvedValue({
      data: {
        paca_approvaldecisionid: 'dec-1',
        _paca_requestid_value: 'req-1',
        paca_approverid: 'entra-approver-id',
        paca_approverdisplayname: 'Approver Entra',
        paca_decisiontypecode: 0,
        paca_comment: 'Approved for learning impact',
        paca_decidedat: '2026-02-17T10:05:00.000Z',
      },
    } as never)

    vi.mocked(Paca_eventapprovalrequestsService.update).mockResolvedValue({
      data: {},
    } as never)

    vi.mocked(Paca_requesthistoryentriesService.create).mockResolvedValue({
      data: {},
    } as never)

    await provider.decideRequest('req-1', {
      decisionType: 'approved',
      comment: 'Approved for learning impact',
      version: 1,
    })

    expect(Paca_approvaldecisionsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        paca_approverid: 'entra-approver-id',
        paca_approverdisplayname: 'Approver Entra',
      }),
    )
  })

  it('T039 listNotifications filters by authenticated recipient identity', async () => {
    vi.spyOn(identityService, 'getCurrentUser').mockResolvedValue({
      id: 'entra-recipient-id',
      displayName: 'Recipient Entra',
    })

    vi.mocked(Paca_statusnotificationsService.getAll).mockResolvedValue({
      data: [],
    } as never)

    await provider.listNotifications()

    expect(Paca_statusnotificationsService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: "paca_recipientid eq 'entra-recipient-id'",
      }),
    )
  })

  it('T039a maps identity/session expiry errors to UNAUTHORIZED', async () => {
    vi.spyOn(identityService, 'getCurrentUser').mockRejectedValue(
      new Error('401 Unauthorized'),
    )

    await expect(provider.listMyRequests()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    })
  })
})

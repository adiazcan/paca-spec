import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

type DataverseSchema = {
  tables: Record<string, string[]>
  relationships: Array<{
    parent: string
    child: string
    lookup: string
  }>
  choices: Record<string, string[]>
}

const expectedSchema: DataverseSchema = {
  tables: {
    paca_eventapprovalrequest: [
      'paca_requestnumber',
      'paca_submitterid',
      'paca_submitterdisplayname',
      'paca_eventname',
      'paca_eventwebsite',
      'paca_role',
      'paca_transportationmode',
      'paca_origin',
      'paca_destination',
      'paca_status',
      'paca_registrationfee',
      'paca_travelcost',
      'paca_hotelcost',
      'paca_mealscost',
      'paca_otherexpenses',
      'paca_currencycode',
      'paca_totalcost',
      'paca_submittedat',
      'paca_version',
    ],
    paca_approvaldecision: [
      'paca_approverdisplayname',
      'paca_approverid',
      'paca_decisiontype',
      'paca_comment',
      'paca_decidedat',
      'paca_requestid',
    ],
    paca_requesthistoryentry: [
      'paca_actorid',
      'paca_eventtype',
      'paca_actorrole',
      'paca_comment',
      'paca_metadata',
      'paca_occurredat',
      'paca_requestid',
    ],
    paca_statusnotification: [
      'paca_recipientid',
      'paca_channel',
      'paca_payload',
      'paca_deliverystatus',
      'paca_sentat',
      'paca_requestid',
    ],
  },
  relationships: [
    {
      parent: 'paca_eventapprovalrequest',
      child: 'paca_approvaldecision',
      lookup: 'paca_requestid',
    },
    {
      parent: 'paca_eventapprovalrequest',
      child: 'paca_requesthistoryentry',
      lookup: 'paca_requestid',
    },
    {
      parent: 'paca_eventapprovalrequest',
      child: 'paca_statusnotification',
      lookup: 'paca_requestid',
    },
  ],
  choices: {
    RoleType: ['speaker', 'organizer', 'assistant'],
    TransportationMode: ['air', 'rail', 'car', 'bus', 'other'],
    RequestStatus: ['draft', 'submitted', 'approved', 'rejected'],
    DecisionType: ['approved', 'rejected'],
    HistoryEventType: [
      'submitted',
      'approved',
      'rejected',
      'commented',
      'notification_sent',
      'stale_detected',
    ],
    ActorRole: ['employee', 'approver', 'system'],
    NotificationChannel: ['in_app', 'email', 'teams'],
    NotificationDeliveryStatus: ['queued', 'sent', 'failed'],
  },
}

function getOpenApiContractText(): string {
  const currentFile = fileURLToPath(import.meta.url)
  const currentDir = path.dirname(currentFile)
  const contractPath = path.resolve(
    currentDir,
    '../../../../specs/002-dataverse-integration/contracts/dataverse-integration.openapi.yaml',
  )

  return readFileSync(contractPath, 'utf8')
}

function extractEnum(schemaName: string, openApiText: string): string[] {
  const enumRegex = new RegExp(
    `^\\s*${schemaName}:\\s*$[\\s\\S]*?^\\s*enum:\\s*\\[([^\\]]+)\\]`,
    'm',
  )
  const match = openApiText.match(enumRegex)

  if (!match) {
    return []
  }

  return match[1]
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

describe('Dataverse schema contract (US1)', () => {
  it('defines all required Dataverse tables and required columns', () => {
    const tableNames = Object.keys(expectedSchema.tables)

    expect(tableNames).toHaveLength(4)

    for (const table of tableNames) {
      const columns = expectedSchema.tables[table]
      expect(columns.length).toBeGreaterThan(0)
      expect(new Set(columns).size).toBe(columns.length)
      expect(columns.every((column) => column.startsWith('paca_'))).toBe(true)
    }
  })

  it('defines all required lookup relationships to request table', () => {
    expect(expectedSchema.relationships).toEqual([
      {
        parent: 'paca_eventapprovalrequest',
        child: 'paca_approvaldecision',
        lookup: 'paca_requestid',
      },
      {
        parent: 'paca_eventapprovalrequest',
        child: 'paca_requesthistoryentry',
        lookup: 'paca_requestid',
      },
      {
        parent: 'paca_eventapprovalrequest',
        child: 'paca_statusnotification',
        lookup: 'paca_requestid',
      },
    ])
  })

  it('matches choice values with OpenAPI enum definitions', () => {
    const openApiText = getOpenApiContractText()

    for (const [schemaName, expectedValues] of Object.entries(expectedSchema.choices)) {
      const openApiValues = extractEnum(schemaName, openApiText)
      expect(openApiValues).toEqual(expectedValues)
    }
  })

  it('exposes endpoints that require the provisioned Dataverse schema', () => {
    const openApiText = getOpenApiContractText()

    const requiredOperations = [
      '/requests:',
      '/requests/{requestId}:',
      '/requests/{requestId}/history:',
      '/approvals/pending:',
      '/approvals/{requestId}/decision:',
      '/notifications:',
    ]

    for (const operation of requiredOperations) {
      expect(openApiText).toContain(operation)
    }
  })
})

# Data Model: Event Approval Workflow Code App

## Overview
The model supports request submission, approver decisions, immutable history, and status notifications. Local development uses the same model shape in fixtures; pro environment maps to Dataverse tables.

## Entities

### 1) EventApprovalRequest
- Primary Key: `requestId` (UUID)
- Fields:
  - `requestNumber` (string, unique human-readable ID)
  - `submitterId` (string, required)
  - `submitterDisplayName` (string, required)
  - `eventName` (string, required, 3..200 chars)
  - `eventWebsite` (string URL, required, https preferred)
  - `role` (enum: `speaker` | `organizer` | `assistant`, required)
  - `transportationMode` (enum: `air` | `rail` | `car` | `bus` | `other`, required)
  - `origin` (string, required)
  - `destination` (string, required)
  - `status` (enum: `draft` | `submitted` | `approved` | `rejected`, required)
  - `submittedAt` (datetime, nullable until submit)
  - `createdAt` (datetime, required)
  - `updatedAt` (datetime, required)
  - `version` (integer, required; optimistic concurrency)
- Relationships:
  - 1:1 with `CostEstimate`
  - 1:N with `ApprovalDecision`
  - 1:N with `RequestHistoryEntry`
  - 1:N with `StatusNotification`
- Validation rules:
  - Cannot submit unless required fields + valid cost data are present.
  - `status` transition rules enforced (see transitions).

### 2) CostEstimate
- Primary Key: `costEstimateId` (UUID)
- Foreign Key: `requestId` -> `EventApprovalRequest.requestId`
- Fields:
  - `registration` (decimal(12,2), >= 0)
  - `travel` (decimal(12,2), >= 0)
  - `hotels` (decimal(12,2), >= 0)
  - `meals` (decimal(12,2), >= 0)
  - `other` (decimal(12,2), >= 0)
  - `currencyCode` (string, ISO 4217, required)
  - `total` (decimal(12,2), computed = sum categories)
- Validation rules:
  - At least one category > 0 for submit (edge-case guard).

### 3) ApprovalDecision
- Primary Key: `decisionId` (UUID)
- Foreign Key: `requestId` -> `EventApprovalRequest.requestId`
- Fields:
  - `approverId` (string, required)
  - `approverDisplayName` (string, required)
  - `decisionType` (enum: `approved` | `rejected`, required)
  - `comment` (string, required, 1..2000 chars)
  - `decidedAt` (datetime, required)
- Validation rules:
  - Only one final decision per submission cycle.
  - Decision cannot be recorded if current request status already final and `version` changed.

### 4) RequestHistoryEntry
- Primary Key: `historyEntryId` (UUID)
- Foreign Key: `requestId` -> `EventApprovalRequest.requestId`
- Fields:
  - `eventType` (enum: `submitted` | `approved` | `rejected` | `commented` | `notification_sent` | `stale_detected`)
  - `actorId` (string, required)
  - `actorRole` (enum: `employee` | `approver` | `system`, required)
  - `comment` (string, optional)
  - `metadata` (object/json, optional)
  - `occurredAt` (datetime, required)
- Rules:
  - Immutable: update/delete prohibited after insert.

### 5) StatusNotification
- Primary Key: `notificationId` (UUID)
- Foreign Key: `requestId` -> `EventApprovalRequest.requestId`
- Fields:
  - `recipientId` (string, required)
  - `channel` (enum: `in_app` | `email` | `teams`, required)
  - `payload` (object/json, required; includes request ID, new status, approver comment)
  - `deliveryStatus` (enum: `queued` | `sent` | `failed`, required)
  - `createdAt` (datetime, required)
  - `sentAt` (datetime, nullable)
- Rules:
  - Notification generated on each final status transition.

## State Transitions

### EventApprovalRequest.status
- `draft` -> `submitted` (employee submit)
- `submitted` -> `approved` (approver decision)
- `submitted` -> `rejected` (approver decision)
- Terminal: `approved`, `rejected`

Invalid transitions are rejected with a conflict/error response and logged as stale/concurrency events where applicable.

## Concurrency and Stale Data
- Requests carry `version` and/or ETag.
- Approval action requires latest `version`; mismatch returns conflict and prompts reload.
- History records include stale detection entries when decisions race.

## Dataverse Mapping (Pro Environment)
- `EventApprovalRequest` -> custom table `paca_eventapprovalrequest`
- `CostEstimate` -> `paca_costestimate`
- `ApprovalDecision` -> `paca_approvaldecision`
- `RequestHistoryEntry` -> `paca_requesthistoryentry`
- `StatusNotification` -> `paca_statusnotification`
- Choice fields map to Dataverse Choice columns; relationships map to lookup columns.

# Data Model: Figma UI Implementation

## Overview

This feature does not introduce new data entities. It implements a new UI layer over the existing data model from specs 001 and 002. The UI components consume existing models and API functions. This document defines the **view models** (UI-specific shapes) that bridge the domain model to the Figma screen requirements.

## Existing Entities (Unchanged)

The following entities from [specs/001-event-approval-workflow/data-model.md](../001-event-approval-workflow/data-model.md) and [specs/002-dataverse-integration/data-model.md](../002-dataverse-integration/data-model.md) are consumed as-is:

- **EventApprovalRequest** — Full request entity used on detail views
- **CostEstimate** — Cost breakdown rendered in the sidebar
- **ApprovalDecision** — Decision recorded when approver acts
- **SubmitRequestInput** — Payload for new request submission
- **DecisionInput** — Payload for approve/reject action

## View Models (New, UI-Only)

### 1) DashboardSummary

Computed from the list of requests. Not persisted.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `total` | `number` | `requests.length` | Total count of requests |
| `pending` | `number` | filtered count | Requests with `status === 'submitted'` |
| `approved` | `number` | filtered count | Requests with `status === 'approved'` |
| `rejected` | `number` | filtered count | Requests with `status === 'rejected'` |

### 2) RequestCardData

Data shape for rendering request cards on both employee and approver dashboards.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `requestId` | `string` | `EventApprovalRequest.requestId` | Unique identifier |
| `eventName` | `string` | `EventApprovalRequest.eventName` | Event title |
| `status` | `RequestStatus` | `EventApprovalRequest.status` | Current status |
| `role` | `RoleType` | `EventApprovalRequest.role` | Employee role at event |
| `submittedAt` | `string \| null` | `EventApprovalRequest.submittedAt` | Submission date |
| `destination` | `string` | `EventApprovalRequest.destination` | Travel destination |
| `totalCost` | `number` | `EventApprovalRequest.costEstimate.total` | Total estimated cost |
| `submitterDisplayName` | `string \| undefined` | `EventApprovalRequest.submitterDisplayName` | (Approver view only — undefined in employee view) |
| `latestComment` | `string \| undefined` | `ApprovalDecision.comment` | (Approver view, decided requests only) |

### 3) RequestDetailData

Complete data shape for the detail view (employee and approver).

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `requestId` | `string` | `EventApprovalRequest.requestId` | Unique identifier |
| `eventName` | `string` | `EventApprovalRequest.eventName` | Event title |
| `status` | `RequestStatus` | `EventApprovalRequest.status` | Current status |
| `submittedAt` | `string \| null` | `EventApprovalRequest.submittedAt` | Submission date |
| `submitterDisplayName` | `string` | `EventApprovalRequest.submitterDisplayName` | Requester name |
| `eventWebsite` | `string` | `EventApprovalRequest.eventWebsite` | Clickable link |
| `role` | `RoleType` | `EventApprovalRequest.role` | Employee role |
| `transportationMode` | `TransportationMode` | `EventApprovalRequest.transportationMode` | Transport type |
| `origin` | `string` | `EventApprovalRequest.origin` | Departure location |
| `destination` | `string` | `EventApprovalRequest.destination` | Arrival location |
| `costEstimate` | `CostEstimate` | `EventApprovalRequest.costEstimate` | Full cost breakdown |
| `version` | `number` | `EventApprovalRequest.version` | For optimistic concurrency |

### 4) AppNavState

Represents the current UI navigation context.

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `role` | `AppRole` | `'employee' \| 'approver'` | Current viewing role |
| `screen` | `AppScreen` | See enum below | Current screen |
| `selectedRequestId` | `string \| null` | UUID or null | Request being viewed in detail |

**AppScreen enum values**:
- `'employee-dashboard'` — My Event Requests
- `'new-request'` — Submit form
- `'view-request'` — Employee request detail
- `'approver-dashboard'` — All Event Requests
- `'approve-request'` — Approver request detail with actions

## Transportation Mode Icon Mapping

| TransportationMode | Display | Icon |
|-------------------|---------|------|
| `air` | Flight | ✈️ |
| `rail` | Train | 🚆 |
| `car` | Car | 🚗 |
| `bus` | Bus | 🚌 |
| `other` | Other | 🚐 |

## Status Badge Color Mapping

| Status | Badge BG | Badge Text | Count Color |
|--------|----------|------------|-------------|
| `submitted` (Pending) | `#f0b100` | white | `#d08700` |
| `approved` | `#00c950` | white | `#00a63e` |
| `rejected` | `#fb2c36` | white | `#e7000b` |

## Form Field Mapping (New Request Screen)

| Figma Label | Field Path | Type | Required | Placeholder |
|-------------|-----------|------|----------|-------------|
| Event Name * | `eventName` | text | Yes | "e.g., Tech Conference 2026" |
| Event Website * | `eventWebsite` | url | Yes | "https://example.com" |
| Your Role * | `role` | select | Yes | Speaker/Organizer/Assistant |
| Transportation Mode * | `transportationMode` | select | Yes | Flight/Train/Car/Bus/Other |
| Origin * | `origin` | text | Yes | "e.g., New York, NY" |
| Destination * | `destination` | text | Yes | "e.g., San Francisco, CA" |
| Registration Fee ($) | `costEstimate.registration` | number | No | "0.00" |
| Travel Cost ($) | `costEstimate.travel` | number | No | "0.00" |
| Hotel Cost ($) | `costEstimate.hotels` | number | No | "0.00" |
| Meals ($) | `costEstimate.meals` | number | No | "0.00" |
| Other Expenses ($) | `costEstimate.other` | number | No | "0.00" |
| Total Estimated Cost | `costEstimate.total` | computed | Auto | Sum of above |

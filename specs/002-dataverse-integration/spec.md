# Feature Specification: Dataverse Integration & Environment Data Strategy

**Feature Branch**: `002-dataverse-integration`  
**Created**: 2026-02-16  
**Status**: Draft  
**Input**: User description: "Connect the application to dataverse. Use mock only locally and start using dataverse on dev environment. Create dataverse entities we need for the application. Connect requestor from Entra Id users tenant. For notifications, use a Power Automate Cloud Flow."

## Clarifications

### Session 2026-02-16

- Q: Should CostEstimate be a separate Dataverse table (1:1 lookup) or embedded directly on the request table? → A: Embed cost columns (Registration Fee, Travel Cost, Hotel Cost, Meals, Other Expenses) directly on `paca_eventapprovalrequest`.
- Q: What transaction strategy for multi-record writes (decision + history + status update)? → A: Originally proposed `$batch` with changesets, but research (Decision 6) determined the Code Apps SDK does not support `$batch`. Revised to sequential generated service calls with error handling.
- Q: How should the Power Automate Cloud Flow be triggered on status change? → A: Dataverse trigger ("When a row is added, modified or deleted") filtered on status column change — fully automatic, no app code needed.
- Q: Which notification channels should the Cloud Flow deliver through for the initial release? → A: Teams only.
- Q: How should the system determine which users are approvers? → A: A Dataverse security role (e.g., "Event Approver") — users with this role see the approver dashboard.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dataverse Entity Provisioning (Priority: P1)

An administrator provisions Dataverse custom tables matching the application data model so that the dev environment has a persistent data store for event approval requests, cost estimates, decisions, history entries, and notifications.

**Why this priority**: Without the Dataverse tables in place, no other integration work can proceed — every read and write depends on the underlying entity schema.

**Independent Test**: Can be fully tested by verifying that each custom table exists in the target Dataverse environment with the expected columns, data types, choice values, and lookup relationships, and that a sample row can be created and retrieved through the Dataverse Web API.

**Acceptance Scenarios**:

1. **Given** a Dataverse environment is provisioned, **When** the entity definitions are applied, **Then** the tables `paca_eventapprovalrequest`, `paca_approvaldecision`, `paca_requesthistoryentry`, and `paca_statusnotification` exist with all required columns, and cost fields (Registration Fee, Travel Cost, Hotel Cost, Meals, Other Expenses, Currency Code, Total) are embedded directly on `paca_eventapprovalrequest`.
2. **Given** enum fields (role, transportation mode, request status, decision type, event type, actor role, notification channel, delivery status) are defined, **When** inspecting the table schema, **Then** each maps to a Dataverse Choice column with the correct option values.
3. **Given** lookup relationships are defined, **When** inspecting the schema, **Then** `paca_approvaldecision`, `paca_requesthistoryentry`, and `paca_statusnotification` each have a lookup column referencing `paca_eventapprovalrequest`.
4. **Given** the tables are provisioned, **When** a sample row is created and read via the generated SDK services or maker portal, **Then** the row is persisted and returned with correct data types and values.
---

### User Story 2 - Implement Dataverse Data Provider (Priority: P1)

The application's `DataverseDataProvider` is implemented so that each method (`submitRequest`, `listMyRequests`, `getRequest`, `listPendingApprovals`, `decideRequest`, `getRequestHistory`, `listNotifications`) performs real CRUD operations against Dataverse using the generated SDK services instead of throwing `NOT_IMPLEMENTED`.

**Why this priority**: The data provider is the bridge between the app and the data store. Without it, the dev environment cannot serve real data and the mock-only limitation persists.

**Independent Test**: Can be fully tested by running each data provider method against the Dataverse environment via the generated SDK services and confirming the expected records are created, queried, or updated.

**Acceptance Scenarios**:

1. **Given** a valid `SubmitRequestInput`, **When** `submitRequest` is called, **Then** a new `paca_eventapprovalrequest` row is created in Dataverse with embedded cost fields populated, and the full `EventApprovalRequest` is returned.
2. **Given** one or more requests exist for the current user, **When** `listMyRequests` is called with or without a status filter, **Then** the correct `EventApprovalRequestSummary` list is returned.
3. **Given** a request exists, **When** `getRequest` is called with its ID, **Then** the full request details including cost estimate are returned.
4. **Given** requests exist with status `submitted`, **When** `listPendingApprovals` is called, **Then** only submitted requests are returned.
5. **Given** a submitted request, **When** `decideRequest` is called with a valid `DecisionInput`, **Then** the request status is updated, an `ApprovalDecision` row is created, and a `RequestHistoryEntry` row is created.
6. **Given** a request with history entries, **When** `getRequestHistory` is called, **Then** all history entries are returned in chronological order.
7. **Given** notifications exist for the current user, **When** `listNotifications` is called, **Then** notifications are returned with correct payload and delivery status.

---

### User Story 3 - Environment-Based Data Mode Switching (Priority: P2)

The application uses mock data only when running locally and automatically switches to the Dataverse data provider when deployed in the dev (or higher) environment, driven by an environment variable.

**Why this priority**: Without environment-aware switching, either all environments use mock data or all use Dataverse — the ability to develop locally with mocks while using real data in dev is the core workflow improvement.

**Independent Test**: Can be fully tested by starting the application with `VITE_APP_DATA_MODE=mock` and verifying mock data is served, then restarting with `VITE_APP_DATA_MODE=dataverse` and verifying real Dataverse data is served.

**Acceptance Scenarios**:

1. **Given** the environment variable `VITE_APP_DATA_MODE` is set to `mock` (or not set), **When** the application starts, **Then** `MockDataProvider` is used and fixture data is returned.
2. **Given** the environment variable `VITE_APP_DATA_MODE` is set to `dataverse`, **When** the application starts, **Then** `DataverseDataProvider` is used and operations target the Dataverse Web API.
3. **Given** the deployed dev environment, **When** the application is built and deployed, **Then** the data mode defaults to `dataverse` via the deployment configuration.

---

### User Story 4 - Requestor Identity from Entra ID (Priority: P2)

The application resolves the currently signed-in user's identity from Entra ID (Azure AD) so that request submissions include the authenticated user's ID and display name from the organization's tenant directory.

**Why this priority**: Accurate requestor identity is essential for auditing, approval routing, and notifications. Without Entra ID integration, the submitter identity would be fabricated or hard-coded.

**Independent Test**: Can be fully tested by signing in with a valid Entra ID account and submitting a request, then verifying that the `submitterId` and `submitterDisplayName` fields match the signed-in user's directory attributes.

**Acceptance Scenarios**:

1. **Given** a user is authenticated through Entra ID in the Power Platform environment, **When** they access the application, **Then** their user ID and display name are available to the application without additional sign-in prompts.
2. **Given** the current user's identity is resolved, **When** they submit an event approval request, **Then** the `submitterId` and `submitterDisplayName` fields on the created request match the authenticated user's Entra ID profile.
3. **Given** a user's display name changes in Entra ID, **When** they submit a new request after the change, **Then** the new request reflects the updated display name.

---

### User Story 5 - Power Automate Cloud Flow for Notifications (Priority: P3)

Status-change notifications are sent via a Power Automate Cloud Flow triggered when a request status transitions (approved or rejected), replacing the in-app-only notification mechanism with an automated flow that delivers notifications through Teams (initial release; additional channels may be added later).

**Why this priority**: Notifications enhance user experience but are not required for the core submission-approval data path to function. They can be layered on after the data provider and identity integrations are complete.

**Independent Test**: Can be fully tested by approving or rejecting a request and verifying that the Power Automate Cloud Flow is triggered and delivers notifications through the configured channels.

**Acceptance Scenarios**:

1. **Given** an approver approves or rejects a request, **When** the decision is recorded in Dataverse, **Then** a Power Automate Cloud Flow is triggered automatically.
2. **Given** a Cloud Flow is triggered, **When** the flow executes, **Then** the request submitter receives a notification containing the request identifier, updated status, and approver comment.
3. **Given** a notification delivery fails, **When** the Cloud Flow encounters an error, **Then** the `StatusNotification` row in Dataverse is updated with `deliveryStatus` set to `failed` and the failure is logged for retry or manual review.
4. **Given** the Cloud Flow is configured for Teams, **When** a status change occurs, **Then** a `StatusNotification` row is created with channel set to `teams` and the submitter receives a Teams message.

### User Story 6 - Provision Event Approver Security Role & Row-Level Access (Priority: P1)

An administrator provisions a Dataverse security role named "Event Approver" and configures row-level security so that employees can only see their own requests, while approvers can see all submitted requests and record decisions.

**Why this priority**: Without the security role and row-level access controls, there is no distinction between employees and approvers in the Dataverse environment — any user could see all requests or attempt to record decisions, violating data privacy and authorization requirements.

**Independent Test**: Can be fully tested by assigning the "Event Approver" role to one user and leaving another as a normal employee, then verifying that the employee sees only their own requests and the approver sees all submitted requests and can record decisions.

**Acceptance Scenarios**:

1. **Given** the Dataverse environment is provisioned, **When** security roles are inspected, **Then** an "Event Approver" security role exists with organization-level read access to all requests and write access to decision and status fields.
2. **Given** a normal user (employee without "Event Approver" role) queries requests, **When** `listMyRequests` is called, **Then** only requests where `submitterId` matches the current user are returned — the employee cannot see other users' requests.
3. **Given** a user with the "Event Approver" role queries pending approvals, **When** `listPendingApprovals` is called, **Then** all submitted requests from all employees are returned.
4. **Given** a normal user (employee) attempts to access the approver dashboard or decide a request, **When** the action is attempted, **Then** the system denies access with a clear "insufficient permissions" message.
5. **Given** an employee creates a request, **When** another employee queries requests, **Then** the other employee's results do not include the first employee's request.

---

### Edge Cases

- What happens when the Dataverse Web API is temporarily unavailable? The application should display a user-friendly error and allow retry without data loss of in-progress form state.
- What happens when a user's Entra ID session expires mid-form? The application should prompt re-authentication and preserve the form state so the user can resume submission.
- What if a Power Automate Cloud Flow run fails for a specific notification? The system should mark the notification row as `failed` and not block the approval decision from completing.
- What happens when two approvers attempt to decide the same request simultaneously? Optimistic concurrency via the `version` field prevents conflicting decisions and returns a conflict error to the later approver.
- What if a user without the "Event Approver" role attempts to access the approver dashboard or decide a request? The system should deny access and show a clear "insufficient permissions" message.
- What if the Dataverse environment has not been provisioned yet but the app is set to `dataverse` mode? The application should fail gracefully with a clear configuration error rather than crashing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provision Dataverse custom tables (`paca_eventapprovalrequest`, `paca_approvaldecision`, `paca_requesthistoryentry`, `paca_statusnotification`) with columns matching the application data model. Cost fields (Registration Fee, Travel Cost, Hotel Cost, Meals, Other Expenses, Currency Code, Total) MUST be embedded directly on `paca_eventapprovalrequest`.
- **FR-002**: System MUST map application enum types (RoleType, TransportationMode, RequestStatus, DecisionType, HistoryEventType, ActorRole, NotificationChannel, NotificationDeliveryStatus) to Dataverse Choice columns.
- **FR-003**: System MUST define lookup relationships from child entities (`ApprovalDecision`, `RequestHistoryEntry`, `StatusNotification`) to the parent `EventApprovalRequest` table.
- **FR-004**: The `DataverseDataProvider` MUST implement all `IDataProvider` methods (`submitRequest`, `listMyRequests`, `getRequest`, `listPendingApprovals`, `decideRequest`, `getRequestHistory`, `listNotifications`) using the Power Apps SDK generated services (not raw Dataverse Web API calls).
- **FR-005**: The `DataverseDataProvider` MUST perform multi-record writes using sequential generated SDK service calls with error handling for operations that create or update multiple related records (e.g., decision + history entry + status update on decide). The Code Apps SDK does not support `$batch`; see research Decision 6 for rationale and risk mitigation.
- **FR-006**: The application MUST use `MockDataProvider` when `VITE_APP_DATA_MODE` is `mock` or unset, and `DataverseDataProvider` when `VITE_APP_DATA_MODE` is `dataverse`.
- **FR-007**: System MUST resolve the current user's identity (user ID and display name) from Entra ID when running in the Power Platform environment.
- **FR-008**: System MUST populate `submitterId` and `submitterDisplayName` on new requests from the authenticated Entra ID user's profile.
- **FR-009**: System MUST trigger a Power Automate Cloud Flow using a Dataverse trigger ("When a row is added, modified or deleted") filtered on the status column of `paca_eventapprovalrequest`. The trigger fires automatically when the status changes to `approved` or `rejected` — no explicit invocation from app code is required.
- **FR-010**: The Power Automate Cloud Flow MUST deliver a Teams notification to the request submitter containing the request identifier, updated status, and decision comment.
- **FR-011**: System MUST create a `StatusNotification` row in Dataverse for each notification sent, tracking delivery status (`queued`, `sent`, `failed`).
- **FR-012**: System MUST enforce optimistic concurrency via the `version` field when updating request status through Dataverse, returning a conflict error on version mismatch.
- **FR-012a**: System MUST provision a Dataverse security role named "Event Approver". Only users assigned this security role MUST see the approver dashboard and be able to record decisions. The role MUST grant read access to all submitted requests and write access to decision and status fields.
- **FR-012b**: System MUST enforce row-level security so that normal users (employees without the "Event Approver" role) can only read and list their own requests — requests where `submitterId` matches the current authenticated user. Employees MUST NOT be able to see other users' requests.
- **FR-013**: Feature MUST define code quality expectations (lint/format/static analysis) and ensure the Dataverse provider code passes all quality gates.
- **FR-014**: Feature MUST define required tests (unit tests for data mapping, integration tests for Dataverse CRUD operations, contract tests for API shape compliance).
- **FR-015**: Feature MUST define consistent error handling behavior for Dataverse API failures — loading, error, and retry states must follow existing UX patterns.
- **FR-016**: Feature MUST define measurable performance budgets for Dataverse read and write operations to ensure acceptable user experience.

### Key Entities

- **EventApprovalRequest** (`paca_eventapprovalrequest`): Core entity storing event details, travel info, status, submitter identity, version for concurrency control, and embedded cost fields (Registration Fee, Travel Cost, Hotel Cost, Meals, Other Expenses, Currency Code, Total). Lookup from Entra ID user for submitter.
- **ApprovalDecision** (`paca_approvaldecision`): Records each approval or rejection with approver identity, decision type, comment, and timestamp. 1:N with request.
- **RequestHistoryEntry** (`paca_requesthistoryentry`): Immutable audit trail of lifecycle events (submitted, approved, rejected, commented, notification_sent, stale_detected). 1:N with request.
- **StatusNotification** (`paca_statusnotification`): Tracks notifications sent via Power Automate Cloud Flow with channel, payload, delivery status, and timestamps. 1:N with request.

### Assumptions

- The Power Platform dev environment is already provisioned and accessible to the development team.
- Users accessing the application in the dev environment are authenticated through Entra ID via the Power Platform host (Code App runtime provides the authenticated user context).
- Approver access is governed by a Dataverse security role (e.g., "Event Approver") managed through the Power Platform admin center.
- The Dataverse Web API is accessible from the Code App at runtime using the authenticated user's session.
- Power Automate Cloud Flows can be triggered by Dataverse row creation or update events.
- The existing `IDataProvider` interface and `providerFactory` pattern remain unchanged — only the `DataverseDataProvider` implementation is updated.
- Currency format follows ISO 4217 as already defined in the data model.
- The `version` column in Dataverse uses a standard integer field for optimistic concurrency control.

### Dependencies

- Power Platform environment with Dataverse database provisioned.
- Entra ID tenant with users who will access the application.
- Power Automate license for Cloud Flow creation and execution.
- Dataverse Web API access from the Code App runtime environment.
- Existing `IDataProvider` interface from `001-event-approval-workflow` feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All four Dataverse custom tables are provisioned with correct schema and relationships in the dev environment (cost fields embedded on the request table), verified by creating and retrieving a test row for each table.
- **SC-002**: 100% of `IDataProvider` methods in `DataverseDataProvider` execute successfully against the Dataverse environment without throwing `NOT_IMPLEMENTED`.
- **SC-003**: Users running the application locally with `VITE_APP_DATA_MODE=mock` see fixture data, while users in the dev environment see data from Dataverse — verified by smoke testing both modes.
- **SC-004**: Request submissions in the dev environment contain the correct Entra ID user ID and display name, verified by cross-referencing submitted records with the Entra ID directory.
- **SC-005**: 95% of approval/rejection actions trigger the Power Automate Cloud Flow and deliver a notification to the submitter within 2 minutes.
- **SC-006**: Dataverse read operations (list requests, get request details, list pending approvals) complete within 3 seconds as perceived by the user.
- **SC-007**: Dataverse write operations (submit request, record decision) complete within 5 seconds as perceived by the user.
- **SC-008**: All unit, integration, and contract tests pass with the Dataverse provider, including data mapping tests and error handling tests.
- **SC-009**: Optimistic concurrency conflicts are detected and surfaced to the user with a clear reload prompt — no silent data overwrites occur.
- **SC-010**: The "Event Approver" security role is provisioned and only users with this role can access the approver dashboard and record decisions.
- **SC-011**: A normal user (employee) can only see their own requests — querying requests as employee A returns zero results for requests submitted by employee B.

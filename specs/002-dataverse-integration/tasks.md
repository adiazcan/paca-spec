# Tasks: Dataverse Integration & Environment Data Strategy

**Input**: Design documents from `/specs/002-dataverse-integration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED. Include the minimum effective test set (unit first, then integration/contract as needed).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Code App root**: `apps/event-approval-codeapp/`
- **Source**: `apps/event-approval-codeapp/src/`
- **Tests**: `apps/event-approval-codeapp/tests/`
- **Scripts**: `scripts/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, generated code scaffolding, and shared configuration

- [x] T001 Verify PACX CLI is installed and PAC CLI is authenticated to the target Dataverse environment
- [x] T001a Create the Dataverse provisioning script `scripts/provision-dataverse-tables.ps1` implementing the full entity model from `specs/002-dataverse-integration/data-model.md` using PACX CLI commands: (1) create 8 global choices (`paca_roletype`, `paca_transportationmode`, `paca_requeststatus`, `paca_decisiontype`, `paca_historyeventtype`, `paca_actorrole`, `paca_notificationchannel`, `paca_notificationdeliverystatus`) with correct label/value pairs, (2) create 4 custom tables (`paca_eventapprovalrequest`, `paca_approvaldecision`, `paca_requesthistoryentry`, `paca_statusnotification`) with primary attributes, (3) add all typed columns per data model (String, Money, DateTime, Picklist, WholeNumber, Memo) including embedded cost fields on the request table, (4) create 3 N:1 lookup relationships from child tables to `paca_eventapprovalrequest`, (5) publish all customizations via `pacx publish all`
- [x] T002 Run `scripts/provision-dataverse-tables.ps1` to create all 4 Dataverse custom tables, 8 global choices, columns, and lookup relationships
- [x] T003 Add Dataverse data sources to the code app by running `pac code add-data-source -a dataverse -t <table>` for each of the 4 tables (`paca_eventapprovalrequest`, `paca_approvaldecision`, `paca_requesthistoryentry`, `paca_statusnotification`) in `apps/event-approval-codeapp/`
- [x] T004 Add Office 365 Users connector as a data source by running `pac code add-data-source -a "shared_office365users" -c <connectionId>` in `apps/event-approval-codeapp/`
- [x] T005 Verify generated files exist under `apps/event-approval-codeapp/src/generated/models/` and `apps/event-approval-codeapp/src/generated/services/` for all 4 tables and the Office 365 Users connector
- [x] T005a Verify `apps/event-approval-codeapp/power.config.json` is updated with connection references for Dataverse tables and Office 365 Users connector after adding data sources

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared mapping utilities and identity resolution that ALL user stories depend on

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete

- [x] T006 Create Dataverse-to-app-domain mapper functions (choice int → enum string, Dataverse row → app domain type, and reverse mappings for all 4 entities) in `apps/event-approval-codeapp/src/services/dataverse/mappers.ts`
- [x] T007 [P] Create unit tests for all mapper functions (choice int ↔ enum string roundtrips for RoleType, TransportationMode, RequestStatus, DecisionType, HistoryEventType, ActorRole, NotificationChannel, NotificationDeliveryStatus; row-to-domain and domain-to-row for EventApprovalRequest, ApprovalDecision, RequestHistoryEntry, StatusNotification; CostEstimate assembly from embedded columns) in `apps/event-approval-codeapp/tests/unit/dataverse-mappers.test.ts`
- [x] T008 [P] Create identity service that wraps the generated `Office365UsersService.MyProfile_V2()` to resolve current user's `id` and `displayName` from Entra ID, with a mock fallback when running in mock mode, in `apps/event-approval-codeapp/src/services/dataverse/identityService.ts`

**Checkpoint**: Mappers and identity resolution ready — user story implementation can begin

---

## Phase 3: User Story 1 — Dataverse Entity Provisioning (Priority: P1) 🎯 MVP

**Goal**: Verify that Dataverse custom tables are provisioned correctly with all columns, choice values, and lookup relationships, and that sample rows can be created and retrieved.

**Independent Test**: Run the provisioning script, then verify each table exists with expected columns, data types, and relationships by creating and retrieving a sample row.

### Tests for User Story 1 (REQUIRED) ⚠️

- [x] T009 [P] [US1] Create contract test verifying all 4 Dataverse tables exist with expected columns, choice values, and lookup relationships against the OpenAPI schema in `apps/event-approval-codeapp/tests/contract/dataverse-contract.test.ts`

### Implementation for User Story 1

- [x] T010 [US1] Validate provisioning script `scripts/provision-dataverse-tables.ps1` by executing it against the target environment and confirming all 8 global choices, 4 tables, all columns (String, Money, DateTime, Picklist, WholeNumber, Memo), and 3 lookup relationships are created
- [x] T011 [US1] Verify sample row CRUD for each table: create a test row in `paca_eventapprovalrequest` with embedded cost fields, create child rows in `paca_approvaldecision`, `paca_requesthistoryentry`, and `paca_statusnotification` with lookup references, retrieve and validate data types and values

**Checkpoint**: All 4 Dataverse tables provisioned and verified — data provider implementation can proceed

---

## Phase 4: User Story 6 — Event Approver Security Role & Row-Level Access (Priority: P1)

**Goal**: Provision the "Event Approver" security role and configure row-level security so employees see only their own requests while approvers see all submitted requests.

**Independent Test**: Assign "Event Approver" role to one user, leave another as employee, then verify employee sees only own requests and approver sees all submitted requests.

### Implementation for User Story 6

- [ ] T012 [US6] Create the "Event Approver" security role in the Dataverse environment with organization-level read on `paca_eventapprovalrequest`, user-level create on `paca_approvaldecision` and `paca_requesthistoryentry`, and user-level write on `paca_eventapprovalrequest` (status and version fields)
- [ ] T013 [US6] Configure default employee access: user-level read/create on own rows for `paca_eventapprovalrequest`, user-level read on own rows for `paca_approvaldecision`, `paca_requesthistoryentry`, and `paca_statusnotification`
- [ ] T014 [US6] Assign the "Event Approver" role to designated approver test accounts and verify row-level access by querying requests as employee vs approver

### Tests for User Story 6 (REQUIRED) ⚠️

- [ ] T014a [P] [US6] Create integration test verifying that an employee-scoped query returns only own rows and an approver-scoped query returns all submitted rows in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`
- [ ] T014b [P] [US6] Create integration test verifying that an employee attempting `decideRequest` receives a `FORBIDDEN` error in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`

**Checkpoint**: Security role provisioned — data provider can now enforce access boundaries

---

## Phase 5: User Story 2 — Implement Dataverse Data Provider (Priority: P1) 🎯 MVP

**Goal**: Replace the `NOT_IMPLEMENTED` stubs in `DataverseDataProvider` with real CRUD operations against Dataverse using the generated SDK services, wrapped by the mapper layer.

**Independent Test**: Run each `IDataProvider` method against the Dataverse environment and confirm expected records are created, queried, or updated correctly.

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T015 [P] [US2] Create integration test for `submitRequest` — verify a new `paca_eventapprovalrequest` row is created in Dataverse with embedded cost fields, correct submitter identity, status `submitted`, version `1`, and an accompanying `paca_requesthistoryentry` for the `submitted` event — in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`
- [ ] T016 [P] [US2] Create integration test for `listMyRequests` — verify filtered results by current user and optional status filter — in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`
- [ ] T017 [P] [US2] Create integration test for `getRequest` — verify full request details with assembled CostEstimate and choice-to-enum mappings — in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`
- [ ] T018 [P] [US2] Create integration test for `listPendingApprovals` — verify only `submitted` status requests are returned — in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`
- [ ] T019 [P] [US2] Create integration test for `decideRequest` — verify decision row created, request status updated, history entry created, and optimistic concurrency conflict detection — in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`
- [ ] T020 [P] [US2] Create integration test for `getRequestHistory` — verify chronological order and filter options — in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`
- [ ] T021 [P] [US2] Create integration test for `listNotifications` — verify notifications filtered by current user — in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`
- [ ] T022 [P] [US2] Create contract test validating response shapes from `DataverseDataProvider` against the OpenAPI v2 spec in `apps/event-approval-codeapp/tests/contract/dataverse-contract.test.ts`

### Implementation for User Story 2

- [ ] T023 [US2] Implement `submitRequest` in `apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts` — use `PacaEventapprovalrequestService.create()` with mapped input fields, auto-generate `requestNumber`, set status to `submitted` and version to `1`, populate `submitterId`/`submitterDisplayName` from identity service, then create a `paca_requesthistoryentry` row via `PacaRequesthistoryentryService.create()` with the `submitted` event type
- [ ] T024 [US2] Implement `listMyRequests` in `apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts` — use `PacaEventapprovalrequestService.getAll()` with OData filter on `paca_submitterid` matching current user, optional status filter, and map results to `EventApprovalRequestSummary[]`
- [ ] T025 [US2] Implement `getRequest` in `apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts` — use `PacaEventapprovalrequestService.get()` by primary key and map Dataverse row to `EventApprovalRequest` with assembled `CostEstimate`
- [ ] T026 [US2] Implement `listPendingApprovals` in `apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts` — use `PacaEventapprovalrequestService.getAll()` with OData filter `paca_status eq 1` (submitted) and map to `EventApprovalRequestSummary[]`
- [ ] T027 [US2] Implement `decideRequest` in `apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts` — sequential operations: (1) read current request and assert version matches, (2) create `paca_approvaldecision` row via `PacaApprovaldecisionService.create()` with lookup to request, (3) update request status and increment version via `PacaEventapprovalrequestService.update()`, (4) create `paca_requesthistoryentry` row for the decision event; handle concurrency conflict and return appropriate `CONFLICT` error
- [ ] T028 [US2] Implement `getRequestHistory` in `apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts` — use `PacaRequesthistoryentryService.getAll()` filtered by `paca_requestid` lookup, sorted by `paca_occurredat` ascending, with optional eventType and date range filters
- [ ] T029 [US2] Implement `listNotifications` in `apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts` — use `PacaStatusnotificationService.getAll()` filtered by `paca_recipientid` matching current user, parse JSON `paca_payload` into `NotificationPayload`
- [ ] T030 [US2] Add error handling to all `DataverseDataProvider` methods — map Dataverse service errors to `ApiError` codes (`NOT_FOUND`, `CONFLICT`, `FORBIDDEN`, `UNKNOWN`), handle network failures with user-friendly messages following existing UX patterns in `apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts`
- [ ] T030a [US2] Add graceful startup error when `VITE_APP_DATA_MODE=dataverse` but Dataverse environment is not provisioned or unreachable — display a clear configuration error instead of crashing, in `apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts`

**Checkpoint**: All 7 `IDataProvider` methods implemented in Dataverse mode — submit, list, get, approve, reject, history, and notifications work against real data

---

## Phase 6: User Story 3 — Environment-Based Data Mode Switching (Priority: P2)

**Goal**: Application uses `MockDataProvider` locally and `DataverseDataProvider` in dev/prod, driven by `VITE_APP_DATA_MODE` environment variable.

**Independent Test**: Start app with `VITE_APP_DATA_MODE=mock` and verify fixture data; restart with `VITE_APP_DATA_MODE=dataverse` and verify real Dataverse data.

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T031 [P] [US3] Create integration test verifying `providerFactory` returns `MockDataProvider` when `VITE_APP_DATA_MODE=mock` and `DataverseDataProvider` when `VITE_APP_DATA_MODE=dataverse` in `apps/event-approval-codeapp/tests/integration/dataverse-provider.integration.test.ts`

### Implementation for User Story 3

- [ ] T032 [US3] Verify `apps/event-approval-codeapp/src/services/api-client/environment.ts` correctly resolves `mock` as default and `dataverse` when `VITE_APP_DATA_MODE=dataverse` — no changes expected, validate existing logic
- [ ] T033 [US3] Verify `apps/event-approval-codeapp/src/services/api-client/providerFactory.ts` instantiates `DataverseDataProvider` when mode is `dataverse` — no changes expected, validate existing logic
- [ ] T034 [US3] Update build/deployment configuration to set `VITE_APP_DATA_MODE=dataverse` as default for the dev environment build in `apps/event-approval-codeapp/vite.config.ts` or `.env.production`

**Checkpoint**: Mock/Dataverse switching works — local dev uses mocks, deployed app uses Dataverse

---

## Phase 7: User Story 4 — Requestor Identity from Entra ID (Priority: P2)

**Goal**: Verify that the identity service (created in T008) correctly resolves the current user's identity from Entra ID via the Office 365 Users connector, and that all provider methods use real authenticated user data end-to-end.

**Independent Test**: Sign in with a valid Entra ID account, submit a request, and verify `submitterId` and `submitterDisplayName` match the directory profile.

### Tests for User Story 4 (REQUIRED) ⚠️

- [ ] T035 [P] [US4] Create unit test for identity service — verify mock fallback returns default user and Dataverse mode calls `Office365UsersService.MyProfile_V2()` — in `apps/event-approval-codeapp/tests/unit/identity-service.test.ts`

### Verification for User Story 4

- [ ] T036 [US4] End-to-end verification: submit a request in Dataverse mode and confirm `paca_submitterid` and `paca_submitterdisplayname` match the authenticated Entra ID profile (identity service is already integrated in T023)
- [ ] T037 [US4] End-to-end verification: call `listMyRequests` in Dataverse mode and confirm results are filtered by the authenticated user's Entra ID (identity service is already integrated in T024)
- [ ] T038 [US4] End-to-end verification: call `decideRequest` in Dataverse mode and confirm `paca_approverid` and `paca_approverdisplayname` match the authenticated approver's Entra ID profile (identity service is already integrated in T027)
- [ ] T039 [US4] End-to-end verification: call `listNotifications` in Dataverse mode and confirm results are filtered by the authenticated user's `recipientId` (identity service is already integrated in T029)
- [ ] T039a [US4] Verify Entra ID session expiry handling: confirm the application prompts re-authentication and preserves in-progress form state when the session expires mid-form

**Checkpoint**: All Dataverse operations use real Entra ID identity — no hard-coded users

---

## Phase 8: User Story 5 — Power Automate Cloud Flow for Notifications (Priority: P3)

**Goal**: Automated notifications via Power Automate Cloud Flow triggered on request status changes, delivering Teams messages to submitters.

**Independent Test**: Approve or reject a request and verify the Cloud Flow triggers, delivers a Teams notification, and creates a `paca_statusnotification` row with correct delivery status.

### Implementation for User Story 5

- [ ] T040 [US5] Create a Power Automate Cloud Flow with trigger "When a row is added, modified or deleted" on `paca_eventapprovalrequest`, filtered on `paca_status` column changes to `approved` (2) or `rejected` (3)
- [ ] T041 [US5] Add flow actions: (1) get submitter details using `paca_submitterid`, (2) post an adaptive card or message to the submitter via Teams containing request identifier, updated status, and decision comment
- [ ] T042 [US5] Add flow action to create a `paca_statusnotification` row with `channel = teams`, `deliveryStatus = sent`, `payload` JSON containing requestId/status/comment, and `sentAt` timestamp
- [ ] T043 [US5] Add error handling to the Cloud Flow: on failure, create a `paca_statusnotification` row with `deliveryStatus = failed` and log the error for retry or manual review
- [ ] T044 [US5] Test end-to-end: approve a request → verify Cloud Flow runs → verify Teams notification received → verify `paca_statusnotification` row created with `deliveryStatus = sent`

**Checkpoint**: Notification pipeline working — status changes trigger Teams notifications automatically

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, performance validation, and consistency checks across all stories

- [ ] T045 [P] Run ESLint, Prettier, and `tsc --noEmit` on all new and modified files to pass code quality gates
- [ ] T046 [P] Run all existing unit tests to verify no regressions from `001-event-approval-workflow`
- [ ] T047 [P] Run all existing contract tests to verify backward compatibility with v1 OpenAPI spec
- [ ] T048 Update smoke e2e test `apps/event-approval-codeapp/tests/e2e/event-approval.smoke.spec.ts` to cover Dataverse mode: employee submit → approver decision → notification delivery
- [ ] T049 Performance validation: measure p95 latency for submit (<5s), dashboard load (<5s), decision (<5s), history retrieval (<3s), and notification delivery (<120s) against Dataverse
- [ ] T050 UX consistency validation: verify loading, empty, error, and stale states display correctly in Dataverse mode following existing patterns
- [ ] T051 Run `specs/002-dataverse-integration/quickstart.md` manual acceptance checklist end-to-end to confirm all 11 items pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (generated services must exist) — BLOCKS all user stories
- **US1 — Entity Provisioning (Phase 3)**: Depends on Phase 1 (provisioning script executed in setup)
- **US6 — Security Role (Phase 4)**: Depends on Phase 3 (tables must exist before configuring roles)
- **US2 — Data Provider (Phase 5)**: Depends on Phase 2 (mappers/identity) and Phase 3 (tables provisioned)
- **US3 — Mode Switching (Phase 6)**: Depends on Phase 5 (DataverseDataProvider must be functional)
- **US4 — Entra ID Identity (Phase 7)**: Depends on Phase 2 (identity service) and Phase 5 (provider implemented)
- **US5 — Notifications Flow (Phase 8)**: Depends on Phase 3 (tables) and Phase 5 (status changes working)
- **Polish (Phase 9)**: Depends on all desired phases being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Setup — no dependencies on other stories
- **US6 (P1)**: Depends on US1 (tables must be provisioned first)
- **US2 (P1)**: Depends on Foundational + US1 — core implementation story
- **US3 (P2)**: Depends on US2 — needs working DataverseDataProvider to validate switching
- **US4 (P2)**: Depends on US2 — integrates identity into existing provider methods
- **US5 (P3)**: Can start after US1 (tables exist) — independent Power Automate configuration; test after US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Mappers/utilities before provider methods
- Provider methods in dependency order (submit → list → decide → history → notifications)
- Core implementation before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- T003 and T004 in Phase 1 can run in parallel (different data sources)
- T006, T007, T008 in Phase 2: T007 and T008 can run in parallel (different files)
- T015–T022 in Phase 5: All test tasks can be written in parallel (same file, but different test blocks)
- T031, T035 can run in parallel with Phase 5 implementation (different stories)
- US3 (Phase 6) and US5 (Phase 8) can be worked in parallel after their prerequisites are met
- All Phase 9 tasks marked [P] can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all integration tests for US2 together (T015–T022):
Task: "Integration test for submitRequest in tests/integration/dataverse-provider.integration.test.ts"
Task: "Integration test for listMyRequests in tests/integration/dataverse-provider.integration.test.ts"
Task: "Integration test for getRequest in tests/integration/dataverse-provider.integration.test.ts"
Task: "Integration test for listPendingApprovals in tests/integration/dataverse-provider.integration.test.ts"
Task: "Integration test for decideRequest in tests/integration/dataverse-provider.integration.test.ts"
Task: "Integration test for getRequestHistory in tests/integration/dataverse-provider.integration.test.ts"
Task: "Integration test for listNotifications in tests/integration/dataverse-provider.integration.test.ts"
Task: "Contract test for Dataverse response shapes in tests/contract/dataverse-contract.test.ts"

# Then implement provider methods sequentially (T023–T030):
# submitRequest → listMyRequests → getRequest → listPendingApprovals → decideRequest → getRequestHistory → listNotifications → error handling
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 6 + 2)

1. Complete Phase 1: Setup (provisioning, data sources, generated code)
2. Complete Phase 2: Foundational (mappers, identity service)
3. Complete Phase 3: US1 — Verify tables provisioned correctly
4. Complete Phase 4: US6 — Security role and row-level access
5. Complete Phase 5: US2 — Full DataverseDataProvider implementation
6. **STOP and VALIDATE**: All 7 IDataProvider methods work against Dataverse
7. Deploy/demo if ready — app can submit, list, approve/reject, and view history with real data

### Incremental Delivery

1. Setup + Foundational → Generated code and mappers ready
2. US1 + US6 → Tables and security provisioned → Verify in maker portal
3. US2 → DataverseDataProvider complete → Test all CRUD operations (MVP!)
4. US3 → Environment switching validated → Local mock + dev Dataverse
5. US4 → Entra ID identity integrated → Real user data in all operations
6. US5 → Power Automate notifications → Teams alerts on status changes
7. Polish → Quality gates, performance, e2e smoke → Release-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (provisioning verification) + US2 (data provider)
   - Developer B: US6 (security role) + US5 (Power Automate flow)
3. After US2 completes:
   - Developer A: US3 (mode switching) + US4 (Entra ID)
   - Developer B: US5 testing (needs working provider)
4. Team completes Polish together

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Generated files under `src/generated/` are auto-created by PAC CLI — do not manually edit
- PACX commands share PAC CLI auth profiles — ensure `pac auth` is configured before provisioning
- Sequential writes in `decideRequest` use best-effort approach: decision → status update → history entry
- Power Automate Cloud Flow (US5) is configured in the Power Platform portal, not in app code

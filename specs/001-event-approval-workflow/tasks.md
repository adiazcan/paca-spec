# Tasks: Event Approval Workflow Code App

**Input**: Design documents from `/specs/001-event-approval-workflow/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included because `spec.md` explicitly requires automated coverage (FR-015).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- All task descriptions include an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline tooling for the Power Apps code app.

- [ ] T001 Scaffold app from Vite template and commit base structure in apps/event-approval-codeapp/package.json
- [ ] T002 Initialize Power Apps code app runtime metadata with pac in apps/event-approval-codeapp/src/app
- [ ] T003 [P] Configure TypeScript strict mode and path aliases in apps/event-approval-codeapp/tsconfig.json
- [ ] T004 [P] Configure ESLint + Prettier quality gates in apps/event-approval-codeapp/eslint.config.js
- [ ] T005 [P] Add Vitest and Testing Library setup in apps/event-approval-codeapp/tests/unit/setupTests.ts
- [ ] T006 [P] Add Playwright smoke configuration in apps/event-approval-codeapp/tests/e2e/playwright.config.ts
- [ ] T007 [P] Add environment mode contract (`mock|dataverse`) in apps/event-approval-codeapp/src/services/api-client/environment.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core architecture required before any user story implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T008 Define domain types and enums from data model in apps/event-approval-codeapp/src/models/eventApproval.ts
- [ ] T009 [P] Implement Zod shared schemas for request/decision/history validation in apps/event-approval-codeapp/src/validation/schemas.ts
- [ ] T010 [P] Create shared API client interface + error model in apps/event-approval-codeapp/src/services/api-client/types.ts
- [ ] T011 Implement IDataProvider contract and provider selector in apps/event-approval-codeapp/src/services/api-client/providerFactory.ts
- [ ] T012 [P] Implement deterministic fixture seed for local mock mode in apps/event-approval-codeapp/src/services/mocks/fixtures.ts
- [ ] T013 Implement MockDataProvider base CRUD and transition helpers in apps/event-approval-codeapp/src/services/mocks/mockDataProvider.ts
- [ ] T014 [P] Implement DataverseDataProvider skeleton and method signatures in apps/event-approval-codeapp/src/services/dataverse/dataverseDataProvider.ts
- [ ] T015 [P] Implement shared view-state (`loading|empty|error|stale`) hook in apps/event-approval-codeapp/src/app/useViewState.ts
- [ ] T016 [P] Add app shell routing + role-aware navigation in apps/event-approval-codeapp/src/app/App.tsx
- [ ] T017 Configure CI quality/test scripts for lint, typecheck, unit, integration, contract, e2e in apps/event-approval-codeapp/package.json

**Checkpoint**: Foundation ready; user story work can start.

---

## Phase 3: User Story 1 - Submit Event Approval Request (Priority: P1) 🎯 MVP

**Goal**: Employees can submit complete event approval requests and view them in personal request history.

**Independent Test**: Submit a valid request from the employee form, verify status is `submitted`, and confirm it appears in employee history with preserved details.

### Tests for User Story 1

- [ ] T018 [P] [US1] Add contract tests for `POST /requests` and validation failures in apps/event-approval-codeapp/tests/contract/requests.submit.contract.test.ts
- [ ] T019 [P] [US1] Add contract tests for `GET /requests/history` in apps/event-approval-codeapp/tests/contract/requests.history.contract.test.ts
- [ ] T020 [P] [US1] Add integration test for valid submission journey in apps/event-approval-codeapp/tests/integration/submit-request.integration.test.ts
- [ ] T021 [P] [US1] Add integration test for required-field and zero-cost validation errors in apps/event-approval-codeapp/tests/integration/submit-request.validation.integration.test.ts
- [ ] T058 [P] [US1] Add integration tests for invalid website URL and non-blocking unreachable website warning in apps/event-approval-codeapp/tests/integration/submit-request.website-validation.integration.test.ts

### Implementation for User Story 1

- [ ] T022 [P] [US1] Implement submit-request form state and field components in apps/event-approval-codeapp/src/features/submit-request/SubmitRequestForm.tsx
- [ ] T023 [US1] Implement submit-request schema and business validation rules in apps/event-approval-codeapp/src/features/submit-request/submitRequestSchema.ts
- [ ] T059 [US1] Implement `https` website validation and non-blocking reachability warning behavior in apps/event-approval-codeapp/src/features/submit-request/submitRequestSchema.ts
- [ ] T024 [US1] Implement request submission service (`submitRequest`) in apps/event-approval-codeapp/src/services/api-client/requests.ts
- [ ] T025 [US1] Implement employee request history list service (`listMyRequests`) in apps/event-approval-codeapp/src/services/api-client/requests.ts
- [ ] T026 [P] [US1] Implement submit-request page with shared view states in apps/event-approval-codeapp/src/features/submit-request/SubmitRequestPage.tsx
- [ ] T027 [P] [US1] Implement request-history page for employees in apps/event-approval-codeapp/src/features/request-history/RequestHistoryPage.tsx
- [ ] T028 [US1] Add US1 route wiring and navigation entries in apps/event-approval-codeapp/src/app/App.tsx

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Review and Decide Requests (Priority: P2)

**Goal**: Approvers can review pending requests and record approve/reject decisions with required comments.

**Independent Test**: Open pending queue, inspect a request, submit approve/reject decision with comment, and verify status/history update.

### Tests for User Story 2

- [ ] T029 [P] [US2] Add contract tests for `GET /approvals/pending` in apps/event-approval-codeapp/tests/contract/approvals.pending.contract.test.ts
- [ ] T030 [P] [US2] Add contract tests for `POST /approvals/{requestId}/decision` including `409` conflict in apps/event-approval-codeapp/tests/contract/approvals.decision.contract.test.ts
- [ ] T031 [P] [US2] Add integration test for approve flow with comment in apps/event-approval-codeapp/tests/integration/approver-decision.approve.integration.test.ts
- [ ] T032 [P] [US2] Add integration test for reject flow and stale version conflict in apps/event-approval-codeapp/tests/integration/approver-decision.reject-stale.integration.test.ts
- [ ] T054 [P] [US2] Add integration tests for approver dashboard `loading|empty|error|stale` states in apps/event-approval-codeapp/tests/integration/approver-dashboard.view-states.integration.test.ts
- [ ] T055 [P] [US2] Add integration tests for request review panel `loading|error|stale-conflict` state messaging in apps/event-approval-codeapp/tests/integration/request-review.view-states.integration.test.ts

### Implementation for User Story 2

- [ ] T033 [P] [US2] Implement pending approvals service (`listPendingApprovals`) in apps/event-approval-codeapp/src/services/api-client/approvals.ts
- [ ] T034 [P] [US2] Implement decision submission service (`decideRequest`) with version handling in apps/event-approval-codeapp/src/services/api-client/approvals.ts
- [ ] T035 [P] [US2] Implement approver dashboard list and request selection UI in apps/event-approval-codeapp/src/features/approver-dashboard/ApproverDashboardPage.tsx
- [ ] T036 [US2] Implement request review panel with approve/reject + mandatory comment form in apps/event-approval-codeapp/src/features/approver-dashboard/RequestReviewPanel.tsx
- [ ] T037 [US2] Record immutable decision/history entries in mock provider transition path in apps/event-approval-codeapp/src/services/mocks/mockDataProvider.ts
- [ ] T038 [US2] Add approver routes and access checks in apps/event-approval-codeapp/src/app/App.tsx

**Checkpoint**: User Stories 1 and 2 both operate independently.

---

## Phase 5: User Story 3 - Track Status and Notifications (Priority: P3)

**Goal**: Users can view lifecycle timeline and receive status-change notifications.

**Independent Test**: After decisioning a request, verify timeline contains chronological immutable events and notification payload includes request ID, status, and latest comment.

### Tests for User Story 3

- [ ] T039 [P] [US3] Add contract tests for `GET /requests/{requestId}/history` in apps/event-approval-codeapp/tests/contract/requests.timeline.contract.test.ts
- [ ] T040 [P] [US3] Add contract tests for `GET /notifications` payload fields in apps/event-approval-codeapp/tests/contract/notifications.list.contract.test.ts
- [ ] T041 [P] [US3] Add integration test for status-change notification creation in apps/event-approval-codeapp/tests/integration/notifications.status-change.integration.test.ts
- [ ] T042 [P] [US3] Add integration test for chronological timeline rendering in apps/event-approval-codeapp/tests/integration/request-timeline.integration.test.ts
- [ ] T056 [P] [US3] Add integration tests for request timeline `loading|empty|error|stale` states in apps/event-approval-codeapp/tests/integration/request-timeline.view-states.integration.test.ts
- [ ] T057 [P] [US3] Add integration tests for notifications center `loading|empty|error|stale` states in apps/event-approval-codeapp/tests/integration/notifications-center.view-states.integration.test.ts

### Implementation for User Story 3

- [ ] T043 [P] [US3] Implement request timeline service (`getRequestHistory`) in apps/event-approval-codeapp/src/services/api-client/history.ts
- [ ] T044 [P] [US3] Implement notifications service (`listNotifications`) in apps/event-approval-codeapp/src/services/api-client/notifications.ts
- [ ] T045 [P] [US3] Implement request timeline component in apps/event-approval-codeapp/src/features/request-history/RequestTimeline.tsx
- [ ] T046 [P] [US3] Implement notifications center page with delivery status in apps/event-approval-codeapp/src/features/notifications/NotificationsPage.tsx
- [ ] T047 [US3] Generate notification records on decision transitions in apps/event-approval-codeapp/src/services/mocks/mockDataProvider.ts
- [ ] T048 [US3] Add notification and timeline navigation routes in apps/event-approval-codeapp/src/app/App.tsx

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, docs, and release-readiness validation.

- [ ] T049 [P] Add performance instrumentation for submit/dashboard/decision propagation in apps/event-approval-codeapp/src/app/perfMetrics.ts
- [ ] T050 [P] Add smoke e2e covering end-to-end employee→approver→notification flow in apps/event-approval-codeapp/tests/e2e/event-approval.smoke.spec.ts
- [ ] T051 [P] Add regression test template and bugfix policy notes in apps/event-approval-codeapp/tests/integration/README.md
- [ ] T052 Update quickstart commands and local/pro mode runbook in specs/001-event-approval-workflow/quickstart.md
- [ ] T053 Add requirements-to-tests traceability matrix (FR-001..FR-019, including FR-016 coverage by T054-T057) in specs/001-event-approval-workflow/checklists/requirements.md
- [ ] T060 [P] Add contract tests for audit retrieval filters and indefinite-retention assumptions in apps/event-approval-codeapp/tests/contract/audit-retrieval.contract.test.ts
- [ ] T061 Implement indefinite-retention behavior in mock provider lifecycle logic in apps/event-approval-codeapp/src/services/mocks/mockDataProvider.ts
- [ ] T062 [P] Add integration tests validating records remain retrievable over time in apps/event-approval-codeapp/tests/integration/retention-policy.integration.test.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2; can run in parallel with US1 after foundation.
- **Phase 5 (US3)**: Depends on Phase 2; can run in parallel with US1/US2, but benefits from US2 status transitions for richer validation.
- **Phase 6 (Polish)**: Depends on completion of selected user stories.

### User Story Dependencies

- **US1 (P1)**: Independent once foundation is ready.
- **US2 (P2)**: Independent once foundation is ready; consumes shared request model.
- **US3 (P3)**: Independent once foundation is ready; integrates most naturally after decision events exist.

### Within Each User Story

- Tests first (contract + integration).
- Service/client logic before feature pages using that logic.
- Route wiring after page/component implementation.
- Validate independent test criteria before moving on.

### Parallel Opportunities

- Setup tasks marked `[P]` (`T003`-`T007`) can run concurrently.
- Foundational tasks marked `[P]` (`T009`, `T010`, `T012`, `T014`, `T015`, `T016`) can run concurrently.
- In each user story, all test tasks marked `[P]` can run concurrently.
- In each user story, parallel implementation tasks marked `[P]` can run concurrently across different files.

---

## Parallel Example: User Story 1

```bash
# Parallel US1 tests
T018 apps/event-approval-codeapp/tests/contract/requests.submit.contract.test.ts
T019 apps/event-approval-codeapp/tests/contract/requests.history.contract.test.ts
T020 apps/event-approval-codeapp/tests/integration/submit-request.integration.test.ts
T021 apps/event-approval-codeapp/tests/integration/submit-request.validation.integration.test.ts

# Parallel US1 UI work
T026 apps/event-approval-codeapp/src/features/submit-request/SubmitRequestPage.tsx
T027 apps/event-approval-codeapp/src/features/request-history/RequestHistoryPage.tsx
```

## Parallel Example: User Story 2

```bash
# Parallel US2 service and UI tasks
T033 apps/event-approval-codeapp/src/services/api-client/approvals.ts
T035 apps/event-approval-codeapp/src/features/approver-dashboard/ApproverDashboardPage.tsx
T036 apps/event-approval-codeapp/src/features/approver-dashboard/RequestReviewPanel.tsx
```

## Parallel Example: User Story 3

```bash
# Parallel US3 API + presentation tasks
T043 apps/event-approval-codeapp/src/services/api-client/history.ts
T044 apps/event-approval-codeapp/src/services/api-client/notifications.ts
T045 apps/event-approval-codeapp/src/features/request-history/RequestTimeline.tsx
T046 apps/event-approval-codeapp/src/features/notifications/NotificationsPage.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational).
3. Complete Phase 3 (US1).
4. Validate US1 independent test criteria.
5. Demo/deploy MVP.

### Incremental Delivery

1. Deliver foundation (Phases 1-2).
2. Deliver US1 and validate.
3. Deliver US2 and validate.
4. Deliver US3 and validate.
5. Run Phase 6 polish and release checks.

### Parallel Team Strategy

1. Team aligns on Phases 1-2.
2. Then split by story:
   - Dev A: US1
   - Dev B: US2
   - Dev C: US3
3. Merge at defined checkpoints with contract/integration suite.

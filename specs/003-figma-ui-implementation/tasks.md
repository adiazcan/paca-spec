# Tasks: Figma UI Implementation for Event Attendance

**Input**: Design documents from `/specs/003-figma-ui-implementation/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED. Include the minimum effective test set (unit first, then integration as needed).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **App root**: `apps/event-approval-codeapp/`
- **Source**: `apps/event-approval-codeapp/src/`
- **Tests**: `apps/event-approval-codeapp/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, design tokens, font loading, and shared component scaffolding

- [X] T001 Create design tokens file with CSS custom properties extracted from Figma in `apps/event-approval-codeapp/src/styles/design-tokens.css`
- [X] T002 Update `apps/event-approval-codeapp/src/index.css` to import Arimo font from Google Fonts, import design-tokens.css, and set Arimo as primary font on body
- [X] T003 Add view model types (DashboardSummary, RequestCardData, RequestDetailData, AppNavState, AppScreen) to `apps/event-approval-codeapp/src/models/eventApproval.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared UI components used by multiple user stories — MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Shared Components (REQUIRED) ⚠️

- [X] T004 [P] Create unit test for Header component in `apps/event-approval-codeapp/tests/unit/components/Header.test.tsx`
- [X] T005 [P] Create unit test for StatusBadge component in `apps/event-approval-codeapp/tests/unit/components/StatusBadge.test.tsx`
- [X] T006 [P] Create unit test for SummaryCards component in `apps/event-approval-codeapp/tests/unit/components/SummaryCards.test.tsx`
- [X] T007 [P] Create unit test for RequestCard component in `apps/event-approval-codeapp/tests/unit/components/RequestCard.test.tsx`
- [X] T008 [P] Create unit test for CostBreakdown component in `apps/event-approval-codeapp/tests/unit/components/CostBreakdown.test.tsx`
- [X] T009 [P] Create unit test for BackLink component in `apps/event-approval-codeapp/tests/unit/components/BackLink.test.tsx`

### Implementation for Shared Components

- [X] T010 [P] Implement Header component with role-based nav, pending badge, and role switch button in `apps/event-approval-codeapp/src/components/Header.tsx` and `apps/event-approval-codeapp/src/components/Header.module.css`
- [X] T011 [P] Implement StatusBadge component with color-coded Pending/Approved/Rejected badges in `apps/event-approval-codeapp/src/components/StatusBadge.tsx` and `apps/event-approval-codeapp/src/components/StatusBadge.module.css`
- [X] T012 [P] Implement SummaryCards component with Total/Pending/Approved/Rejected count cards in `apps/event-approval-codeapp/src/components/SummaryCards.tsx` and `apps/event-approval-codeapp/src/components/SummaryCards.module.css`
- [X] T013 [P] Implement RequestCard component with event info, status badge, and View Details action in `apps/event-approval-codeapp/src/components/RequestCard.tsx` and `apps/event-approval-codeapp/src/components/RequestCard.module.css`
- [X] T014 [P] Implement CostBreakdown component with itemized costs and highlighted total in `apps/event-approval-codeapp/src/components/CostBreakdown.tsx` and `apps/event-approval-codeapp/src/components/CostBreakdown.module.css`
- [X] T015 [P] Implement BackLink component with configurable label in `apps/event-approval-codeapp/src/components/BackLink.tsx` and `apps/event-approval-codeapp/src/components/BackLink.module.css`
- [X] T016 Extend App.tsx routing to support new AppScreen type ('employee-dashboard' | 'new-request' | 'view-request' | 'approver-dashboard' | 'approve-request') with selectedRequestId state, replace inline layout with Header component in `apps/event-approval-codeapp/src/app/App.tsx`

**Checkpoint**: Foundation ready — shared components and routing in place, user story implementation can now begin

---

## Phase 3: User Story 1 — Employee Submits a New Event Request (Priority: P1) 🎯 MVP

**Goal**: Employee fills out the New Request form with event info, travel details, and estimated costs. Total cost auto-calculates. Form validates required fields and submits the request.

**Independent Test**: Navigate to New Request screen, fill all required fields, enter cost values, verify total auto-calculates, submit, and confirm redirect to dashboard.

### Tests for User Story 1 (REQUIRED) ⚠️

- [X] T017 [P] [US1] Create unit test for SubmitRequestPage (form rendering, validation, auto-calculation, submit/cancel) in `apps/event-approval-codeapp/tests/unit/features/SubmitRequestPage.test.tsx`

### Implementation for User Story 1

- [X] T018 [US1] Refactor SubmitRequestPage with Figma styling: three-section form layout (Event Information, Travel Details, Estimated Costs), real-time total auto-calculation, CSS Modules, and design tokens in `apps/event-approval-codeapp/src/features/submit-request/SubmitRequestPage.tsx` and `apps/event-approval-codeapp/src/features/submit-request/SubmitRequestPage.module.css`
- [X] T019 [US1] Wire New Request nav link to show SubmitRequestPage, handle onSubmit redirect to employee-dashboard and onCancel navigation in `apps/event-approval-codeapp/src/app/App.tsx`

**Checkpoint**: User Story 1 complete — employee can submit a new request with validated form and auto-calculated total

---

## Phase 4: User Story 2 — Employee Views Their Dashboard (Priority: P1) 🎯 MVP

**Goal**: Employee lands on "My Event Requests" dashboard showing summary cards (Total, Pending, Approved, Rejected) and a list of request cards with event details. Cards link to detail view.

**Independent Test**: Load the employee dashboard with mock data, verify summary counts match requests, verify each request card displays correct info, click View Details and verify navigation.

### Tests for User Story 2 (REQUIRED) ⚠️

- [X] T020 [P] [US2] Create unit test for EmployeeDashboardPage (summary counts, card rendering, view details navigation, empty/loading states) in `apps/event-approval-codeapp/tests/unit/features/EmployeeDashboardPage.test.tsx`

### Implementation for User Story 2

- [X] T021 [US2] Implement EmployeeDashboardPage with SummaryCards, RequestCard list, DashboardSummary computation from listMyRequests(), loading/empty/error states via useViewState in `apps/event-approval-codeapp/src/features/employee-dashboard/EmployeeDashboardPage.tsx` and `apps/event-approval-codeapp/src/features/employee-dashboard/EmployeeDashboardPage.module.css`
- [X] T022 [US2] Wire employee-dashboard route to show EmployeeDashboardPage, handle View Details navigation to view-request screen with selectedRequestId in `apps/event-approval-codeapp/src/app/App.tsx`

**Checkpoint**: User Story 2 complete — employee can see their dashboard with summary and request cards

---

## Phase 5: User Story 5 — Approver Approves or Rejects a Request (Priority: P1) 🎯 MVP

**Goal**: Approver opens a pending request detail view with event details, travel info, cost breakdown, and an Actions panel with comment textarea + Approve/Reject buttons. Comment optional for approval, required for rejection.

**Independent Test**: Navigate to a pending request as approver, verify all details display, approve without comment (succeeds), attempt reject without comment (blocked), reject with comment (succeeds), verify redirect to dashboard.

### Tests for User Story 5 (REQUIRED) ⚠️

- [X] T023 [P] [US5] Create unit test for ApproverReviewPage (detail rendering, approve without comment, reject requires comment, action processing, redirect) in `apps/event-approval-codeapp/tests/unit/features/ApproverReviewPage.test.tsx`
- [X] T024 [P] [US5] Create integration test for approval workflow (approve and reject flows with comment validation) in `apps/event-approval-codeapp/tests/integration/approver-review.figma.integration.test.ts`

### Implementation for User Story 5

- [X] T025 [P] [US5] Implement ActionsPanel sub-component with comment textarea (placeholder: "Add a comment (optional for approval, required for rejection)..."), Approve (green) and Reject (red) buttons, and rejection comment validation in `apps/event-approval-codeapp/src/features/approver-review/ActionsPanel.tsx` and `apps/event-approval-codeapp/src/features/approver-review/ActionsPanel.module.css`
- [X] T026 [US5] Implement ApproverReviewPage with BackLink, request detail layout (header, requester info, travel details with transport icon, comments section), CostBreakdown sidebar, and ActionsPanel; call getRequestDetail(id) and submitDecision(id, decision) in `apps/event-approval-codeapp/src/features/approver-review/ApproverReviewPage.tsx` and `apps/event-approval-codeapp/src/features/approver-review/ApproverReviewPage.module.css`
- [X] T027 [US5] Wire approve-request route to show ApproverReviewPage, handle approve/reject redirect to approver-dashboard in `apps/event-approval-codeapp/src/app/App.tsx`

**Checkpoint**: User Story 5 complete — approver can review, approve, or reject requests with comment validation

---

## Phase 6: User Story 3 — Employee Views Request Details (Priority: P2)

**Goal**: Employee navigates from dashboard to a detailed view of a specific request showing event header, requester info, travel details with transportation icon, comments section, and cost breakdown sidebar.

**Independent Test**: Click View Details on a request card, verify detail view shows all fields correctly (event name, date, status badge, requester, website link, role, transport mode with icon, origin, destination, itemized costs, total), click Back to return.

### Tests for User Story 3 (REQUIRED) ⚠️

- [X] T028 [P] [US3] Create unit test for RequestDetailPage (detail rendering, clickable website link, transport icon, cost breakdown, back navigation, empty comments state) in `apps/event-approval-codeapp/tests/unit/features/RequestDetailPage.test.tsx`

### Implementation for User Story 3

- [X] T029 [US3] Implement RequestDetailPage with BackLink, request header (name, date, StatusBadge), requester info (name, clickable event website link, role), travel details (transport mode with emoji icon, origin, destination), CommentsSection placeholder, and CostBreakdown sidebar in `apps/event-approval-codeapp/src/features/request-detail/RequestDetailPage.tsx` and `apps/event-approval-codeapp/src/features/request-detail/RequestDetailPage.module.css`
- [X] T030 [US3] Wire view-request route to show RequestDetailPage, handle Back navigation to employee-dashboard in `apps/event-approval-codeapp/src/app/App.tsx`

**Checkpoint**: User Story 3 complete — employee can view full request details from their dashboard

---

## Phase 7: User Story 4 — Approver Reviews All Event Requests (Priority: P2)

**Goal**: Approver views "All Event Requests" dashboard with summary cards and request cards showing additional approver context (requester name, latest comment on decided requests).

**Independent Test**: Load approver dashboard with mixed-status requests, verify summary counts, verify cards show "Requested by" and latest comment strip for decided requests, click View Details navigates to approve-request screen.

### Tests for User Story 4 (REQUIRED) ⚠️

- [X] T031 [P] [US4] Create unit test for ApproverDashboardPage (summary counts, card rendering with requester and comment, pending badge in nav, view details navigation, empty/loading states) in `apps/event-approval-codeapp/tests/unit/features/ApproverDashboardPage.test.tsx`

### Implementation for User Story 4

- [X] T032 [US4] Refactor ApproverDashboardPage with Figma styling: "All Event Requests" title/subtitle, SummaryCards, RequestCard list with submitterDisplayName and latestComment, DashboardSummary computation from listAllRequests(), loading/empty/error states via useViewState in `apps/event-approval-codeapp/src/features/approver-dashboard/ApproverDashboardPage.tsx` and `apps/event-approval-codeapp/src/features/approver-dashboard/ApproverDashboardPage.module.css`
- [X] T033 [US4] Wire approver-dashboard route to show ApproverDashboardPage, pass pendingCount to Header for badge display, handle View Details navigation to approve-request with selectedRequestId in `apps/event-approval-codeapp/src/app/App.tsx`

**Checkpoint**: User Story 4 complete — approver can see all team requests with requester context and comment preview

---

## Phase 8: User Story 6 — User Switches Between Employee and Approver Roles (Priority: P3)

**Goal**: Dual-role user can toggle between Employee and Approver views via a button in the Header. Navigation items, dashboard, and available actions change accordingly.

**Independent Test**: Click "Switch to Approver" and verify nav changes to Dashboard/Approvals, dashboard title changes, and Switch button text updates. Click "Switch to Employee" and verify reverse changes. Verify single-role users don't see the switch button.

### Tests for User Story 6 (REQUIRED) ⚠️

- [X] T034 [P] [US6] Create unit test for role switching (nav items change, dashboard resets, button visibility for single-role users) in `apps/event-approval-codeapp/tests/unit/features/RoleSwitching.test.tsx`

### Implementation for User Story 6

- [X] T035 [US6] Implement role switch logic: onSwitchRole resets screen to respective dashboard, update Header canSwitchRole based on user permissions, ensure nav items update (Dashboard + New Request for employee, Dashboard + Approvals with badge for approver) in `apps/event-approval-codeapp/src/app/App.tsx`

**Checkpoint**: User Story 6 complete — dual-role users can seamlessly switch between employee and approver views

---

## Phase 9: User Story 7 — User Adds Comments to a Request (Priority: P3)

**Goal**: Both employees and approvers can view decision comments on request detail views. Shows "No comments yet" when empty. Comments are created as part of the approve/reject decision flow (US5), not as standalone additions.

> **Scope note (C1 remediation)**: The existing API has no standalone `addComment()` endpoint. Comments are attached to requests only through the `submitDecision()` action. US7 is scoped to **display-only**: rendering existing decision comments. The "Add Comment" button from the original spec is deferred until a dedicated comments API is available.

**Independent Test**: Open a request detail with decision comments and verify they display correctly. Open a request with no comments and verify "No comments yet" message.

### Tests for User Story 7 (REQUIRED) ⚠️

- [X] T036 [P] [US7] Create unit test for CommentsSection component (empty state with "No comments yet" message, comment list rendering with author/content/timestamp) in `apps/event-approval-codeapp/tests/unit/components/CommentsSection.test.tsx`

### Implementation for User Story 7

- [X] T037 [US7] Implement CommentsSection component (display-only) with empty state message ("No comments yet") and comment list rendering (author, content, timestamp) in `apps/event-approval-codeapp/src/components/CommentsSection.tsx` and `apps/event-approval-codeapp/src/components/CommentsSection.module.css`
- [X] T038 [US7] Integrate CommentsSection into RequestDetailPage and ApproverReviewPage detail views, passing decision comments from the request data in `apps/event-approval-codeapp/src/features/request-detail/RequestDetailPage.tsx` and `apps/event-approval-codeapp/src/features/approver-review/ApproverReviewPage.tsx`

**Checkpoint**: User Story 7 complete — users can view decision comments on any request

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T039 [P] Validate all screens display appropriate loading, empty, and error states consistent with design system (SC-007)
- [X] T040 [P] Performance validation: verify initial content render < 2s (SC-008) and cost auto-calculation < 200ms (SC-003) using Chrome DevTools or perfMetrics.ts
- [X] T041 Run lint (`npm run lint`) and format (`npm run format`) checks — fix any errors to achieve zero lint errors and zero formatter diffs (SC-005)
- [X] T042 Run full test suite (`npm test`) — verify all unit and integration tests pass (SC-006)
- [X] T043 Validate navigation state machine: verify all screen transitions match the contract (dashboard↔detail, submit/cancel, approve/reject redirect, role switch) without full page reloads (SC-009)
- [X] T044 Run quickstart.md validation — follow setup steps and verify app starts and all screens render correctly
- [X] T045 [P] Manual validation of SC-001 (submit request < 3 minutes) and SC-004 (approve/reject < 30 seconds) — time the workflows end-to-end and record results
- [X] T046 [US1] Add URL format validation for Event Website field (edge case: invalid/malformed URL) in `apps/event-approval-codeapp/src/features/submit-request/SubmitRequestPage.tsx`
- [X] T047 [US5] Handle optimistic concurrency conflict in ApproverReviewPage — display user-friendly error when `submitDecision()` fails due to stale version (edge case: request already decided) in `apps/event-approval-codeapp/src/features/approver-review/ApproverReviewPage.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (design tokens, types) — BLOCKS all user stories
- **US1, US2, US5 (Phases 3–5)**: All depend on Phase 2 completion. These are P1 stories — implement in order or in parallel
- **US3, US4 (Phases 6–7)**: Depend on Phase 2. P2 stories — can start after Phase 2, independent of each other
- **US6, US7 (Phases 8–9)**: Depend on Phase 2. P3 stories — can start after Phase 2, independent of each other
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Submit Request)**: Depends on Phase 2 only — no dependencies on other stories
- **US2 (Employee Dashboard)**: Depends on Phase 2 only — independent of US1 (uses mock/existing data)
- **US5 (Approve/Reject)**: Depends on Phase 2 only — independent (uses getRequestDetail + submitDecision)
- **US3 (Request Detail)**: Depends on Phase 2 only — optionally benefits from US2 (View Details nav) but can be tested independently
- **US4 (Approver Dashboard)**: Depends on Phase 2 only — optionally benefits from US5 (View Details nav) but can be tested independently
- **US6 (Role Switching)**: Depends on Phase 2 (Header component) — benefits from US2 + US4 for full testing
- **US7 (Comments display)**: Depends on Phase 2 only — integrates into US3 and US5 detail views (display-only; no standalone API)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Sub-components before page composition
- Page implementation before App.tsx routing wiring
- Story complete before moving to next priority

### Parallel Opportunities

- All Phase 1 setup tasks (T001–T003) can be done sequentially (fast, no dependencies between them but T002 depends on T001)
- All Phase 2 shared component tests (T004–T009) can run in parallel
- All Phase 2 shared component implementations (T010–T015) can run in parallel
- Once Phase 2 is complete, P1 stories (US1, US2, US5) can each start in parallel
- P2 stories (US3, US4) can start in parallel with each other
- P3 stories (US6, US7) can start in parallel with each other

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all shared component tests together:
T004: "Unit test for Header in tests/unit/components/Header.test.tsx"
T005: "Unit test for StatusBadge in tests/unit/components/StatusBadge.test.tsx"
T006: "Unit test for SummaryCards in tests/unit/components/SummaryCards.test.tsx"
T007: "Unit test for RequestCard in tests/unit/components/RequestCard.test.tsx"
T008: "Unit test for CostBreakdown in tests/unit/components/CostBreakdown.test.tsx"
T009: "Unit test for BackLink in tests/unit/components/BackLink.test.tsx"

# Launch all shared component implementations together:
T010: "Header component in src/components/Header.tsx"
T011: "StatusBadge component in src/components/StatusBadge.tsx"
T012: "SummaryCards component in src/components/SummaryCards.tsx"
T013: "RequestCard component in src/components/RequestCard.tsx"
T014: "CostBreakdown component in src/components/CostBreakdown.tsx"
T015: "BackLink component in src/components/BackLink.tsx"
```

## Parallel Example: P1 User Stories

```bash
# After Phase 2, launch all P1 story tests together:
T017: "Unit test for SubmitRequestPage (US1)"
T020: "Unit test for EmployeeDashboardPage (US2)"
T023: "Unit test for ApproverReviewPage (US5)"
T024: "Integration test for approval workflow (US5)"

# Then launch P1 story implementations (different feature folders, no conflicts):
T018: "SubmitRequestPage in src/features/submit-request/ (US1)"
T021: "EmployeeDashboardPage in src/features/employee-dashboard/ (US2)"
T025: "ActionsPanel in src/features/approver-review/ (US5)"
```

---

## Implementation Strategy

### MVP First (P1 Stories: US1 + US2 + US5)

1. Complete Phase 1: Setup (design tokens, font, types)
2. Complete Phase 2: Foundational (shared components + routing)
3. Complete US1: Submit Request form
4. Complete US2: Employee Dashboard
5. Complete US5: Approve/Reject workflow
6. **STOP and VALIDATE**: All three P1 stories independently testable
7. Deploy/demo the core workflow: submit → view dashboard → approve/reject

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 + US5 → Core workflow complete (MVP!)
3. Add US3 → Employee can view request details
4. Add US4 → Approver gets enhanced dashboard
5. Add US6 → Dual-role users can switch views
6. Add US7 → Comments support added
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Submit) + US3 (View Detail)
   - Developer B: US2 (Employee Dashboard) + US4 (Approver Dashboard)
   - Developer C: US5 (Approve/Reject) + US6 (Role Switch) + US7 (Comments)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- CSS Modules (`.module.css`) co-located with their components — never use Tailwind
- All new TypeScript files must compile with strict mode (zero errors)
- Design tokens from `src/styles/design-tokens.css` — single source of truth for colors, spacing, radii
- Reuse existing domain model (`src/models/eventApproval.ts`) and data layer (`src/services/`) — do not create new API services
- State-based routing only — no router library (Power Apps CodeApp constraint)

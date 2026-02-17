# Implementation Plan: Figma UI Implementation for Event Attendance

**Branch**: `003-figma-ui-implementation` | **Date**: 2026-02-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-figma-ui-implementation/spec.md`

## Summary

Implement 5 Figma-designed screens (Employee Dashboard, New Request, View Request, Approver Dashboard, Approve Request) as a pixel-accurate React UI using CSS Modules and design tokens extracted from Figma. The implementation reuses the existing domain model and data layer from specs 001/002, introduces shared UI components (Header, StatusBadge, SummaryCards, RequestCard, CostBreakdown, BackLink), and extends the state-based routing to support 5 screens with role switching between employee and approver views.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode) + React 19.2
**Primary Dependencies**: Vite 7.2, @vitejs/plugin-react, @microsoft/power-apps 1.0.3, @microsoft/power-apps-vite 1.0.2, Zod 4
**Storage**: N/A (consumes existing Dataverse integration from spec 002)
**Testing**: Vitest 4, @testing-library/react, Playwright (e2e)
**Target Platform**: Power Apps CodeApp (embedded SPA in Power Platform)
**Project Type**: Single web application (frontend only, no backend in this feature)
**Performance Goals**: Initial content render < 2s (SC-008), cost auto-calculation < 200ms (SC-003)
**Constraints**: No Tailwind CSS, no router library, state-based routing only, must pass ESLint 9 + Prettier 3
**Scale/Scope**: 5 screens, 6 shared components, 5 feature pages; single developer

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Code Quality Gate — PASS

- **Lint**: ESLint 9 with flat config (`eslint.config.js`). Zero errors required (SC-005).
- **Format**: Prettier 3. Zero diffs required (SC-005).
- **Static Analysis**: TypeScript strict mode. All new files must compile with zero errors.
- **Merge Blockers**: All lint, format, and type-check must pass before merge.
- **Verification**: `npm run lint`, `npm run format`, `npx tsc --noEmit`.

### II. Testing Gate — PASS

- **Unit tests**: Every shared component (`Header`, `StatusBadge`, `SummaryCards`, `RequestCard`, `CostBreakdown`, `BackLink`) and every feature page must have unit tests with @testing-library/react.
- **Integration tests**: Approval workflow (approve/reject with comment validation) must have integration tests.
- **Contract tests**: Existing contract tests in `tests/contract/` cover API contracts — no new contracts needed.
- **Regression**: Any bug found during implementation must include a failing test before the fix.
- **Verification**: `npm test` (all suites pass, SC-006).

### III. UX Consistency Gate — PASS

- **Existing patterns to reuse**: `useViewState` hook for loading/empty/error/stale states; role-based navigation pattern in `App.tsx`.
- **Loading states**: Skeleton or spinner on data fetch (SC-007). Applied via `useViewState.loading`.
- **Empty states**: Descriptive message (e.g., "No requests yet") when lists are empty (SC-007, US-3 AS-6).
- **Error states**: User-friendly error messages matching the design system (SC-007).
- **Acceptance check**: Each screen must define acceptance scenarios for loading, empty, and error states in task tests.

### IV. Performance Gate — PASS

- **Budget**: Initial content render < 2 seconds on standard connection (SC-008).
- **Budget**: Cost auto-calculation < 200ms of user input (SC-003).
- **Budget**: Screen transitions without full page reloads (SC-009).
- **Validation**: Manual profiling with Chrome DevTools or existing `perfMetrics.ts`. Bundle size check via Vite build output.
- **Mitigation**: If render time exceeds budget, investigate code-splitting via `React.lazy`.

### V. Traceability Gate — PASS

| Plan Decision | Traced To |
|---------------|-----------|
| CSS Modules styling | SC-002 (Figma fidelity), R-001 |
| State-based routing | SC-009 (no page reloads), R-002 |
| Arimo font via Google Fonts | SC-002 (typography match), R-003 |
| Design tokens as CSS custom properties | SC-002 (color/spacing match), R-004 |
| Shared component library | FR-001/002/006/007/015 (reuse across screens), R-005 |
| Reuse existing data layer | FR-003/004/008/010 (submit, calculate, approve), R-006 |
| Performance validation approach | SC-003/008 (budgets), R-007 |

### Post-Design Re-check

All gates re-evaluated after Phase 1 design artifacts (data-model.md, contracts/):

- **Code Quality**: CSS Modules + design tokens add no new lint risk. TypeScript interfaces for all component props.
- **Testing**: Component contracts in `contracts/ui-components.md` define testable prop interfaces.
- **UX Consistency**: View models in `data-model.md` map cleanly to existing domain model — no inconsistent patterns introduced.
- **Performance**: No new data fetching patterns; computation is limited to summary count aggregation and cost sum.
- **Traceability**: Navigation state machine in contracts maps every transition to a user story.

## Project Structure

### Documentation (this feature)

```text
specs/003-figma-ui-implementation/
├── plan.md              # This file
├── research.md          # Phase 0: 7 research decisions (R-001 through R-007)
├── data-model.md        # Phase 1: 4 view models + mappings
├── quickstart.md        # Phase 1: setup and run instructions
├── contracts/
│   └── ui-components.md # Phase 1: component prop interfaces + navigation state machine
├── checklists/
│   └── requirements.md  # Requirements checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/event-approval-codeapp/
├── src/
│   ├── styles/
│   │   └── design-tokens.css          # CSS custom properties from Figma (R-004)
│   ├── components/                    # NEW: Shared UI components (R-005)
│   │   ├── Header.tsx
│   │   ├── Header.module.css
│   │   ├── StatusBadge.tsx
│   │   ├── StatusBadge.module.css
│   │   ├── SummaryCards.tsx
│   │   ├── SummaryCards.module.css
│   │   ├── RequestCard.tsx
│   │   ├── RequestCard.module.css
│   │   ├── CostBreakdown.tsx
│   │   ├── CostBreakdown.module.css
│   │   ├── BackLink.tsx
│   │   └── BackLink.module.css
│   ├── features/
│   │   ├── employee-dashboard/
│   │   │   ├── EmployeeDashboardPage.tsx
│   │   │   └── EmployeeDashboardPage.module.css
│   │   ├── submit-request/
│   │   │   ├── SubmitRequestPage.tsx     # REFACTORED with Figma styling
│   │   │   └── SubmitRequestPage.module.css
│   │   ├── request-detail/               # NEW: Employee view request
│   │   │   ├── RequestDetailPage.tsx
│   │   │   └── RequestDetailPage.module.css
│   │   ├── approver-dashboard/
│   │   │   ├── ApproverDashboardPage.tsx  # REFACTORED with Figma styling
│   │   │   └── ApproverDashboardPage.module.css
│   │   └── approver-review/              # NEW: Approver detail + actions
│   │       ├── ApproverReviewPage.tsx
│   │       └── ApproverReviewPage.module.css
│   ├── app/
│   │   └── App.tsx                       # MODIFIED: extended routing + Header
│   ├── models/
│   │   └── eventApproval.ts              # MODIFIED: view model types added (T003)
│   └── services/                         # UNCHANGED
├── tests/
│   ├── unit/                             # NEW unit tests for components + pages
│   └── integration/                      # NEW integration tests for approval flow
└── index.css                             # MODIFIED: Arimo font import + design tokens
```

**Structure Decision**: Single web application structure. Shared components under `src/components/`, feature pages under `src/features/` (existing convention). No new projects or packages. CSS Modules co-located with their components.

## Complexity Tracking

No constitution violations. All gates pass without justification needed.

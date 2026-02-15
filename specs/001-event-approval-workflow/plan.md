# Implementation Plan: Event Approval Workflow Code App

**Branch**: `001-event-approval-workflow` | **Date**: 2026-02-15 | **Spec**: `C:\github\paca-spec\specs\001-event-approval-workflow\spec.md`
**Input**: Feature specification from `/specs/001-event-approval-workflow/spec.md`

## Summary

Build a Power Apps code app (React + TypeScript, Vite template) that lets employees submit event approval requests and lets approvers review/decide requests. Development uses fully local mocked services and deterministic fixtures; pro environment uses Dataverse-backed connectors via Power Apps code app runtime APIs. Design preserves auditable immutable history, status notifications, and consistent loading/empty/error/stale behavior.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js LTS (v20+), React 18  
**Primary Dependencies**: `@microsoft/power-apps` runtime SDK (via `pac code init`), React, Vite, Vitest, Testing Library, Mock Service Worker (MSW), Zod for request validation  
**Storage**: Local dev: in-memory mock store + JSON fixtures; Pro: Dataverse tables (custom tables for requests, costs, decisions, history, notifications)  
**Testing**: Vitest (unit/component), Playwright (smoke e2e), contract validation against OpenAPI + schema checks  
**Target Platform**: Power Apps code apps runtime in browser (Edge/Chrome), local `npm run dev` for development  
**Project Type**: Web application (single frontend delivered as Power Apps code app)  
**Performance Goals**: Form submit p95 < 2s local/< 4s pro, dashboard load p95 < 3s local/< 5s pro, decision-to-history visibility < 10s, notification enqueue < 60s  
**Constraints**: Same browser profile for local play + tenant auth; local network access permission in Edge/Chrome (Dec 2025 restriction); immutable history records; role-based access via existing tenant identity  
**Scale/Scope**: Initial rollout: up to 2k employees, 200 approvers, 20k requests/year, 5 primary screens (submit, history, dashboard, review, notifications)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Code Quality Gate: Enforce `eslint`, `prettier --check`, strict TypeScript (`tsc --noEmit`), and PR merge blocked on any lint/type failure.
- Testing Gate: Required coverage includes request submit validation, approve/reject transitions, immutable history creation, notification payload correctness, and one regression test per fixed workflow defect.
- UX Consistency Gate: Reuse one shared view-state pattern (`loading`, `empty`, `error`, `stale`) across employee + approver pages; acceptance checks for all four states per story.
- Performance Gate: Track and report p95 timings for submit, dashboard load, status-change propagation; fail readiness if budgets exceed agreed thresholds.
- Traceability Gate: Every endpoint/model in design maps to FR-001..FR-017 and stories P1..P3 in spec artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/001-event-approval-workflow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── event-approval.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
apps/event-approval-codeapp/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── submit-request/
│   │   ├── approver-dashboard/
│   │   ├── request-history/
│   │   └── notifications/
│   ├── services/
│   │   ├── api-client/
│   │   ├── dataverse/
│   │   └── mocks/
│   ├── models/
│   └── validation/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   └── e2e/
├── package.json
└── vite.config.ts
```

**Structure Decision**: Use a frontend-focused web structure because Power Apps code apps run as a browser app with connector access from client code. Separate `services/mocks` and `services/dataverse` to switch cleanly by environment.

## Post-Design Constitution Re-Check

- Code Quality Gate: PASS (quality checks explicitly documented in quickstart + contract validation requirements).
- Testing Gate: PASS (unit/integration/contract/e2e matrix and mandatory regression tests defined).
- UX Consistency Gate: PASS (state handling and acceptance checks defined in quickstart and data model transitions).
- Performance Gate: PASS (measurable budgets and validation approach specified).
- Traceability Gate: PASS (contracts + entities map directly to FR-001..FR-017).

## Complexity Tracking

No constitution violations identified; no exceptions required.

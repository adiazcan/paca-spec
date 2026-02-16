# Research: Event Approval Workflow Code App

## Decision 1: App foundation uses Power Apps code app Vite template
- Decision: Start from `github:microsoft/PowerAppsCodeApps/templates/vite`, then run `pac code init`.
- Rationale: Microsoft’s official quickstart path for code apps; ensures runtime compatibility for local play and `pac code push` deployment.
- Alternatives considered:
  - Plain Vite React app without Power Apps init: rejected because it misses code app runtime bootstrapping.
  - Canvas app only: rejected because requirement is ReactJS code app.

## Decision 2: Dual data-provider strategy (mock in local, Dataverse in pro)
- Decision: Implement `IDataProvider` abstraction with two adapters: `MockDataProvider` for local development and `DataverseDataProvider` for pro environment.
- Rationale: Enables complete local development without tenant dependency while preserving same UI/domain logic in pro.
- Alternatives considered:
  - Feature flags sprinkled across components: rejected due to high coupling and harder testing.
  - Always calling Dataverse with dev tenant: rejected because requirement is fully mocked local development.

## Decision 3: Local development mocking via MSW + deterministic fixtures
- Decision: Use Mock Service Worker with seeded fixture datasets and deterministic IDs/timestamps for reproducible tests.
- Rationale: Mimics network behavior (latency/errors), supports integration tests, and exercises loading/empty/error/stale states.
- Alternatives considered:
  - Hardcoded in-component mock arrays: rejected due to poor realism and weak testability.
  - JSON-server side process: rejected due to extra local runtime complexity.

## Decision 4: Dataverse schema modeled around immutable history
- Decision: Use separate Dataverse tables/entities for request, cost estimate, approval decision, history entry, and notification log.
- Rationale: Directly satisfies auditability and immutable event history requirements (FR-010, FR-013).
- Alternatives considered:
  - Single denormalized request table with JSON columns: rejected because audit querying/reporting is weaker.
  - Mutable status-only records: rejected because immutable lifecycle trace is mandatory.

## Decision 5: Notifications are event-driven from status transitions
- Decision: Trigger notification creation whenever status transitions to approved/rejected; include request ID, new status, and latest comment.
- Rationale: Aligns with FR-011/FR-012 and keeps notification behavior deterministic.
- Alternatives considered:
  - Periodic polling-only notifications: rejected due to delayed/uncertain delivery behavior.
  - Manual notification action by approver: rejected because it risks missed notifications.

## Decision 6: Validation and state management standards
- Decision: Use schema-based validation (Zod) for required form fields and numeric cost constraints; enforce shared UI state model (`loading`, `empty`, `error`, `stale`).
- Rationale: Meets FR-005 and FR-016 consistently across employee and approver experiences.
- Alternatives considered:
  - Ad-hoc per-component validation: rejected due to inconsistency and regression risk.
  - No stale-state indicator: rejected because spec explicitly requires stale-data behavior.

## Decision 7: Test and quality gates are release blockers
- Decision: CI blocks on lint, type check, unit/integration/contract tests, and smoke e2e; bug fixes require regression tests.
- Rationale: Required by constitution principles I/II and FR-014/FR-015.
- Alternatives considered:
  - Manual testing only before release: rejected due to constitution noncompliance.
  - Unit tests only: rejected because contracts/workflow transitions require integration + contract coverage.

## Decision 8: Performance budget validation approach
- Decision: Instrument submit, dashboard load, and decision propagation timings; evaluate p95 budgets in automated smoke runs and pre-release checks.
- Rationale: Satisfies constitution performance principle and FR-017/SC-003/SC-004.
- Alternatives considered:
  - No explicit budgets: rejected by constitution.
  - Post-release monitoring only: rejected because release gate evidence is required before merge.

## Decision 9: Browser local-network constraints handled explicitly
- Decision: Document Edge/Chrome local network permission requirements for localhost-based local play and require same browser profile as tenant auth.
- Rationale: Matches Microsoft quickstart constraints and prevents local dev failures.
- Alternatives considered:
  - Ignore browser restriction in docs: rejected because this causes avoidable local setup failures.

## Unknowns Resolution Summary
All previously potential clarifications are resolved:
- Runtime stack selected (React + TypeScript + Power Apps SDK)
- Dev/pro data strategy selected (mock vs Dataverse)
- Testing/quality/performance gates defined
- Notification behavior and audit model defined

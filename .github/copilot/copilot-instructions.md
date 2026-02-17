# GitHub Copilot Instructions

## Priority Guidelines

When generating code for this repository:

1. **Version compatibility first**: Generate code compatible with the exact versions and constraints listed in this file.
2. **Use local context files first**: Prioritize any standards in `.github/copilot/*.md` over generic guidance.
3. **Follow established code patterns**: Match naming, organization, and error-handling used in nearby files.
4. **Respect architectural boundaries**: Keep code within the existing `src` layer responsibilities.
5. **Favor consistency over novelty**: Do not introduce patterns that are not already present in the codebase.

## Verified Technology Baseline

Based on current repository files:

- **TypeScript**: `~5.9.3` ([apps/event-approval-codeapp/package.json](../../apps/event-approval-codeapp/package.json))
- **React**: `^19.2.0` and `react-dom ^19.2.0` ([apps/event-approval-codeapp/package.json](../../apps/event-approval-codeapp/package.json))
- **Vite**: `^7.2.4` with `@vitejs/plugin-react ^5.1.1`
- **Runtime SDK**: `@microsoft/power-apps ^1.0.3`, `@microsoft/power-apps-vite ^1.0.2`
- **Validation**: `zod ^4.1.12`
- **Testing**:
  - Vitest `^4.0.18`
  - Testing Library (`@testing-library/react`, `jest-dom`, `user-event`)
  - Playwright `^1.58.2`
- **Lint/format**:
  - ESLint `^9.39.1`
  - Prettier `^3.8.1`
- **ECMAScript + compiler targets**:
  - `target: ES2022`, libs include `ES2022` and DOM
  - `jsx: react-jsx`
  - `moduleResolution: bundler`
  - strict mode enabled

### Version Constraints

- Do not use language/framework features that require versions newer than the baseline above.
- Node.js is described in specs as LTS `v20+`, but no explicit engine pin exists in `package.json`; avoid assuming newer Node-only APIs.

## Project Architecture and Boundaries

Primary application location: `apps/event-approval-codeapp`.

Current source layering pattern:

- `src/app`: app shell, shared app helpers (`useViewState`, perf metrics)
- `src/features/*`: page-level feature modules (`submit-request`, `approver-dashboard`, `request-history`, `notifications`)
- `src/services/api-client`: provider interfaces, environment resolution, provider factory
- `src/services/dataverse`: Dataverse-backed provider implementation and mappings
- `src/services/mocks`: local/mock provider implementation
- `src/models`: domain types and enums
- `src/validation`: Zod schemas
- `src/generated`: generated service/model code (treat as generated unless task explicitly targets regeneration)

### Required Architectural Rules

- Keep UI orchestration in feature/page modules.
- Keep persistence and external system details in `services/*`.
- Use `providerFactory` + `resolveDataMode` for data source selection; do not bypass this pattern.
- Preserve the `IDataProvider` contract shape when adding/changing provider behavior.
- Avoid direct runtime Dataverse Web API usage when existing generated/provider patterns already exist.

## Code Style and Implementation Patterns

Observed style to follow:

- ESM imports with alias paths (`@/...`) configured in TS/Vite.
- Function components with hooks (`useState`, `useMemo`), no class components observed.
- Explicit union/string literal types for app modes, routes, roles, and error codes.
- Prefer small focused helper functions and explicit return types on exported functions.
- Prefer `type` imports where appropriate (`import type { ... }`).
- Use existing `ApiError`/`createApiError` for typed domain API failures.
- Use `safeParse` with Zod and map validation failures to `VALIDATION_ERROR`.

### Error and View-State Patterns

Match the existing UX state model (`loading`, `empty`, `error`, `stale`) used across features.

- In UI pages, handle `ApiError` codes explicitly where needed (e.g., `CONFLICT`, `UNAUTHORIZED`).
- Use user-facing fallback messages consistent with existing wording.
- For stale/conflict conditions, surface a dedicated stale state (not a generic unknown error).

## Testing Standards in This Repo

Test structure in `apps/event-approval-codeapp/tests`:

- `unit/`: low-level logic and utilities
- `integration/`: provider and feature integration behavior
- `contract/`: API/domain contract behavior
- `e2e/`: smoke flow via Playwright

### Required Test Patterns

- Use Vitest globals: `describe`, `it`, `expect`, `beforeEach`, `vi`.
- Use Testing Library for UI behavior (`render`, `screen`, role/text assertions).
- Prefer behavior-focused test names (scenario phrasing).
- Clear mocks in `beforeEach` where mocks are shared.
- Keep contract tests centered on domain outputs and error objects.
- Keep Playwright smoke tests focused on critical user journeys and role toggles.

## Documentation and Commenting

Observed code style uses minimal inline comments in production code and richer comments in some integration tests.

- Do not add explanatory comments unless behavior is non-obvious.
- When comments are needed, keep them concise and aligned to existing tone.
- Prefer clear naming over verbose comments.

## Quality Gates and Commands

From `apps/event-approval-codeapp/package.json`:

- `npm run lint`
- `npm run format:check`
- `npm run typecheck`
- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:contract`
- `npm run test:e2e:smoke`

Code generated by Copilot should be expected to pass lint, typecheck, and relevant tests for modified scope.

## Versioning and Governance Signals

- Repository constitution uses **Semantic Versioning** for governance document changes (`.specify/memory/constitution.md`).
- Follow existing traceability emphasis in `specs/*` artifacts (requirements, tests, quality/performance gates).

## Practical Generation Instructions for Copilot

Before writing code:

1. Identify nearest similar files in the same feature/service/test area.
2. Reuse naming and structure from those files.
3. Confirm compatibility with TS/React/Vitest/ESLint versions above.
4. Keep changes minimal and scoped to the request.

While writing code:

1. Preserve import alias conventions and folder boundaries.
2. Preserve data-mode/provider abstractions.
3. Reuse existing error codes and view-state transitions.
4. Match existing test style for any added tests.

When uncertain:

- Prefer existing repository patterns over external best practices.
- If a pattern is unclear or conflicting, use the pattern from adjacent newer feature files and tests.
- Do not invent new architectural layers, state frameworks, or testing frameworks.

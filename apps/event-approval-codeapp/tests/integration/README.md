# Integration Regression Template

Use this template whenever a workflow bug is fixed.

## Test naming template

- File: `<feature-or-bug-scope>.integration.test.ts`
- Describe block: `<workflow scope> regression`
- Test case: `reproduces bug <ticket-id> and verifies fixed behavior`

## Test structure template

1. Arrange deterministic data (fixtures or provider state) that reproduces the original failure.
2. Act through the same workflow boundary where the defect occurred.
3. Assert both:
   - The original broken behavior no longer occurs.
   - Adjacent expected behavior still works.

## Bugfix policy notes

- Every production bugfix in submission, decisioning, timeline, retention, or notifications must add at least one regression integration test.
- Regression tests should fail on the pre-fix code path and pass only with the fix in place.
- If the bug impacts API shape, add or update matching contract tests in `tests/contract`.
- Keep regression assertions scoped to behavior; avoid broad snapshots.
- Do not remove an existing regression test unless replacing it with equivalent or stronger coverage.
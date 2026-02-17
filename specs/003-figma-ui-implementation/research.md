# Research: Figma UI Implementation for Event Attendance

## R-001: Styling Approach for Figma-Faithful UI

**Context**: The existing codebase uses plain inline styles and default Vite CSS. The Figma designs specify exact colors, spacing, border radii, and the Arimo font family. Must choose how to implement pixel-accurate styling without introducing Tailwind.

**Decision**: Use CSS Modules (`.module.css` files) co-located with components.

**Rationale**:
- The project has no Tailwind dependency and the Figma MCP tool explicitly warns not to install Tailwind.
- CSS Modules provide scoped styles, avoiding class name collisions, and are natively supported by Vite.
- Inline styles (current approach) do not support pseudo-classes, media queries, or hover states needed for the polished Figma UI.
- CSS Modules align with the project's existing plain CSS approach while adding scoping.

**Alternatives considered**:
- **Tailwind CSS**: Rejected — not in the project and adding it would be a significant dependency change outside the feature scope.
- **CSS-in-JS (styled-components, emotion)**: Rejected — adds runtime overhead and a new dependency for a feature-scoped change.
- **Plain CSS (global)**: Rejected — risk of class name collisions as the app grows; CSS Modules provide the same DX with scoping.

## R-002: Routing Strategy

**Context**: The current app uses a custom state-based routing system (`useState<AppRoute>`) in `App.tsx`. The Figma designs require 5+ screens with nested detail views and back navigation. Need to decide whether to continue with state-based routing or adopt a proper router.

**Decision**: Continue with state-based routing, extended to support the new screen hierarchy.

**Rationale**:
- The app is a Power Apps Code Component (CodeApp) running inside the Power Platform. Browser URL routing is managed by the host platform, not the embedded React app.
- Adding `react-router` would be unnecessary overhead since the component's URL is controlled externally.
- The current pattern of `role` + `route` state already supports role switching. Extending it to include view-detail routes with a selected request ID parameter is straightforward.
- Keeping the pattern consistent avoids a mid-feature refactor of how navigation works.

**Alternatives considered**:
- **React Router**: Rejected — incompatible with CodeApp embedding in Power Platform; adds unnecessary dependency.
- **TanStack Router**: Rejected — same embedding constraint as React Router.

## R-003: Font Loading (Arimo)

**Context**: The Figma designs use the Arimo font family (Google Fonts) in both Regular and Bold weights. The current app uses system-ui fonts. Must load Arimo without degrading first-render performance.

**Decision**: Import Arimo via Google Fonts `@import` in the root CSS file and apply it as the primary font on `body`.

**Rationale**:
- Arimo is a free Google Font with Regular (400) and Bold (700) weights needed by the designs.
- Loading via CSS `@import` in `index.css` keeps font loading declarative and framework-agnostic.
- The `font-display: swap` strategy on Google Fonts ensures the system font renders immediately, swapping to Arimo once loaded.

**Alternatives considered**:
- **Self-hosted font files**: Rejected — adds file management overhead; Google Fonts CDN provides caching and performance.
- **Skip Arimo, use system font**: Rejected — would violate SC-002 (visual fidelity to Figma designs).

## R-004: Design Token Extraction from Figma

**Context**: The Figma designs contain exact color values, border radii, spacing values, and font sizes that are used across all 5 screens. Need to identify and consolidate design tokens for consistency.

**Decision**: Define CSS custom properties (variables) in a `design-tokens.css` file, imported once into `index.css`.

**Design tokens extracted from Figma**:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-page` | `#f9fafb` | Main content background |
| `--color-bg-card` | `#ffffff` | Card/panel backgrounds |
| `--color-bg-input` | `#f3f3f5` | Input field backgrounds |
| `--color-bg-muted` | `#f9fafb` | Latest comment strips |
| `--color-bg-total` | `#eff6ff` | Total cost highlight box |
| `--color-border` | `rgba(0,0,0,0.1)` | Card borders, separators |
| `--color-border-total` | `#bedbff` | Total cost box border |
| `--color-text-primary` | `#0a0a0a` | Headings, primary text |
| `--color-text-secondary` | `#4a5565` | Secondary/meta text |
| `--color-text-muted` | `#717182` | Labels, placeholders |
| `--color-text-comment` | `#364153` | Comment text |
| `--color-text-empty` | `#6a7282` | Empty state text |
| `--color-link` | `#155dfc` | Links, total cost value |
| `--color-nav-active-bg` | `#030213` | Active nav link background |
| `--color-nav-active-text` | `#ffffff` | Active nav link text |
| `--color-status-pending` | `#f0b100` | Pending badge, count |
| `--color-status-pending-count` | `#d08700` | Pending count on dashboard |
| `--color-status-approved` | `#00c950` | Approved badge |
| `--color-status-approved-count` | `#00a63e` | Approved count on dashboard |
| `--color-status-rejected` | `#fb2c36` | Rejected badge, approvals count badge |
| `--color-status-rejected-count` | `#e7000b` | Rejected count on dashboard |
| `--color-btn-approve` | `#00a63e` | Approve button bg |
| `--color-btn-reject` | `#d4183d` | Reject button bg |
| `--radius-card` | `14px` | Card/panel border radius |
| `--radius-btn` | `8px` | Buttons, badges, inputs |
| `--font-family` | `'Arimo', sans-serif` | Primary font |

**Rationale**: CSS custom properties allow runtime theming, are native (no build step needed), and provide a single source of truth for design tokens across all CSS Modules.

## R-005: Component Architecture

**Context**: The Figma designs show 5 screens with shared patterns (header, summary cards, request cards, cost breakdown). Need to decide component decomposition.

**Decision**: Create a shared component library under `src/components/` and feature-specific components under each feature folder.

**Component hierarchy**:

```
src/components/
├── Header.tsx + Header.module.css          # App header with logo, nav, user, role switch
├── StatusBadge.tsx + StatusBadge.module.css # Reusable PENDING/APPROVED/REJECTED badge
├── SummaryCards.tsx + SummaryCards.module.css # 4-card summary grid (Total, Pending, Approved, Rejected)
├── RequestCard.tsx + RequestCard.module.css  # Request card (used on both dashboards)
├── CostBreakdown.tsx + CostBreakdown.module.css # Cost sidebar (used on both detail views)
└── BackLink.tsx + BackLink.module.css        # "Back" / "Back to Dashboard" link

src/features/
├── employee-dashboard/
│   └── EmployeeDashboardPage.tsx + .module.css
├── submit-request/
│   └── SubmitRequestPage.tsx (refactored) + .module.css
├── request-detail/
│   └── RequestDetailPage.tsx + .module.css   # Employee view request detail
├── approver-dashboard/
│   └── ApproverDashboardPage.tsx (refactored) + .module.css
└── approver-review/
    └── ApproverReviewPage.tsx + .module.css   # Approver detail + Actions panel
```

**Rationale**: Shared components reduce code duplication (the header, summary cards, status badges, cost breakdown, and request cards appear on multiple screens). Feature folders keep screen-specific logic contained.

## R-006: Integration with Existing Data Layer

**Context**: The app already has a data layer (`services/api-client/`, `services/dataverse/`, `services/mocks/`) with established patterns for API calls, view state management (`useViewState`), and models. The Figma screens need data that partially maps to existing models.

**Decision**: Reuse existing data models and API client functions. Add new API functions where needed (e.g., fetching all requests for approver dashboard, fetching request detail with costs).

**Rationale**:
- `EventApprovalRequest` already has all fields needed for the cards and detail views.
- `EventApprovalRequestSummary` needs to be extended with `destination`, `costEstimate.total`, and `submitterDisplayName` to match the Figma card layout.
- The existing `useViewState` hook provides loading/empty/error/stale states that map to the constitution's UX consistency requirements.
- No new entities are needed; the existing model is sufficient.

**Model changes needed**:
- Extend `EventApprovalRequestSummary` to include: `destination`, `totalCost`, `submitterDisplayName`, `submittedAt` (already present)
- Or use `EventApprovalRequest` directly for list views if performance permits

## R-007: Performance Budget Validation

**Context**: SC-003 requires total cost auto-calculation within 200ms. SC-008 requires initial content within 2 seconds. SC-009 requires no full page reloads.

**Decision**: Use React's built-in state for cost calculation (synchronous, well under 200ms). Validate render performance using the existing `perfMetrics.ts` utility and/or browser DevTools.

**Rationale**:
- Cost auto-calculation is a simple sum of 5 fields — no debouncing or async needed.
- State-based routing already avoids full page reloads.
- The app is a single-page application; initial load is dominated by bundle size, which Vite optimizes.
- Performance profiling can be done with Chrome DevTools Lighthouse or the existing `perfMetrics.ts`.

**Alternatives considered**:
- **Web Workers for calculation**: Rejected — massive over-engineering for a 5-field sum.
- **useDeferredValue**: Rejected — unnecessary for instant calculations.

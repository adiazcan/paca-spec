# Plan: Implement Approver Home Page from Figma Design

## TL;DR

Create the **Approver Home Page** matching Figma node `1:385`. This is a dashboard showing all event requests from the approver's team with summary stat cards and rich request cards. Requires redesigning the app shell header (shared with employee home plan), adding new data model fields, a new API method (`listAllRequests`), a new `ApproverHomePage.tsx` component, restructuring approver navigation ("Dashboard" + "Approvals" with badge), and a full CSS overhaul replacing Vite boilerplate.

**Figma URL**: https://www.figma.com/design/UyhNeV4lXNaLjhHeNV0aXr/Event-Attendance?node-id=1-385

---

## Design Analysis (from Figma)

### Header (shared app shell)
- Left: 24px calendar icon + **"Event Approval System"** (bold 20px, `#0a0a0a`)
- Right nav: **"Dashboard"** (active — dark bg `#030213`, white text, rounded-8) | **"Approvals"** (with red badge `#fb2c36` showing pending count) | vertical divider | bell icon (20px) | user avatar (20px) + **"Jane Approver"** (14px) | bordered **"Switch to Employee"** button

### Main Content
- Background `#f9fafb`, max-width 1280px, padding 32px 16px
- **Heading**: "All Event Requests" (bold 30px) + "Review and manage event attendance requests from your team" (16px, `#4a5565`)
- **4 stat cards**: 4-column grid, white bg, border `rgba(0,0,0,0.1)`, rounded-14, padding 24px
  - "Total Requests" → black `#0a0a0a`
  - "Pending" → amber `#d08700`
  - "Approved" → green `#00a63e`
  - "Rejected" → red `#e7000b`
  - Labels 16px `#717182`, values 30px

### Request Cards
- White bg, border `rgba(0,0,0,0.1)`, rounded-14, padding 25px
- **Row 1**: Event name (bold 20px) + status badge (uppercase 12px white text, rounded-8)
  - PENDING: `#f0b100`, APPROVED: `#00c950`, REJECTED: `#fb2c36`
- **Row 2**: Meta row — 4 icon+text groups (role, date, destination, cost), each with 16px icons, text 16px `#4a5565`, capitalize on role
- **Row 3**: "Requested by: {submitterName}" (14px `#4a5565`)
- **Row 4** (conditional): "Latest comment: {text}" on approved/rejected cards only — gray bg `#f9fafb`, rounded-8, padding 12px, text 14px `#364153`
- **Right side**: "View Details >" link (14px `#0a0a0a`) + chevron icon

---

## Steps

### Phase 1: CSS Foundation *(no dependencies, parallel with Phase 2)*

1. **Rewrite `src/index.css`** — Replace Vite defaults with design system
   - Add `@import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap')`
   - Define CSS custom properties (design tokens):

   | Token | Value | Usage |
   |---|---|---|
   | `--color-text-primary` | `#0a0a0a` | Headings, primary text |
   | `--color-text-secondary` | `#4a5565` | Subtitles, meta text, "Requested by" |
   | `--color-text-muted` | `#717182` | Stat card labels |
   | `--color-text-comment` | `#364153` | Latest comment text |
   | `--color-bg-page` | `#f9fafb` | Main content + comment bg |
   | `--color-bg-card` | `#ffffff` | Cards, header |
   | `--color-border` | `rgba(0,0,0,0.1)` | Card borders, dividers |
   | `--color-stat-pending` | `#d08700` | Pending stat value |
   | `--color-stat-approved` | `#00a63e` | Approved stat value |
   | `--color-stat-rejected` | `#e7000b` | Rejected stat value |
   | `--color-badge-pending` | `#f0b100` | Pending badge bg |
   | `--color-badge-approved` | `#00c950` | Approved badge bg |
   | `--color-badge-rejected` | `#fb2c36` | Rejected badge bg |
   | `--color-nav-active-bg` | `#030213` | Active nav link bg |
   | `--radius-card` | `14px` | Card border-radius |
   | `--radius-sm` | `8px` | Badge, button, nav link radius |
   | `--font-family` | `'Arimo', sans-serif` | Global font |

   - Base reset: `*, *::before, *::after { box-sizing: border-box; margin: 0; }`, body with font-family, min-height 100vh

2. **Rewrite `src/App.css`** — Replace Vite boilerplate with component classes

   **App Shell classes:**

   | Class | Key Styles |
   |---|---|
   | `.app-header` | white bg, border-bottom `var(--color-border)`, flex, padding `16px 42px`, height 69px |
   | `.app-header__logo` | flex, gap 8px, align-items center |
   | `.app-header__logo-text` | bold 20px, `var(--color-text-primary)` |
   | `.app-nav` | flex, gap 16px, align-items center |
   | `.nav-link` | 14px, rounded `var(--radius-sm)`, padding `8px 16px`, no border, bg transparent, cursor pointer |
   | `.nav-link--active` | bg `var(--color-nav-active-bg)`, white text |
   | `.nav-link__badge` | bg `#fb2c36`, white text, 12px, min-width 22px, height 22px, rounded `var(--radius-sm)`, inline-flex center, padding `3px 9px`, margin-left 8px |
   | `.nav-divider` | border-left `var(--color-border)`, height 32px, margin 0 |
   | `.user-section` | flex, gap 8px, align-items center, padding-left 17px |
   | `.role-switch-btn` | bg white, border `var(--color-border)`, rounded `var(--radius-sm)`, height 32px, padding `1px 13px`, 14px, cursor pointer |
   | `.main-content` | bg `var(--color-bg-page)`, min-height `calc(100vh - 69px)`, padding `32px 16px` |
   | `.main-content__inner` | max-width 1248px, margin 0 auto |

   **Page heading classes:**

   | Class | Key Styles |
   |---|---|
   | `.page-heading` | bold 30px `var(--color-text-primary)`, line-height 36px |
   | `.page-subtitle` | 16px `var(--color-text-secondary)`, line-height 24px, margin-top 8px |

   **Stat card classes:**

   | Class | Key Styles |
   |---|---|
   | `.stat-cards` | 4-column CSS grid, gap 16px, margin-top 32px |
   | `.stat-card` | bg white, border 1px `var(--color-border)`, rounded `var(--radius-card)`, padding 24px 24px 8px |
   | `.stat-card__label` | 16px `var(--color-text-muted)`, line-height 24px |
   | `.stat-card__value` | 30px `var(--color-text-primary)`, line-height 36px, margin-top auto |
   | `.stat-card__value--pending` | color `var(--color-stat-pending)` |
   | `.stat-card__value--approved` | color `var(--color-stat-approved)` |
   | `.stat-card__value--rejected` | color `var(--color-stat-rejected)` |

   **Request card classes:**

   | Class | Key Styles |
   |---|---|
   | `.request-cards` | flex column, gap 16px, margin-top 32px |
   | `.request-card` | bg white, border 1px `var(--color-border)`, rounded `var(--radius-card)`, padding 25px |
   | `.request-card__top` | flex, justify-between, align-items start |
   | `.request-card__content` | flex column, gap 16px, flex 1 |
   | `.request-card__header` | flex, gap 12px, align-items center |
   | `.request-card__title` | bold 20px `var(--color-text-primary)`, line-height 28px |
   | `.status-badge` | 12px uppercase, rounded `var(--radius-sm)`, padding `3px 9px`, white text, inline-flex center, line-height 16px |
   | `.status-badge--pending` | bg `var(--color-badge-pending)` |
   | `.status-badge--approved` | bg `var(--color-badge-approved)` |
   | `.status-badge--rejected` | bg `var(--color-badge-rejected)` |
   | `.request-card__meta` | flex, gap 0, height 24px (4 items each ~256px wide) |
   | `.meta-item` | flex, gap 8px, align-items center, width ~256px |
   | `.meta-item__icon` | 16px width/height, flex-shrink 0 |
   | `.meta-item__text` | 16px `var(--color-text-secondary)`, line-height 24px |
   | `.meta-item__text--capitalize` | text-transform capitalize |
   | `.request-card__requester` | 14px `var(--color-text-secondary)`, line-height 20px |
   | `.request-card__comment` | bg `var(--color-bg-page)`, rounded `var(--radius-sm)`, padding 12px |
   | `.request-card__comment-text` | 14px `var(--color-text-comment)`, line-height 20px |
   | `.view-details-link` | 14px `var(--color-text-primary)`, flex, gap 4px, align-items center, cursor pointer, text-decoration none, rounded `var(--radius-sm)`, height 32px, padding 0 11px |

### Phase 2: Data Model & API Extensions *(no dependencies, parallel with Phase 1)*

3. **Extend `EventApprovalRequestSummary`** in `src/models/eventApproval.ts`
   - Add optional fields:
     - `submitterDisplayName?: string` — needed for "Requested by:" line
     - `destination?: string` — needed for location meta item
     - `costTotal?: number` — needed for cost meta item
     - `latestComment?: string` — needed for "Latest comment:" section on decided cards
   - These are optional to avoid breaking existing consumers

4. **Add `listAllRequests()` to `IDataProvider`** interface in the api-client
   - New method: `listAllRequests(): Promise<EventApprovalRequestSummary[]>`
   - Returns all requests across all submitters and statuses (for the approver view)

5. **Implement `listAllRequests()` in `MockDataProvider`**
   - Return all fixture requests mapped via `toSummary()` (no submitter filter, no status filter)
   - Update `toSummary()` to populate: `submitterDisplayName`, `destination`, `costTotal`, `latestComment` (from matching decision if exists)

6. **Add a rejected request fixture** to `src/services/mocks/fixtures.ts`
   - Current fixtures only have submitted (EA-1001) and approved (EA-1002)
   - Add EA-1003 with `status: 'rejected'`, a different submitter, and a rejection decision comment
   - This allows all 3 stat card states to have non-zero values

7. **Implement `listAllRequests()` in `DataverseDataProvider`** (if it exists and has the pattern)
   - Apply the same approach — fetch all requests without submitter filter

### Phase 3: App Shell Redesign *(depends on Phase 1 CSS)*

8. **Redesign `src/app/App.tsx` header**
   - Replace current inline-styled header with structured `.app-header`:
     - Left: `.app-header__logo` — inline SVG calendar icon (24px) + "Event Approval System" (bold 20px)
     - Right: `.app-nav` containing:
       - Nav links using `.nav-link` / `.nav-link--active` classes
       - For approver: "Dashboard" + "Approvals" (with `.nav-link__badge` showing pending count)
       - For employee: "Dashboard" + "New Request" (per plan-home.md)
       - `.nav-divider` vertical separator
       - `.user-section`: bell SVG icon (20px) + user SVG avatar (20px) + display name (14px) + `.role-switch-btn`
   - Remove inline `style` objects — use CSS classes exclusively
   - Remove the `<p>Data mode: ...</p>` line from header

9. **Update approver nav configuration** in `navByRole`
   - Change from:
     ```
     approver: [
       { route: 'dashboard', label: 'Pending Approvals' },
       { route: 'notifications', label: 'Notifications' }
     ]
     ```
   - To:
     ```
     approver: [
       { route: 'dashboard', label: 'Dashboard' },
       { route: 'approvals', label: 'Approvals' }
     ]
     ```
   - The current `ApproverDashboardPage` (pending approvals + review panel) becomes the **"Approvals"** page at route `'approvals'`
   - A new **`ApproverHomePage`** becomes the **"Dashboard"** page at route `'dashboard'`

10. **Add notification badge to "Approvals" nav link**
    - The nav rendering in `App.tsx` needs to show a red count badge next to "Approvals"
    - The badge count = number of pending approvals (fetched via `listPendingApprovals()` or derived from data)
    - Can store `pendingCount` in app-level state, updated when the approver home loads

### Phase 4: Approver Home Page Component *(depends on Phases 1, 2, 3)*

11. **Create `src/features/approver-home/ApproverHomePage.tsx`**

    **Props**: `onViewDetails?: (requestId: string) => void`

    **Data fetching** (follow `ApproverDashboardPage` pattern using `useViewState`):
    - On mount: call `createDataProvider().listAllRequests()`
    - Store result in `useViewState<EventApprovalRequestSummary[]>([])`
    - Handle loading/error states

    **Computed stats** (from data array):
    - `totalRequests = data.length`
    - `pendingCount = data.filter(r => r.status === 'submitted').length`
    - `approvedCount = data.filter(r => r.status === 'approved').length`
    - `rejectedCount = data.filter(r => r.status === 'rejected').length`

    **Render structure**:
    ```
    div.main-content
      div.main-content__inner
        ── Page Heading ──
        h1.page-heading → "All Event Requests"
        p.page-subtitle → "Review and manage event attendance requests from your team"

        ── Stat Cards ──
        div.stat-cards (4-col grid)
          div.stat-card → "Total Requests" | {totalRequests} (black)
          div.stat-card → "Pending" | {pendingCount} (.stat-card__value--pending)
          div.stat-card → "Approved" | {approvedCount} (.stat-card__value--approved)
          div.stat-card → "Rejected" | {rejectedCount} (.stat-card__value--rejected)

        ── Request Cards ──
        div.request-cards
          [for each request]:
          div.request-card
            div.request-card__top
              div.request-card__content
                div.request-card__header
                  h3.request-card__title → eventName
                  span.status-badge.status-badge--{status} → STATUS
                div.request-card__meta
                  div.meta-item → role icon + role (capitalized)
                  div.meta-item → calendar icon + formattedDate
                  div.meta-item → pin icon + destination
                  div.meta-item → dollar icon + formattedCost
                p.request-card__requester → "Requested by: {submitterDisplayName}"
                [if status !== 'submitted' && latestComment]:
                  div.request-card__comment
                    p.request-card__comment-text → "Latest comment: {latestComment}"
              a.view-details-link → "View Details" + chevron icon
    ```

12. **Date formatting** — `Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' })` → "Feb 10, 2026"

13. **Cost formatting** — `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })` → "$1,800"

14. **Inline SVG icons** — 8 icons needed (16px unless noted):
    - Person/role icon (16x16) — user silhouette for role meta
    - Calendar icon (16x16) — for date meta
    - Map pin icon (16x16) — for destination meta
    - Dollar sign icon (16x16) — for cost meta
    - Chevron right icon (16x16) — for "View Details >"
    - Bell icon (20x20) — for header notification
    - App logo calendar icon (24x24) — for header
    - User avatar icon (20x20) — for header

### Phase 5: Route Wiring *(depends on Phases 3, 4)*

15. **Wire `ApproverHomePage` into `renderRoute()`** in `src/app/App.tsx`
    - Route `'dashboard'` (approver role) → `<ApproverHomePage onViewDetails={...} />`
    - Route `'approvals'` → `<ApproverDashboardPage />` (the existing pending approvals + review panel)
    - Add `'approvals'` to the `AppRoute` type union
    - Pass `onViewDetails` callback to navigate to the view-request page (if implemented) or no-op for now

16. **Update `routeHeadings`** — Remove `dashboard: 'Approver Dashboard'` entry since heading is now inside the page component

### Phase 6: Tests *(depends on Phase 4)*

17. **Create `tests/integration/approver-home.view-states.integration.test.ts`**
    - Test loading state
    - Test error state (API rejects → error message)
    - Test ready state: mock data renders stat cards + request cards correctly
    - Follow `approver-dashboard.view-states.integration.test.ts` pattern

18. **Create `tests/integration/approver-home.integration.test.ts`**
    - Test correct rendering of all request card fields (event name, badge, role, date, destination, cost, requester name)
    - Test stat card counts match data
    - Test "Latest comment" shown only on approved/rejected cards, not pending
    - Test date formatting (e.g., "Feb 10, 2026")
    - Test cost formatting (e.g., "$1,800")
    - Test status badge variant per status value
    - Test "View Details" click triggers `onViewDetails` callback

19. **Update existing tests if contracts change**
    - If `EventApprovalRequestSummary` type changes (optional fields), verify existing contract tests still pass
    - If `listPendingApprovals` behavior is unchanged, existing tests should be unaffected

---

## Relevant Files

| File | Action | Details |
|---|---|---|
| `src/index.css` | **Rewrite** | Design tokens, base reset, Arimo font import |
| `src/App.css` | **Rewrite** | All component CSS classes (header, nav, stat cards, request cards, badges) |
| `src/app/App.tsx` | **Redesign** | Header with logo/nav/user section, route config, nav links for approver, render `ApproverHomePage` |
| `src/models/eventApproval.ts` | **Extend** | Add `submitterDisplayName?`, `destination?`, `costTotal?`, `latestComment?` to `EventApprovalRequestSummary` |
| `src/services/api-client/` | **Modify** | Add `listAllRequests()` to `IDataProvider` interface |
| `src/services/mocks/mockDataProvider.ts` | **Modify** | Implement `listAllRequests()`, update `toSummary()` with new fields |
| `src/services/mocks/fixtures.ts` | **Modify** | Add rejected request fixture (EA-1003) |
| `src/services/dataverse/dataverseDataProvider.ts` | **Modify** | Implement `listAllRequests()` if applicable |
| `src/features/approver-home/ApproverHomePage.tsx` | **Create** | New approver dashboard page component |
| `src/features/approver-dashboard/ApproverDashboardPage.tsx` | **Unchanged** | Remains as "Approvals" page (pending approvals + review panel) |
| `tests/integration/approver-home.view-states.integration.test.ts` | **Create** | View state tests |
| `tests/integration/approver-home.integration.test.ts` | **Create** | Functional tests |

---

## Verification

### Visual Verification

1. Open app → switch to Approver role → compare side-by-side with Figma screenshot (node `1:385`)
2. **Header**: Logo + "Event Approval System" left-aligned, "Dashboard" (dark active), "Approvals" with red "1" badge, divider, bell icon, user avatar + "Jane Approver", "Switch to Employee" button
3. **Main heading**: "All Event Requests" bold 30px + subtitle 16px gray
4. **Stat cards**: 4-column grid, white bordered rounded cards, labels gray `#717182`, values 30px — Total (black), Pending (amber `#d08700`), Approved (green `#00a63e`), Rejected (red `#e7000b`)
5. **Request cards**: Event name bold 20px + status badge (PENDING amber, APPROVED green, REJECTED red), meta row with 4 icon+text groups, "Requested by:" line 14px gray, "Latest comment:" section (gray bg rounded) on approved/rejected cards only
6. **"View Details >"**: Right-aligned link with chevron icon
7. **Card spacing**: 16px gap between cards, 32px gap between sections
8. **Border-radius**: Cards use 14px, badges/buttons use 8px

### Functional Verification

1. Role switching works: Employee ↔ Approver
2. Approver "Dashboard" nav link is active (dark bg) on the home page
3. Approver "Approvals" nav link navigates to the pending approvals + review panel page
4. "Approvals" badge shows correct pending count
5. Stat card numbers match the actual request data
6. "View Details" triggers navigation callback
7. Loading state shows loading indicator
8. Error state shows error message

### Automated Tests

1. Run `npx vitest run` — all existing tests pass, no regressions
2. `approver-home.view-states.integration.test.ts` — loading/error/ready states pass
3. `approver-home.integration.test.ts` — card rendering, stat counts, formatting, comment visibility pass

---

## Decisions

| Decision | Rationale |
|---|---|
| **New `ApproverHomePage.tsx` in `features/approver-home/`** | Keeps the existing `ApproverDashboardPage` intact as the "Approvals" page. Follows the pattern of one feature per directory. |
| **Rename approver nav routes** | Figma shows "Dashboard" + "Approvals" instead of "Pending Approvals" + "Notifications". The existing `ApproverDashboardPage` is repurposed as the "Approvals" page. |
| **`listAllRequests()` new API method** | No existing endpoint returns all requests across submitters and statuses. `listMyRequests` filters by submitter, `listPendingApprovals` filters by status. The approver home needs all. |
| **Optional fields on `EventApprovalRequestSummary`** | Backward-compatible. Existing consumers (`ApproverDashboardPage`, `RequestHistoryPage`) don't use these fields and won't break. |
| **New rejected fixture (EA-1003)** | Needed so the approver home shows all 3 statuses. Current fixtures only have submitted + approved. |
| **CSS overhaul covers both employee & approver home** | The design tokens, header classes, stat card classes, and request card classes are shared between both pages. This plan implements them once for both. |
| **Icons as inline SVGs** | Avoids external dependencies and expiring Figma asset URLs (7-day TTL). The ~8 icons are simple enough for inline SVG. |
| **Badge colors from Figma exactly** | PENDING `#f0b100`, APPROVED `#00c950`, REJECTED `#fb2c36` — these differ slightly from the stat value colors. Using exact Figma values. |
| **`latestComment` from decision data** | The latest comment comes from the approval/rejection decision. `toSummary()` will look up the matching `ApprovalDecision` for each request and populate `latestComment`. |
| **"Notifications" nav link removed from approver** | The Figma design doesn't show a "Notifications" nav link for the approver. The bell icon in the header may serve that purpose. Keep the notifications route accessible but not in top nav. |

---

## Test Selector Impact

No existing test selectors should be impacted since this is a new page. The only modifications to existing code are:
- Adding optional fields to `EventApprovalRequestSummary` — backward-compatible, no selector changes
- Renaming approver nav labels — may affect `approver-dashboard.view-states.integration.test.ts` if it tests nav link text; verify and update if needed
- Adding `'approvals'` route — the existing `ApproverDashboardPage` renders identically, just at a different route name

---

## Further Considerations

1. **Employee Home Page (plan-home.md) overlap** — The CSS tokens, header redesign, and shared card classes in this plan are identical to what plan-home.md describes. If both plans execute in sequence, Phase 1 only needs to run once. Recommendation: implement this approver plan first since it's a superset (includes "Requested by:" and "Latest comment:" classes that the employee home would also reuse). The employee `DashboardPage` can then be built using the same CSS.

2. **"Approvals" badge count source** — The red badge on the "Approvals" nav link needs a pending count. Options: (A) fetch `listPendingApprovals().length` at the App shell level, (B) pass the count up from `ApproverHomePage` via callback, (C) compute from `listAllRequests` data. Recommendation: Option A — fetch at app shell level on mount when role is approver, so the badge shows before navigating to any page.

3. **"View Details" navigation target** — Currently no view-request page exists (plan-view-request.md is unimplemented). For now, wire `onViewDetails` to navigate to the existing request timeline view or leave as a no-op. Can be connected later when the view-request page is built.

4. **Responsive design** — The Figma shows a fixed 1332px desktop viewport. Recommendation: match desktop-first, add responsive breakpoints for mobile/tablet in a follow-up task.

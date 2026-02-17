# Plan: Apply Figma Home Page Design

## TL;DR

The Figma design for the "Event Attendance home" page introduces a polished, professional UI replacing the current unstyled Vite prototype. The changes affect the app shell (header/nav), a new dashboard home page with summary stats and request cards, and a complete styling overhaul using plain CSS (no new dependencies except the Arimo Google Font). The current functional logic (view states, API calls, routing) is preserved.

## Figma Reference

- **File**: [Event Attendance – Figma](https://www.figma.com/design/UyhNeV4lXNaLjhHeNV0aXr/Event-Attendance?node-id=1-2&t=7XMtyCqhzPsXrf01-0)
- **Node**: `1:2` — "Event Attendance home"

## Design Overview

The home page design features:

- **Header**: White background with bottom border. Left: app icon + "Event Approval System" title. Right: nav links (Dashboard, New Request), a divider, notification bell, user avatar + name, and a bordered "Switch to Approver" button.
- **Main Content**: Light gray background (`#f9fafb`), max-width `1280px`, with:
  - **Page heading**: "My Event Requests" (bold 30px) with subtitle "Track your event attendance requests and their status" (16px secondary text)
  - **Summary stat cards**: 4-column grid of bordered white cards showing Total Requests, Pending (amber), Approved (green), Rejected (red) — each with a label and large number
  - **Request cards**: White bordered cards showing event name + status badge, with meta row (role icon, date icon, location icon, cost icon) and a "View Details ›" link

---

## Steps

### Phase 1: Design Foundation (CSS & Tokens)

1. **Replace `src/index.css` with the Figma design system**
   - Remove Vite template defaults (dark-mode-first, system-ui font, logo/button boilerplate)
   - Add `@import url('https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=swap')`
   - Define CSS custom properties for all design tokens:

   | Token | Value | Usage |
   |---|---|---|
   | `--color-text-primary` | `#0a0a0a` | Headings, primary text |
   | `--color-text-secondary` | `#4a5565` | Subtitles, meta text |
   | `--color-text-muted` | `#717182` | Stat card labels |
   | `--color-bg-page` | `#f9fafb` | Main content background |
   | `--color-bg-card` | `#ffffff` | Cards, header |
   | `--color-border` | `rgba(0,0,0,0.1)` | Card borders, dividers |
   | `--color-status-pending` | `#d08700` | Pending stat number |
   | `--color-status-approved` | `#00a63e` | Approved stat number |
   | `--color-status-rejected` | `#e7000b` | Rejected stat number |
   | `--color-badge-pending` | `#f0b100` | Pending badge background |
   | `--color-nav-active-bg` | `#030213` | Active nav link background |
   | `--radius-card` | `14px` | Card border-radius |
   | `--radius-button` | `8px` | Button/badge border-radius |
   | `--font-family` | `'Arimo', sans-serif` | Global font |

   - Add base reset styles (margin, box-sizing) and light theme body defaults

2. **Replace `src/App.css` with app-level component classes**
   - Remove Vite boilerplate (`#root` centering, `.logo` animation, `.card`, `.read-the-docs`)
   - Add the following class groups:

   | Class | Purpose | Key Styles |
   |---|---|---|
   | `.app-header` | Header bar | white bg, border-bottom, flex, padding `16px 42px` |
   | `.app-header__logo` | Logo section | flex, gap 8px, icon + bold 20px title |
   | `.app-nav` | Navigation container | flex, gap 16px, align-items center |
   | `.nav-link` | Nav item | 14px, rounded-8, padding `8px 16px`, no border |
   | `.nav-link--active` | Active nav state | bg `#030213`, white text |
   | `.nav-divider` | Vertical separator | border-left `rgba(0,0,0,0.1)`, height 32px |
   | `.user-section` | User info area | flex, gap 8px, align-items center |
   | `.role-switch-btn` | Role switch button | bordered, rounded-8, 14px, white bg |
   | `.main-content` | Page content wrapper | bg `#f9fafb`, max-width 1280px, padding `32px 16px` |
   | `.page-heading` | H1 title | bold 30px, color primary |
   | `.page-subtitle` | Subtitle text | 16px, color secondary, margin-top 8px |
   | `.stat-cards` | Stats grid | 4-column CSS grid, gap 16px |
   | `.stat-card` | Individual stat | white bg, border, rounded-14, padding `24px` |
   | `.stat-card__label` | Stat label | 16px, color muted |
   | `.stat-card__value` | Stat number | 30px, color primary (default) |
   | `.stat-card__value--pending` | Pending count | color `#d08700` |
   | `.stat-card__value--approved` | Approved count | color `#00a63e` |
   | `.stat-card__value--rejected` | Rejected count | color `#e7000b` |
   | `.request-card` | Request row | white bg, border, rounded-14, padding 25px, flex space-between |
   | `.request-card__header` | Title + badge row | flex, gap 12px, align-items center |
   | `.request-card__title` | Event name | bold 20px |
   | `.status-badge` | Status pill | 12px uppercase, rounded-8, padding `3px 9px`, white text |
   | `.status-badge--pending` | Pending badge | bg `#f0b100` |
   | `.status-badge--approved` | Approved badge | bg `#00a63e` |
   | `.status-badge--rejected` | Rejected badge | bg `#e7000b` |
   | `.request-card__meta` | Meta info row | flex, gap ~270px (spaced), 16px secondary text |
   | `.meta-item` | Icon + text pair | flex, gap 8px, align-items center |
   | `.view-details-link` | Details link | 14px, flex, gap 4px, align-items center |

### Phase 2: Extend Data Model for Dashboard

3. **Extend `EventApprovalRequestSummary`** in `src/models/eventApproval.ts`
   - Add optional fields to support dashboard display without fetching full request objects:
     ```
     destination?: string
     costTotal?: number
     submittedAtFormatted?: string  // (computed in component, not stored)
     ```
   - These are optional to avoid breaking the existing contract for pages that don't need them

4. **Update `toSummary()` in `MockDataProvider`** (`src/services/mocks/mockDataProvider.ts`)
   - In the private `toSummary()` method, map:
     - `request.destination` → `summary.destination`
     - `request.costEstimate.total` → `summary.costTotal`

5. **Update `toSummary()` in `DataverseDataProvider`** (`src/services/dataverse/dataverseDataProvider.ts`)
   - Apply the same mapping if the Dataverse provider has similar `toSummary` logic
   - Verify this file exists and has the same pattern before modifying

### Phase 3: New Dashboard Home Page

6. **Create `src/features/dashboard/DashboardPage.tsx`**
   - New component that:
     - Uses `useViewState<EventApprovalRequestSummary[]>` and calls `listMyRequests()` on mount
     - Computes summary stats from data:
       - `totalRequests = data.length`
       - `pendingCount = data.filter(r => r.status === 'submitted').length`
       - `approvedCount = data.filter(r => r.status === 'approved').length`
       - `rejectedCount = data.filter(r => r.status === 'rejected').length`
     - Renders heading section ("My Event Requests" + subtitle)
     - Renders 4 stat cards in `.stat-cards` grid with color-coded values
     - Renders request list as `.request-card` elements, each showing:
       - Event name (`.request-card__title`) + status badge (`.status-badge--{status}`)
       - Meta row with icon+text groups: role, submitted date (formatted), destination, cost total (formatted as `$X,XXX`)
       - "View Details ›" link that triggers navigation callback
     - Uses `useViewState` pattern for loading/empty/error states consistent with existing pages
   - Accepts an `onViewDetails?: (requestId: string) => void` prop for navigation

7. **Create inline SVG icon elements**
   - Instead of external icon library or expiring Figma asset URLs, use simple inline `<svg>` elements
   - Icons needed (all 16×16):
     - **Person/role**: simplified user silhouette
     - **Calendar**: date icon for submitted date
     - **Map pin**: location icon for destination
     - **Dollar sign**: cost icon
     - **Bell**: notification icon (20×20 in header)
     - **Chevron right**: "›" arrow for View Details
     - **App logo**: calendar/clipboard icon (24×24 in header)
     - **User avatar**: circle user icon (20×20 in header)
   - These can be defined as small functional components or inline JSX in the components that use them

### Phase 4: Redesign App Shell

8. **Redesign `src/app/App.tsx`**
   - **Header**: Replace current `<header>` with structured `.app-header`:
     - Left: `.app-header__logo` with SVG icon + "Event Approval System" (bold 20px)
     - Right: `.app-nav` containing:
       - Nav links: "Dashboard" (active when on `'home'`), "New Request" (active when on `'submit'`)
       - `.nav-divider` vertical separator
       - Bell icon (20px)
       - User avatar icon + "Sarah Johnson" text (14px)
       - `.role-switch-btn` — "Switch to Approver" / "Switch to Employee"
   - **Main content**: Wrap `<main>` in `.main-content` div with light gray background
   - Remove the `<p>Data mode: ...</p>` from the header
   - Remove inline `style` objects — use CSS classes exclusively

9. **Update route configuration**
   - Add `'home'` to `AppRoute` type union
   - Update `navByRole`:
     ```
     employee: [
       { route: 'home', label: 'Dashboard' },
       { route: 'submit', label: 'New Request' },
     ]
     approver: [
       { route: 'dashboard', label: 'Pending Approvals' },
       { route: 'notifications', label: 'Notifications' },
     ]
     ```
   - Update `renderRoute()` to render `<DashboardPage />` for `'home'`
   - Default employee route: `'home'` (was `'submit'`)
   - The existing `'history'`, `'timeline'`, `'notifications'` routes remain functional but are accessed via dashboard interactions rather than top-level nav

---

## Verification

### Visual Verification
1. Open the app in browser and compare side-by-side with Figma screenshot
2. Verify header: logo positioning, nav link styling, active state (dark bg), divider, user section, role switch button
3. Verify main content: gray background, heading typography, stat card grid layout
4. Verify stat cards: border-radius, label/value typography, color-coded values (black, amber, green, red)
5. Verify request card: title + badge layout, meta icons and text, "View Details" alignment
6. Verify status badge: amber background, white text, uppercase, rounded

### Functional Verification
1. Role switching still works (employee ↔ approver)
2. Nav routing works for all routes (home, submit, dashboard, notifications)
3. Submit request form still functions correctly
4. Approver dashboard loads and functions
5. View states (loading, empty, error, stale) render correctly on new dashboard
6. "View Details" on request cards triggers navigation

### Automated Tests
1. Run `npx vitest run` — all existing unit, integration, and contract tests pass
2. No regressions in `RequestHistoryPage`, `SubmitRequestPage`, `ApproverDashboardPage`, or `NotificationsPage`
3. The `EventApprovalRequestSummary` type extension is backward-compatible (optional fields)

---

## Relevant Files

| File | Action | Details |
|---|---|---|
| `src/index.css` | **Rewrite** | Design tokens, base reset, light theme |
| `src/App.css` | **Rewrite** | All component CSS classes |
| `src/app/App.tsx` | **Redesign** | Header, nav, routing, layout structure |
| `src/models/eventApproval.ts` | **Extend** | Add `destination?`, `costTotal?` to `EventApprovalRequestSummary` |
| `src/services/mocks/mockDataProvider.ts` | **Modify** | Update `toSummary()` to populate new fields |
| `src/services/dataverse/dataverseDataProvider.ts` | **Modify** | Update `toSummary()` if applicable |
| `src/features/dashboard/DashboardPage.tsx` | **Create** | New dashboard home page component |
| `src/features/request-history/RequestHistoryPage.tsx` | **Unchanged** | Preserved, accessible from "View Details" |
| `src/features/submit-request/SubmitRequestPage.tsx` | **Unchanged** | Preserved, accessible from "New Request" nav |
| `src/features/approver-dashboard/ApproverDashboardPage.tsx` | **Unchanged** | Preserved, shown in approver role |

---

## Decisions

| Decision | Rationale |
|---|---|
| **No new dependencies** | Plain CSS with custom properties matches the existing approach. No Tailwind, styled-components, or component libraries. |
| **Arimo font via CSS `@import`** | Google Fonts import in `index.css` — matches the Figma design's font family. |
| **Icons as inline SVGs** | Avoids expiring Figma asset URLs (7-day TTL) and external icon library dependencies. The ~8 icons needed are simple enough for inline SVG. |
| **Optional fields on `EventApprovalRequestSummary`** | Keeps the type lightweight and backward-compatible. Avoids switching to the full `EventApprovalRequest` for dashboard display. |
| **Existing pages preserved** | Only the app shell and CSS are updated. `SubmitRequestPage`, `ApproverDashboardPage`, `NotificationsPage`, etc. keep their current functional markup. Styling improvements to those pages are out of scope. |
| **Route `'home'` as default employee view** | The Figma design shows dashboard as the landing page. Existing routes remain accessible. |
| **"Data mode" indicator removed from header** | Not present in Figma design. Can be restored in a footer or dev-tools panel if needed. |

---

## Further Considerations

1. **Responsive design** — The Figma shows a fixed 1332px desktop viewport. Recommendation: **match desktop-first**, add responsive breakpoints for mobile/tablet in a follow-up task.

2. **"View Details" navigation target** — The link on request cards should navigate to the request timeline. This requires a small routing enhancement to pass `requestId` alongside the route change. Currently the route system doesn't support route parameters — may need a `selectedRequestId` state in the App shell.

3. **Dataverse provider compatibility** — The `toSummary()` method in the Dataverse provider needs to be verified and updated for the new optional fields. If the Dataverse provider retrieves data differently, the mapping may need adjustment.
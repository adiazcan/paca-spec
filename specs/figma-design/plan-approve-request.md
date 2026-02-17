# Plan: Implement Approve Request Page from Figma Design

## TL;DR

Create a new **Approve Request Page** (`ApproveRequestPage.tsx`) matching Figma node `1:586`. This is the approver's full-detail view of a pending request with approval/rejection actions. It shares the same 2-column card layout as the planned `ViewRequestPage` (node `1:233`) — request details + travel + comments on the left, cost breakdown + **actions panel** on the right. The key differentiator is the Actions card with a comment textarea and Approve/Reject buttons. Reuses existing decision logic from `RequestReviewPanel.tsx` (concurrency handling via `version`, `CONFLICT` detection). Requires a new route (`'approve-request'`), a new feature directory, CSS classes (many shared with the view-request plan), and wiring from the approver dashboard.

**Figma URL**: https://www.figma.com/design/UyhNeV4lXNaLjhHeNV0aXr/Event-Attendance?node-id=1-586

---

## Design Analysis (from Figma screenshot)

### Layout
- **Background**: `#f9fafb` page background
- **Back link**: "← Back" at top-left (14px, `#0a0a0a`, rounded-8)
- **Two-column layout**: left ~824px, right 400px, gap 24px

### Left Column (3 cards, vertical gap 24px)

**Card 1 — Request Details** (white bg, 1px border `rgba(0,0,0,0.1)`, rounded-14)
- Header: Event name "Tech Conference 2026" (24px, normal weight, `#0a0a0a`) + **PENDING** badge (bg `#f0b100`, white text, uppercase, 12px, rounded-8)
- Subtitle: "Submitted on February 10, 2026" (16px, `#717182`)
- Info rows (gap 16px between, icon 20x20 + text 16px):
  - Person icon + "Sarah Johnson" (`#364153`)
  - Globe icon + "https://techconf2026.com" (blue link `#155dfc`)
  - Calendar icon + "Role: Speaker" (`#364153`, capitalize)

**Card 2 — Travel Details** (same card style)
- Section title: "Travel Details" (16px, `#0a0a0a`)
- Transport mode: ✈️ emoji (24px) + "Flight" (16px, capitalize, `#0a0a0a`) + "Transportation mode" (14px, `#4a5565`)
- Divider: 1px `rgba(0,0,0,0.1)`
- 2-column grid: Origin ("New York, NY") + Destination ("San Francisco, CA"), each with pin icon 16x16, labels 14px `#4a5565`, values 16px `#0a0a0a`

**Card 3 — Comments** (same card style)
- Header row: "Comments" (16px, `#0a0a0a`) + "Add Comment" button (outlined, 32px height, rounded-8, icon + text)
- Body: "No comments yet" (centered, 16px, `#6a7282`)

### Right Column (2 cards, vertical gap 24px)

**Card 4 — Cost Breakdown** (same card style)
- Section title: "Cost Breakdown" (16px, `#0a0a0a`)
- 5 cost rows: label (`#4a5565`) — value (`#0a0a0a`)
  - Registration — $500
  - Travel — $450
  - Hotel — $600
  - Meals — $200
  - Other — $50
- Divider
- Total row: **"Total"** (bold 18px, `#0a0a0a`) — **"$1,800"** (bold 20px, `#155dfc`)

**Card 5 — Actions** (same card style) ← UNIQUE TO THIS PAGE
- Section title: "Actions" (16px, `#0a0a0a`)
- Comment textarea: bg `#f3f3f5`, border `rgba(0,0,0,0)`, rounded-8, padding 8px 12px, 64px height, placeholder 14px `#717182`: "Add a comment (optional for approval, required for rejection)..."
- Approve button: bg `#00a63e`, white text, rounded-8, 36px height, full width, checkmark icon + "Approve Request" (14px)
- Reject button: bg `#d4183d`, white text, rounded-8, 36px height, full width, X icon + "Reject Request" (14px)

### Header (shared app shell — same as other pages)
- Left: calendar icon + "Event Approval System" (bold 20px)
- Right: "Dashboard" | "Approvals" (with red badge "1") | divider | bell icon | user avatar + "Jane Approver" | "Switch to Employee" button

---

## Steps

### Phase 1: Routing & App Shell *(no dependencies)*

1. **Add `'approve-request'` to `AppRoute` type** in `src/app/App.tsx`
   - Extend union: `| 'approve-request'`
   - Add `selectedApprovalRequestId` state (or reuse existing `selectedRequestId` if view-request plan is already implemented)
   - Create helper `navigateToApproveRequest(requestId: string)` that sets route to `'approve-request'` and stores requestId

2. **Add `'approve-request'` case to `renderRoute()`**
   - Render `<ApproveRequestPage requestId={selectedApprovalRequestId!} onNavigateBack={() => { setSelectedApprovalRequestId(null); setRoute('dashboard'); }} onDecisionSaved={() => { setSelectedApprovalRequestId(null); setRoute('dashboard'); }} />`
   - Import from `../features/approve-request/ApproveRequestPage`

3. **Update `routeHeadings`** — Add `'approve-request': 'Approve Request'`

### Phase 2: CSS — Approve Request Classes *(parallel with Phase 1)*

4. **Add design tokens to `src/index.css`** (if not already added from home/view-request plans)
   - Same tokens as `plan-view-request.md` Phase 2 step 5, plus:

   | Token | Value | Usage |
   |---|---|---|
   | `--color-btn-approve` | `#00a63e` | Approve button bg |
   | `--color-btn-reject` | `#d4183d` | Reject button bg |
   | `--color-input-bg` | `#f3f3f5` | Textarea/input background |
   | `--color-text-placeholder` | `#717182` | Input placeholder text |

5. **Add approve-request CSS classes to `src/App.css`**
   - Reuse ALL classes from `plan-view-request.md` Phase 2 step 6 (`.view-request`, `.view-request__back-link`, `.view-request__layout`, `.view-request__main`, `.view-request__sidebar`, `.detail-card`, `.detail-card__header`, `.detail-card__body`, `.detail-card__title-row`, `.detail-card__title`, `.detail-card__subtitle`, `.detail-card__section-title`, `.status-badge*`, `.info-row*`, `.travel-mode*`, `.travel-grid`, `.travel-field*`, `.divider`, `.cost-row*`, `.cost-total*`, `.comments-header`, `.comments-empty`, `.btn-outline-sm`)
   - Add NEW classes for the Actions card:

   | Class | Purpose | Key Styles |
   |---|---|---|
   | `.action-textarea` | Comment textarea | bg `var(--color-input-bg)`, border 1px transparent, rounded-8, padding 8px 12px, min-height 64px, width 100%, font-size 14px, font-family inherit, resize vertical, line-height 20px |
   | `.action-textarea::placeholder` | Placeholder text | color `var(--color-text-placeholder)` |
   | `.btn-approve` | Approve button | bg `var(--color-btn-approve)`, color white, border none, rounded-8, height 36px, width 100%, font-size 14px, cursor pointer, display flex, align-items center, justify-content center, gap 8px, font-family inherit |
   | `.btn-approve:disabled` | Disabled state | opacity 0.6, cursor not-allowed |
   | `.btn-reject` | Reject button | bg `var(--color-btn-reject)`, color white, border none, rounded-8, height 36px, width 100%, font-size 14px, cursor pointer, display flex, align-items center, justify-content center, gap 8px, font-family inherit |
   | `.btn-reject:disabled` | Disabled state | opacity 0.6, cursor not-allowed |
   | `.action-error` | Error message | color `var(--color-btn-reject)`, font-size 14px, margin-top 8px |
   | `.action-success` | Success message | color `var(--color-btn-approve)`, font-size 14px, margin-top 8px |

### Phase 3: ApproveRequestPage Component *(depends on Phase 1 & 2)*

6. **Create `src/features/approve-request/ApproveRequestPage.tsx`** — new file

   **Props interface**:
   ```typescript
   interface ApproveRequestPageProps {
     requestId: string
     onNavigateBack: () => void
     onDecisionSaved?: () => void
   }
   ```

   **Data fetching** (follow `RequestReviewPanel.tsx` pattern):
   - Use `useViewState<EventApprovalRequest | null>(null)`
   - On mount + `requestId` change: call `createDataProvider().getRequest(requestId)`
   - Handle `ApiError` by code: `NOT_FOUND` → error, `CONFLICT` → stale
   - Local state: `comment` (string), `isSubmitting` (boolean), `submitError` (string | null), `submitStatus` (string | null)

   **Decision submission** (port logic from `RequestReviewPanel.tsx` `submitDecision()`):
   - Validate: for rejection, comment is required; for approval, comment is optional
   - Call `decideRequest(requestId, { decisionType, comment: trimmedComment, version: data.version })`
   - Handle `CONFLICT` → stale state + error message
   - On success → set submitStatus, call `onDecisionSaved`
   - NOTE: The Figma placeholder says "optional for approval, required for rejection" — update the existing validation logic which currently requires comment for BOTH decisions to match this rule

   **Render structure** (all CSS classes, no inline styles):
   ```
   div.view-request
     button.view-request__back-link → "← Back" (onClick → onNavigateBack)

     [if loading] → p[role="status"] "Loading request details…"
     [if error] → p[role="alert"] error message
     [if stale] → p[role="status"] stale warning

     [if ready/stale with data] →
       div.view-request__layout
         div.view-request__main
           ── Request Details Card (identical to ViewRequestPage) ──
           ── Travel Details Card (identical to ViewRequestPage) ──
           ── Comments Card (identical to ViewRequestPage) ──

         div.view-request__sidebar
           ── Cost Breakdown Card (identical to ViewRequestPage) ──

           ── Actions Card (UNIQUE) ──
           div.detail-card
             div.detail-card__header
               p.detail-card__section-title → "Actions"
             div.detail-card__body (flex column, gap 12px)
               textarea.action-textarea
                 placeholder="Add a comment (optional for approval, required for rejection)..."
                 value={comment}
                 onChange → setComment
                 id="action-comment"
               button.btn-approve [disabled={isSubmitting}]
                 checkmark SVG icon (16x16) + "Approve Request"
                 onClick → submitDecision('approved')
               button.btn-reject [disabled={isSubmitting}]
                 X SVG icon (16x16) + "Reject Request"
                 onClick → submitDecision('rejected')
               [if submitError] → p.action-error[role="alert"] {submitError}
               [if submitStatus] → p.action-success[role="status"] {submitStatus}
   ```

7. **Transportation mode emoji mapping** (same as view-request plan):
   - `'air'` → ✈️, `'rail'` → 🚆, `'car'` → 🚗, `'bus'` → 🚌, `'other'` → 🚶

8. **Date formatting**: `Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })` → "February 10, 2026"

9. **Cost formatting**: `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })` → "$1,800"

10. **Inline SVG icons** — 8 icons needed:
    - Left arrow (← Back link)
    - Person/user icon (submitter row)
    - Globe icon (website link row)
    - Calendar icon (role row)
    - Location pin icon (origin/destination)
    - Chat bubble icon (Add Comment button)
    - Checkmark icon (Approve button)
    - X/close icon (Reject button)

### Phase 4: Wire Entry Points *(depends on Phase 3)*

11. **Wire from `ApproverDashboardPage.tsx`**
    - Add `onViewRequest?: (requestId: string) => void` prop to `ApproverDashboardPage`
    - When a request is selected from the pending list, instead of (or in addition to) showing inline `RequestReviewPanel`, allow navigation to the full approve-request page
    - In App.tsx: pass `onViewRequest={navigateToApproveRequest}` to `ApproverDashboardPage`

12. **Wire from `ApproverHomePage`** (if implemented from plan-approver-home.md)
    - The "View Details" link on each request card should call `onViewDetails(requestId)` → which routes to `'approve-request'` for pending requests

### Phase 5: Tests *(depends on Phase 3)*

13. **Create `tests/integration/approve-request.view-states.integration.test.ts`**
    - Test loading state: "Loading" indicator visible
    - Test error state: `mockProvider.getRequest` rejects → error message
    - Test ready state: mock data renders all fields + actions panel
    - Test stale state: `CONFLICT` → stale warning + error message
    - Follow `request-review.view-states.integration.test.ts` pattern

14. **Create `tests/integration/approve-request.integration.test.ts`**
    - Test all request fields render correctly (event name, date, submitter, website, role, transport, origin, destination, all costs, total)
    - Test "← Back" button calls `onNavigateBack`
    - Test cost formatting (e.g., `$1,800` not `$1800`)
    - Test status badge correct variant per status
    - Test typing in action textarea updates value
    - Test clicking "Approve Request" calls `decideRequest` with `decisionType: 'approved'`
    - Test clicking "Reject Request" without comment shows error (comment required for rejection)
    - Test clicking "Reject Request" with comment calls `decideRequest` with `decisionType: 'rejected'`
    - Test approving without comment succeeds (optional for approval)
    - Test successful decision shows success message + calls `onDecisionSaved`
    - Test CONFLICT error shows stale warning
    - Test buttons disabled during submission
    - Follow existing test patterns: `createElement()`, `vi.mock()`, `@testing-library/react`

15. **Update existing tests** if entry point changes affect selectors
    - If `ApproverDashboardPage` props change, update `approver-dashboard.view-states.integration.test.ts`

---

## Relevant Files

| File | Action | Details |
|---|---|---|
| `src/app/App.tsx` | **Modify** | Add `'approve-request'` route, `selectedApprovalRequestId` state, render `ApproveRequestPage` in `renderRoute()` |
| `src/index.css` | **Modify** | Add CSS design tokens (if not present from other plans) — `--color-btn-approve`, `--color-btn-reject`, `--color-input-bg`, `--color-text-placeholder` plus shared tokens |
| `src/App.css` | **Modify** | Add all shared detail-card classes (from view-request plan) + new `.action-textarea`, `.btn-approve`, `.btn-reject`, `.action-error`, `.action-success` |
| `src/features/approve-request/ApproveRequestPage.tsx` | **Create** | New page: full request detail view + actions panel with approve/reject, data fetching via `getRequest()`, decision submission via `decideRequest()` |
| `src/features/approver-dashboard/ApproverDashboardPage.tsx` | **Modify** | Add optional `onViewRequest` prop to enable navigation to approve-request page |
| `src/features/approver-dashboard/RequestReviewPanel.tsx` | **No change** | Kept intact — still used inline from `ApproverDashboardPage`. Decision logic is ported (not moved) to `ApproveRequestPage`. |
| `src/models/eventApproval.ts` | **No change** | `EventApprovalRequest` already has all needed fields |
| `src/services/api-client/approvals.ts` | **No change** | `decideRequest()` already exists and works |
| `tests/integration/approve-request.view-states.integration.test.ts` | **Create** | View state tests |
| `tests/integration/approve-request.integration.test.ts` | **Create** | Functional + decision flow tests |

---

## Verification

### Visual Verification

1. Open app → switch to Approver → navigate to a pending request → compare side-by-side with Figma screenshot (node `1:586`)
2. **Back link**: "← Back" `14px`, positioned top-left below header, clickable
3. **Request Details card**: title 24px "Tech Conference 2026", PENDING badge yellow (`#f0b100`) with white uppercase text, submission date `#717182`, three info rows with icons (person/globe/calendar), website as blue link (`#155dfc`), role capitalized
4. **Travel Details card**: section title 16px, airplane emoji 24px with "Flight" capitalized + "Transportation mode" `#4a5565`, divider, 2-column grid Origin/Destination with pin icons
5. **Comments card**: "Comments" left + "Add Comment" button right (outlined, 32px), "No comments yet" centered `#6a7282`
6. **Cost Breakdown card**: 5 cost rows (label `#4a5565`, value `#0a0a0a`), divider, Total bold + blue `#155dfc`
7. **Actions card**: "Actions" heading, gray textarea (`#f3f3f5`, 64px, placeholder text), green "Approve Request" button (`#00a63e`, full-width, 36px, with checkmark), red "Reject Request" button (`#d4183d`, full-width, 36px, with X icon), 12px gap between elements
8. **Layout**: left column ~824px, right column 400px, 24px gap, cards 14px border-radius

### Functional Verification

1. Navigate to approve-request → request data loads and displays all fields
2. Click "← Back" → returns to approver dashboard
3. Type comment in Actions textarea → value updates
4. Click "Approve Request" without comment → succeeds (comment is optional for approval)
5. Click "Reject Request" without comment → shows error "Comment is required for rejection"
6. Click "Reject Request" with comment → calls `decideRequest` with `'rejected'` + comment
7. After successful decision → success message shown + `onDecisionSaved` fires
8. Buttons disabled during submission (no double-click)
9. CONFLICT error → stale warning shown
10. Website field is a clickable link (`<a>` tag)
11. Loading state → "Loading request details…"
12. Error state → error message with `role="alert"`

### Automated Tests

1. Run `npx vitest run` — all existing tests pass, no regressions
2. `approve-request.view-states.integration.test.ts` — 4 view state scenarios pass
3. `approve-request.integration.test.ts` — field rendering, navigation, decision flow, validation tests pass

---

## Decisions

| Decision | Rationale |
|---|---|
| **New feature directory `approve-request/`** | Follows existing pattern of one feature per directory. Not merging with `view-request` since this page has write actions (approve/reject) vs. read-only. |
| **Port decision logic from `RequestReviewPanel`, don't refactor** | Keeps `RequestReviewPanel` intact. The approve-request page ports the same `submitDecision()` logic. Future cleanup could extract shared logic. |
| **Comment optional for approval, required for rejection** | Figma placeholder text says "optional for approval, required for rejection". This differs from the existing `RequestReviewPanel` which requires comment for both. The new page follows the Figma design. |
| **CSS classes shared with view-request plan** | Both pages use the same card layout (`.detail-card`, `.info-row`, `.cost-row`, etc.). Classes are defined once and reused. New action-specific classes are added. |
| **No Tailwind** | Project uses plain CSS. All styling via BEM-ish CSS classes matching the convention from existing plans. |
| **Inline SVG icons** | Same approach as planned in view-request. Keeps icons self-contained with no external dependencies. |
| **Comments "Add Comment" is a no-op placeholder** | Figma shows static "No comments yet". Comment creation requires a new API endpoint not in the spec. Button renders correctly but has no action. |
| **`CostEstimate.hotels` mapped to "Hotel" label** | Figma shows "Hotel" singular. Model field is `hotels` plural. Display follows Figma. |

---

## Test Selector Impact

No existing test selectors are impacted since this is an entirely new page. The only modification to existing code is adding an optional `onViewRequest` prop to `ApproverDashboardPage`, which is backwards-compatible (existing tests don't pass this prop).

---

## Further Considerations

1. **Shared layout extraction** — The left-column cards (request details, travel, comments) + cost breakdown card are identical between `ViewRequestPage` (plan-view-request.md) and this `ApproveRequestPage`. If both are implemented, consider extracting a shared `RequestDetailLayout` component that both pages wrap. Recommendation: implement both independently first, then extract if warranted. Premature abstraction would be over-engineering.

2. **Comment validation change** — The existing `RequestReviewPanel` requires comment for all decisions. This page follows Figma: optional for approval, required for rejection. If both coexist, they'll have different validation rules. Recommendation: accept the divergence — `RequestReviewPanel` is the inline quick-action, `ApproveRequestPage` is the full-detail view with the design spec's rules.

3. **Entry point from approver home vs. dashboard** — If `plan-approver-home.md` is implemented, "View Details" on a pending request card should route here. If only the existing `ApproverDashboardPage` exists, add an optional prop for navigation. Recommendation: wire both entry points when available.

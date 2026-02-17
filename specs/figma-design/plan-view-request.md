# Plan: Implement View Request Page from Figma Design

## TL;DR

Create a new **View Request detail page** (`ViewRequestPage.tsx`) matching Figma node `1:233`. This is a read-only page showing full request details in a two-column card layout: request info + travel details + comments on the left, cost breakdown on the right. Requires adding a new route (`'view-request'`), a `selectedRequestId` state in the app shell, a new feature directory, and CSS classes following the BEM-ish convention already planned.

**Figma URL**: https://www.figma.com/design/UyhNeV4lXNaLjhHeNV0aXr/Event-Attendance?node-id=1-233

---

## Steps

### Phase 1: Routing & App Shell *(no dependencies)*

1. **Add `'view-request'` to `AppRoute` type** in `src/app/App.tsx`
   - Extend the union: `'submit' | 'history' | 'timeline' | 'dashboard' | 'notifications' | 'view-request'`

2. **Add `selectedRequestId` state** to the App component in `src/app/App.tsx`
   - `const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)`
   - Create a helper `navigateToRequest(requestId: string)` that sets both route and selectedRequestId
   - Create a `navigateBack()` that clears `selectedRequestId` and sets route to previous page (or `'history'`)

3. **Add `'view-request'` case to `renderRoute()`** in `src/app/App.tsx`
   - Render `ViewRequestPage` with props: `requestId={selectedRequestId!}`, `onNavigateBack={() => { setSelectedRequestId(null); setRoute('history'); }}`
   - Import `ViewRequestPage` from `../features/view-request/ViewRequestPage`

4. **Wire "View Details" / "View Timeline" entry points** (if they exist in current code)
   - In `RequestHistoryPage.tsx`: the existing "View timeline" buttons could be updated to navigate to `'view-request'` route instead (or keep as-is for MVP, add later)

### Phase 2: CSS — View Request Classes *(parallel with Phase 1)*

5. **Add design tokens to `src/index.css`** (if not already present from home page plan)

   | Token | Value | Usage |
   |---|---|---|
   | `--color-text-primary` | `#0a0a0a` | Headings, names, values |
   | `--color-text-secondary` | `#717182` | Dates, subtitles |
   | `--color-text-detail` | `#364153` | Info row text (submitter, role) |
   | `--color-text-muted` | `#4a5565` | Labels (Origin, Destination, cost categories) |
   | `--color-text-placeholder` | `#6a7282` | "No comments yet" |
   | `--color-link` | `#155dfc` | Website link, total cost value |
   | `--color-bg-page` | `#f9fafb` | Page background |
   | `--color-bg-card` | `#ffffff` | Card background |
   | `--color-border` | `rgba(0,0,0,0.1)` | Card borders, dividers |
   | `--color-badge-pending` | `#f0b100` | Pending status badge |
   | `--color-total-value` | `#155dfc` | Total cost amount |
   | `--radius-card` | `14px` | Card border radius |
   | `--radius-sm` | `8px` | Badge, button, link radius |
   | `--font-family` | `'Arimo', sans-serif` | Global font |

6. **Add view-request CSS classes to `src/App.css`**

   | Class | Purpose | Key Styles |
   |---|---|---|
   | `.view-request` | Page wrapper | bg #f9fafb, min-height calc(100vh - 69px), padding 32px 26px |
   | `.view-request__back-link` | "← Back" link | flex, gap 8px, items-center, 14px, color #0a0a0a, rounded-8, no underline, cursor pointer, padding 4px 0, margin-bottom 24px |
   | `.view-request__layout` | 2-column container | display flex, gap 24px, max-width 1248px |
   | `.view-request__main` | Left column | flex column, gap 24px, flex 1 (takes ~824px) |
   | `.view-request__sidebar` | Right column | width 400px, flex-shrink 0 |
   | `.detail-card` | White card container | white bg, border 1px rgba(0,0,0,0.1), border-radius 14px, overflow hidden |
   | `.detail-card__header` | Card header section | padding 24px 24px 0 |
   | `.detail-card__body` | Card body section | padding 0 24px 24px |
   | `.detail-card__title-row` | Title + badge row | flex, justify-between, items-start |
   | `.detail-card__title` | Event name (h2) | 24px, normal weight, #0a0a0a, line-height 32px |
   | `.detail-card__subtitle` | Submitted date | 16px, #717182, line-height 24px, margin-top 8px |
   | `.detail-card__section-title` | "Travel Details", "Comments", "Cost Breakdown" | 16px, normal weight, #0a0a0a |
   | `.status-badge` | Base badge | display inline-flex, items-center, justify-center, rounded-8, padding 3px 9px, font-size 12px, line-height 16px, color white, text-transform uppercase |
   | `.status-badge--pending` | Pending variation | bg #f0b100 |
   | `.status-badge--approved` | Approved variation | bg #16a34a |
   | `.status-badge--rejected` | Rejected variation | bg #dc2626 |
   | `.status-badge--submitted` | Submitted variation | bg #f0b100 |
   | `.status-badge--draft` | Draft variation | bg #6b7280 |
   | `.info-row` | Icon + text row | flex, gap 8px, items-center, height 24px |
   | `.info-row__icon` | 20x20 icon | width 20px, height 20px, flex-shrink 0 |
   | `.info-row__text` | Text value | 16px, #364153, line-height 24px |
   | `.info-row__link` | Link value | 16px, #155dfc, line-height 24px, text-decoration none |
   | `.travel-mode` | Transport mode block | flex, gap 12px, items-center |
   | `.travel-mode__emoji` | Emoji icon | font-size 24px, line-height 32px |
   | `.travel-mode__label` | Mode name | 16px, #0a0a0a, capitalize |
   | `.travel-mode__sub` | "Transportation mode" | 14px, #4a5565 |
   | `.travel-grid` | Origin + Destination 2-col | display grid, grid-template-columns repeat(2, 1fr), gap 16px |
   | `.travel-field__label` | "Origin" / "Destination" | 14px, #4a5565, line-height 20px |
   | `.travel-field__value` | Location + icon | flex, gap 8px, items-center, 16px, #0a0a0a |
   | `.travel-field__pin` | Location pin icon | 16x16 |
   | `.divider` | Horizontal line | height 1px, bg rgba(0,0,0,0.1), width 100% |
   | `.cost-row` | Cost line item | flex, justify-between, items-start, height 24px |
   | `.cost-row__label` | Category name | 16px, #4a5565, line-height 24px |
   | `.cost-row__value` | Dollar amount | 16px, #0a0a0a, line-height 24px |
   | `.cost-total` | Total row | flex, justify-between, items-center, height 36px |
   | `.cost-total__label` | "Total" | bold 18px, #0a0a0a, line-height 28px |
   | `.cost-total__value` | Total amount | bold 20px, #155dfc, line-height 28px |
   | `.comments-header` | Comments title + button row | flex, justify-between, items-center |
   | `.comments-empty` | "No comments yet" | text-align center, padding 14px 0, 16px, #6a7282 |
   | `.btn-outline-sm` | "Add Comment" button | bg white, border 1px rgba(0,0,0,0.1), rounded-8, height 32px, padding 0 16px, 14px, #0a0a0a, cursor pointer, flex items-center gap 8px |

### Phase 3: ViewRequestPage Component *(depends on Phase 1 & 2)*

7. **Create `src/features/view-request/ViewRequestPage.tsx`** — new file

   **Props interface**: `ViewRequestPageProps { requestId: string; onNavigateBack: () => void; }`

   **Data fetching pattern** (follow `RequestReviewPanel` pattern):
   - Use `useViewState<EventApprovalRequest | null>(null)`
   - On mount + `requestId` change: call `createDataProvider().getRequest(requestId)`
   - Handle `ApiError` by code: `NOT_FOUND` → error state, `CONFLICT` → stale state, other → error state

   **Render structure** (all using CSS classes, no inline styles):
   ```
   div.view-request
     button.view-request__back-link → "← Back" (onClick → onNavigateBack)

     [if loading] → "Loading request details..."
     [if error] → error message
     [if stale] → stale warning + data below
     [if ready/stale] →
       div.view-request__layout
         div.view-request__main
           ── Request Details Card ──
           div.detail-card
             div.detail-card__header
               div.detail-card__title-row
                 h2.detail-card__title → eventName
                 span.status-badge.status-badge--{status} → STATUS
               p.detail-card__subtitle → "Submitted on {formattedDate}"
             div.detail-card__body
               div.info-row → person icon + submitterDisplayName
               div.info-row → globe icon + eventWebsite (as link)
               div.info-row → calendar icon + "Role: {role}" (capitalize)

           ── Travel Details Card ──
           div.detail-card
             div.detail-card__header
               p.detail-card__section-title → "Travel Details"
             div.detail-card__body
               div.travel-mode
                 span.travel-mode__emoji → transportation emoji
                 div: p.travel-mode__label → mode name
                       p.travel-mode__sub → "Transportation mode"
               div.divider
               div.travel-grid
                 div.travel-field
                   p.travel-field__label → "Origin"
                   div.travel-field__value → pin icon + origin
                 div.travel-field
                   p.travel-field__label → "Destination"
                   div.travel-field__value → pin icon + destination

           ── Comments Card ──
           div.detail-card
             div.detail-card__header
               div.comments-header
                 p.detail-card__section-title → "Comments"
                 button.btn-outline-sm → chat icon + "Add Comment"
             div.detail-card__body
               p.comments-empty → "No comments yet"

         div.view-request__sidebar
           ── Cost Breakdown Card ──
           div.detail-card
             div.detail-card__header
               p.detail-card__section-title → "Cost Breakdown"
             div.detail-card__body (gap 12px between rows)
               div.cost-row → "Registration" | "$X"
               div.cost-row → "Travel" | "$X"
               div.cost-row → "Hotel" | "$X"
               div.cost-row → "Meals" | "$X"
               div.cost-row → "Other" | "$X"
               div.divider
               div.cost-total → "Total" | "$X,XXX" (blue)
   ```

8. **Transportation mode emoji mapping** — define a helper map in-component:
   - `'flight'` → ✈️
   - `'train'` → 🚆
   - `'car'` → 🚗
   - `'bus'` → 🚌
   - Other → 🚶

9. **Date formatting** — format `submittedAt` as "February 10, 2026" using `Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })`

10. **Cost formatting** — format numbers as `$1,800` using `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })`

11. **Icons** — Use inline SVGs for the 6 icons visible in the design:
    - Left arrow (← Back link)
    - Person/user (submitter name)
    - Globe (website link)
    - Calendar (role)
    - Location pin (origin/destination)
    - Chat bubble (Add Comment button)

    Define as simple SVG constants at the top of the component file.

### Phase 4: Connect Entry Points *(depends on Phase 3)*

12. **Wire from `RequestHistoryPage.tsx`** — Add `onViewRequest?: (requestId: string) => void` prop
    - Modify existing "View timeline for {requestNumber}" buttons to call `onViewRequest(requestId)` when the prop is provided
    - `App.tsx` passes `onViewRequest={navigateToRequest}` to `RequestHistoryPage`

13. **Wire from `ApproverDashboard`** (optional, future scope)
    - Approver may also need a read-only view — out of scope for this plan

### Phase 5: Tests *(depends on Phase 3)*

14. **Create `tests/integration/view-request.view-states.integration.test.ts`**
    - Test loading state: "Loading" indicator visible
    - Test error state: `mockProvider.getRequest` rejects → error message shown
    - Test ready state: mock data renders all fields correctly
    - Test stale state: `CONFLICT` error → stale warning shown
    - Follow `request-timeline.view-states.integration.test.ts` test pattern

15. **Create `tests/integration/view-request.integration.test.ts`**
    - Test correct rendering of all request fields (event name, date, submitter, website, role, transport, origin, destination, all costs, total)
    - Test back button calls `onNavigateBack`
    - Test cost formatting (e.g., `$1,800` not `$1800`)
    - Test status badge correct variant per status value
    - Follow existing test patterns: `createElement()`, `vi.mock()`, `@testing-library/react`

16. **Update existing tests** if entry points are modified
    - If `RequestHistoryPage` selectors change, update `requests.history.contract.test.ts`

---

## Relevant Files

| File | Action | Details |
|---|---|---|
| `src/app/App.tsx` | **Modify** | Add `'view-request'` route, `selectedRequestId` state, `navigateToRequest` helper, render `ViewRequestPage` in `renderRoute()` |
| `src/index.css` | **Modify** | Add CSS custom properties / design tokens (if not present from home plan) |
| `src/App.css` | **Modify** | Add all `.view-request__*`, `.detail-card*`, `.info-row*`, `.cost-*`, `.status-badge*`, `.travel-*`, `.comments-*`, `.btn-outline-sm`, `.divider` classes |
| `src/features/view-request/ViewRequestPage.tsx` | **Create** | New page component — full request detail view with 4 cards in 2-column layout, data fetching via `getRequest()`, view state handling |
| `src/features/request-history/RequestHistoryPage.tsx` | **Modify** | Add `onViewRequest` prop to navigate to view-request route |
| `src/models/eventApproval.ts` | **No change** | `EventApprovalRequest` already has all needed fields: `eventName`, `eventWebsite`, `role`, `transportationMode`, `origin`, `destination`, `costEstimate`, `status`, `submittedAt`, `submitterDisplayName` |
| `tests/integration/view-request.view-states.integration.test.ts` | **Create** | View state tests (loading, error, ready, stale) |
| `tests/integration/view-request.integration.test.ts` | **Create** | Functional integration tests |

---

## Verification

### Visual Verification

1. Open app → navigate to request history → click to view a request → compare side-by-side with Figma screenshot (node 1:233)
2. **Back link**: "← Back" positioned top-left below header, 14px, rounded-8, clickable
3. **Request Details card**: title 24px "Tech Conference 2026", PENDING badge yellow (#f0b100) with white uppercase text, submission date gray #717182, three info rows with 20x20 icons (person, globe, calendar), website as blue link (#155dfc), role capitalized
4. **Travel Details card**: section title 16px, airplane emoji 24px with "Flight" capitalized + subtitle "Transportation mode" 14px #4a5565, horizontal divider, 2-column grid Origin/Destination with pin icons and city names
5. **Comments card**: "Comments" heading left-aligned + "Add Comment" button right-aligned (outlined, 32px height, rounded-8), "No comments yet" centered gray #6a7282
6. **Cost Breakdown card (sidebar)**: "Cost Breakdown" heading, 5 cost rows (label #4a5565 left, value #0a0a0a right), horizontal divider, Total row with bold "Total" 18px + bold blue "$1,800" 20px #155dfc
7. **Layout**: left column ~824px, right column 400px, 24px gap between, cards have 14px border-radius, 1px border rgba(0,0,0,0.1)

### Functional Verification

1. Navigate to view-request → request data loads and displays all fields correctly
2. Click "← Back" → returns to previous page (history or dashboard)
3. Loading state shows loading indicator
4. Error state (request not found) shows error message
5. Stale state (conflict) shows warning
6. Website field renders as clickable link opening in new tab
7. All 5 cost items display correct dollar amounts
8. Total matches sum of costs
9. Status badge shows correct color per status value

### Automated Tests

1. Run `npx vitest run` — all existing tests pass, no regressions
2. `view-request.view-states.integration.test.ts` — 4 view state scenarios pass
3. `view-request.integration.test.ts` — field rendering + navigation tests pass

---

## Decisions

| Decision | Rationale |
|---|---|
| **New feature directory `view-request/`** | Follows existing pattern: each feature in its own directory under `features/` |
| **Single component `ViewRequestPage.tsx`** | The page is read-only (no form), simpler than submit-request which split Page + Form. A single component suffices. |
| **Comments section is static placeholder** | Figma shows "No comments yet" + "Add Comment" button. Comment functionality is out of scope; render the UI as a placeholder matching the design. |
| **Use `createDataProvider().getRequest(requestId)` directly** | Pattern used by `RequestReviewPanel.tsx`. No need to create a wrapper function. |
| **Inline SVG icons** | Keep icons as inline SVG elements (not img tags) for styling flexibility and no external dependencies. Based on Figma's icon nodes. |
| **No Tailwind** | Project uses plain CSS; all styling via custom CSS classes with BEM-ish naming convention per plan-home.md |
| **`CostEstimate.hotels` field mapped to "Hotel" label** | Figma shows "Hotel" (singular), model field is `hotels` (plural). Display label follows Figma. |
| **Transportation emoji map** | Figma shows ✈️ for "flight". Map each `transportationMode` value to appropriate emoji. Keeps it simple without requiring icon assets. |

---

## Test Selector Impact

No existing test selectors are impacted since this is an entirely new page. The only modification to existing code is adding an optional `onViewRequest` prop to `RequestHistoryPage`, which is backwards-compatible (existing tests don't pass this prop).

---

## Further Considerations

1. **Home page plan dependency** — Design tokens (CSS custom properties) overlap with `plan-home.md`. If the home page CSS is already implemented, Phase 2 step 5 can be skipped. If not, this plan adds only the tokens needed. Recommendation: check if tokens exist at implementation time and deduplicate.

2. **"Add Comment" functionality** — The button is rendered as a visual placeholder per Figma. Actual comment creation would need a new API endpoint (`POST /requests/{requestId}/comments`) not currently in the OpenAPI spec. Recommendation: wire the button click to show a "Coming soon" toast or leave it as a no-op for now.

3. **Navigation entry point** — Currently no UI path leads to view-request. The most natural entry is from `RequestHistoryPage` "View timeline" buttons. Recommendation: rename those to "View Details" and route to `'view-request'` instead of (or in addition to) showing the inline timeline.
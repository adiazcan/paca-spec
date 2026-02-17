# Plan: Apply Figma Design to New Request Page

## TL;DR

Restyle the Submit Request page (`SubmitRequestForm.tsx`, `SubmitRequestPage.tsx`) to match the Figma "Event Attendance New Request" design (node `1:106`). This involves adding CSS classes for form elements (inputs, selects, labels, sections, cost total bar, action buttons), restructuring the form layout with 2-column grids and section headings, adding a "Back to Dashboard" link, wrapping the form in a card container, and adding a Cancel button. All existing logic (validation, submission, view states) is preserved. Builds on the design system established in the home page plan.

## Figma Reference

- **File**: [Event Attendance – Figma](https://www.figma.com/design/UyhNeV4lXNaLjhHeNV0aXr/Event-Attendance?node-id=1-106&t=7XMtyCqhzPsXrf01-0)
- **Node**: `1:106` — "Event Attendance New Request"

---

## Steps

### Phase 1: CSS — Form Design Tokens & Classes

> Depends on the home page plan's Phase 1 (design tokens in `index.css`). If the home page plan is not yet implemented, these tokens must be added first.

1. **Add form-specific CSS custom properties to `src/index.css`** (if not already present from home page plan)

   | Token | Value | Usage |
   |---|---|---|
   | `--color-input-bg` | `#f3f3f5` | Input/select background |
   | `--color-input-placeholder` | `#717182` | Placeholder text |
   | `--color-total-bg` | `#eff6ff` | Total cost bar background |
   | `--color-total-border` | `#bedbff` | Total cost bar border |
   | `--color-total-value` | `#155dfc` | Total cost dollar amount |
   | `--color-btn-primary-bg` | `#030213` | Submit button background |

2. **Add form component CSS classes to `src/App.css`**

   | Class | Purpose | Key Styles |
   |---|---|---|
   | `.back-link` | "← Back to Dashboard" | flex, gap 10px, items-center, 14px, color #0a0a0a, rounded-8, no underline, cursor pointer, padding 4px 0 |
   | `.form-card` | White card container | white bg, border 1px rgba(0,0,0,0.1), border-radius 14px, max-width 768px, margin 0 auto |
   | `.form-card__header` | Title + subtitle area | padding 24px 24px 0, flex-col, gap 6px |
   | `.form-card__title` | Card title | 16px regular, #0a0a0a |
   | `.form-card__subtitle` | Card subtitle | 16px, #717182, line-height 24px |
   | `.form-body` | Form content wrapper | padding 0 24px 24px, flex-col, gap 24px, margin-top ~24px |
   | `.form-section` | Section group | flex-col, gap 16px |
   | `.form-section__heading` | "Event Information" etc. | bold 18px, #0a0a0a, line-height 28px |
   | `.form-group` | Label + input pair | flex-col, gap 8px |
   | `.form-label` | Label text | 14px, #0a0a0a, line-height 14px |
   | `.form-input` | Text/number input | bg #f3f3f5, border transparent, border-radius 8px, height 36px, padding 4px 12px, font 14px Arimo, width 100%, box-sizing border-box |
   | `.form-input::placeholder` | Placeholder | color #717182 |
   | `.form-select` | Select dropdown | same as `.form-input` plus appearance reset, custom chevron via bg-image |
   | `.form-row` | 2-column layout | grid, grid-template-columns repeat(2, 1fr), gap 16px |
   | `.cost-total-bar` | Total estimated cost | bg #eff6ff, border 1px #bedbff, border-radius 10px, height 66px, flex, items-center, justify-between, padding 0 17px |
   | `.cost-total-bar__label` | "Total Estimated Cost:" | bold 16px, #0a0a0a |
   | `.cost-total-bar__value` | "$0.00" | bold 24px, #155dfc |
   | `.form-actions` | Button container | flex, gap 12px, padding-top 16px |
   | `.btn-primary` | Submit button | bg #030213, white text, rounded-8, height 36px, flex 1, border none, cursor pointer, 14px |
   | `.btn-primary:disabled` | Disabled state | opacity 0.6, cursor not-allowed |
   | `.btn-secondary` | Cancel button | white bg, border 1px rgba(0,0,0,0.1), rounded-8, height 36px, flex 1, 14px, #0a0a0a, cursor pointer |
   | `.form-error` | Validation error | color red, font-size 12px, margin-top 4px |
   | `.form-alert` | Page-level error/status | padding 12px, border-radius 8px, margin-bottom 16px |

### Phase 2: Restructure SubmitRequestPage.tsx

3. **Add "← Back to Dashboard" link** at the top of the page, above the form card
   - Renders an SVG left-arrow icon + "Back to Dashboard" text
   - Clicking triggers navigation to the dashboard/home route
   - Requires accepting an `onNavigateBack` callback prop (or using the existing routing mechanism from `App.tsx`)

4. **Wrap form in card container structure**
   - Replace the bare `<section>` with:
     - `.back-link` element
     - `.form-card` container with:
       - `.form-card__header` containing title "Submit Event Attendance Request" + subtitle "Fill out the form below to request approval for attending an event as a speaker, organizer, or assistant"
       - Status/error/warning messages (existing logic preserved, styled with `.form-alert`)
       - `<SubmitRequestForm />` component

5. **Add `onCancel` prop handling**
   - `SubmitRequestPage` needs to accept `onCancel` and `onNavigateBack` callbacks
   - Pass `onCancel` through to `SubmitRequestForm`

### Phase 3: Restyle SubmitRequestForm.tsx

6. **Restructure form into three sections** with `.form-section` wrappers and `.form-section__heading` elements:
   - **Section 1 — "Event Information"**: Event Name, Event Website, Your Role
   - **Section 2 — "Travel Details"**: Transportation Mode, Origin + Destination (side-by-side in `.form-row`)
   - **Section 3 — "Estimated Costs"**: All 5 cost fields in `.form-row` grid (2-column, 3 rows), Total cost bar, no currency code field visible

7. **Update all form fields** with CSS classes:
   - Each field wrapped in `.form-group`
   - Labels use `.form-label` class, with labels matching Figma: "Event Name *", "Event Website *", "Your Role *", "Transportation Mode *", "Origin *", "Destination *", "Registration Fee ($)", "Travel Cost ($)", "Hotel Cost ($)", "Meals ($)", "Other Expenses ($)"
   - Inputs use `.form-input` class with appropriate placeholders: "e.g., Tech Conference 2026", "https://example.com", "e.g., New York, NY", "e.g., San Francisco, CA", "0.00"
   - Selects use `.form-select` class, with capitalized display values ("Speaker", "Flight" etc.)
   - Validation errors use `.form-error` class

8. **Replace the fieldset/legend cost section** with structured layout:
   - Replace `<fieldset><legend>Cost estimate</legend>` with a `.form-section` div + bold heading
   - Cost fields in a `.form-row` 2-column grid:
     - Row 1: Registration Fee ($) | Travel Cost ($)
     - Row 2: Hotel Cost ($) | Meals ($)
     - Row 3: Other Expenses ($) | (empty)
   - Remove the visible `currencyCode` field (keep the hidden value "USD" for the payload)
   - Replace plain total text with `.cost-total-bar` styled element

9. **Update action buttons**:
   - Replace single `<button>` with `.form-actions` container
   - Submit button: `.btn-primary`, text "Submit Request" (or "Submitting…" when loading)
   - Cancel button: `.btn-secondary`, text "Cancel", calls `onCancel` prop
   - Both buttons inside the `.form-actions` flex container

10. **Add `onCancel` prop to `SubmitRequestForm`**:
    - Add to `SubmitRequestFormProps` interface
    - Wire to the Cancel button's onClick handler

### Phase 4: Update App Shell Routing

11. **Add `onCancel` and `onNavigateBack` wiring in `App.tsx`**:
    - `SubmitRequestPage` receives callbacks: `onNavigateBack` → navigates to home/dashboard, `onCancel` → navigates to home/dashboard
    - If the home page plan is implemented, navigate to `'home'`; otherwise navigate to `navItems[0].route`

---

## Relevant Files

| File | Action | Details |
|---|---|---|
| `src/index.css` | **Modify** | Add form-specific CSS tokens (if not from home page plan) |
| `src/App.css` | **Modify** | Add all form component CSS classes (`.form-card`, `.form-input`, `.form-select`, `.form-section`, etc.) |
| `src/features/submit-request/SubmitRequestPage.tsx` | **Modify** | Add back link, card wrapper, accept navigation callback props, pass `onCancel` to form |
| `src/features/submit-request/SubmitRequestForm.tsx` | **Modify** | Add CSS classes to all elements, restructure into 3 sections with headings, 2-column layouts, styled total bar, add Cancel button, update labels/placeholders, hide currency code field |
| `src/app/App.tsx` | **Modify** | Pass `onNavigateBack`/`onCancel` callbacks to `SubmitRequestPage` |

---

## Verification

### Visual Verification

1. Open the app in browser, navigate to "New Request" — compare side-by-side with Figma screenshot (node 1:106)
2. Verify header: "New Request" nav link has active state (dark bg #030213), "Dashboard" is inactive
3. Verify "← Back to Dashboard" link: positioned below header, left-aligned, proper spacing
4. Verify form card: centered, white bg, border, rounded-14 corners, 768px max-width
5. Verify form card header: title 16px, subtitle 16px #717182
6. Verify section headings: "Event Information", "Travel Details", "Estimated Costs" — bold 18px
7. Verify inputs: #f3f3f5 bg, transparent border, rounded-8, 36px height, correct placeholders
8. Verify selects: styled same as inputs with chevron, showing "Speaker" and "Flight" defaults
9. Verify 2-column layouts: Origin/Destination side-by-side, cost fields 2×3 grid
10. Verify total cost bar: light blue bg #eff6ff, blue border #bedbff, rounded-10, bold label + blue $0.00
11. Verify buttons: Submit (dark, flex-1) + Cancel (white bordered) side-by-side

### Functional Verification

1. Fill out form and submit — validation errors display correctly with `.form-error` styling
2. Successful submission shows success message
3. Page-level errors (API failure, stale data) display correctly
4. Website reachability warning still displays
5. Cancel button navigates back to dashboard
6. "Back to Dashboard" link navigates back
7. Cost total auto-calculates correctly as values change
8. Currency code is still sent as "USD" in the payload despite hidden field

### Automated Tests

1. Run `npx vitest run` — all existing unit, integration, and contract tests pass
2. `submit-request.integration.test.ts` — still finds form fields and submits successfully (selectors need updating)
3. `submit-request.validation.integration.test.ts` — validation error display still works
4. `submit-request.website-validation.integration.test.ts` — website warning still works

---

## Decisions

| Decision | Rationale |
|---|---|
| **Currency code field hidden, not removed** | Figma shows no currency field, but the API payload (`SubmitRequestInput.costEstimate.currencyCode`) requires it. Keep "USD" as hidden default. |
| **No new dependencies** | Plain CSS with custom properties, matching existing approach and home page plan. |
| **Native `<select>` with CSS styling** | Use appearance reset + CSS chevron bg-image rather than custom dropdown component. Simple and accessible. |
| **Labels match Figma exactly** | "Event Name *", "Your Role *", etc. Integration tests need selector updates. |
| **Cancel button navigates to dashboard** | Figma shows "Cancel" as a link-styled button. Navigates back to home/dashboard. |
| **Form card max-width 768px centered** | Matches the Figma container width (768px in a 1280px content area). |
| **Number input spinners hidden via CSS** | `-webkit-appearance: none` for visual fidelity with the Figma design. |

---

## Test Selector Impact

The following integration tests reference form field labels that will change:

| Test File | Current Selector | New Label |
|---|---|---|
| `submit-request.integration.test.ts` | `'Event name'` | `'Event Name *'` |
| `submit-request.integration.test.ts` | `'Event website'` | `'Event Website *'` |
| `submit-request.integration.test.ts` | `'Role'` | `'Your Role *'` |
| `submit-request.integration.test.ts` | `'Transportation'` | `'Transportation Mode *'` |
| `submit-request.integration.test.ts` | `'Origin'` | `'Origin *'` |
| `submit-request.integration.test.ts` | `'Destination'` | `'Destination *'` |
| `submit-request.integration.test.ts` | `'Registration'` | `'Registration Fee ($)'` |
| `submit-request.integration.test.ts` | `'Travel'` | `'Travel Cost ($)'` |
| `submit-request.integration.test.ts` | `'Hotels'` | `'Hotel Cost ($)'` |
| `submit-request.integration.test.ts` | `'Meals'` | `'Meals ($)'` |
| `submit-request.integration.test.ts` | `'Other'` | `'Other Expenses ($)'` |
| `submit-request.integration.test.ts` | `'Currency'` | *(field hidden — test needs update)* |

These tests must be updated to use the new label text.

---

## Further Considerations

1. **Home page plan dependency** — The design system tokens (fonts, colors, header CSS) overlap with the home page plan (`plan-home.md`). If both plans are executed, the shared CSS should be deduplicated. Recommendation: implement whichever plan goes first with the full design system, and the second plan only adds its page-specific classes.

2. **Select chevron icon** — The Figma shows a custom chevron-down icon. Using CSS `background-image` with an inline SVG data URL on the select element is the simplest approach. Alternative: wrapper div with pseudo-element.
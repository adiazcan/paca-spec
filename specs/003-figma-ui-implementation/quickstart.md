# Quickstart: Figma UI Implementation

## Prerequisites

- Node.js 18+ and npm
- Access to Figma file [Event Attendance](https://www.figma.com/design/UyhNeV4lXNaLjhHeNV0aXr/Event-Attendance)

## Setup

```bash
cd apps/event-approval-codeapp
npm install
```

## Development

```bash
npm run dev          # Start Vite dev server (hot reload)
```

Open `http://localhost:5173` in the browser.

## Tests

```bash
npm test             # Run all tests
npm run test:unit    # Unit tests only
npm run test:integration  # Integration tests only
npm run test:contract     # Contract tests only
npm run test:e2e:smoke    # Playwright smoke tests
```

## Lint & Format

```bash
npm run lint         # ESLint
npm run format       # Prettier check
```

## Key Directories

| Path | Purpose |
|------|---------|
| `src/components/` | Shared UI components (Header, StatusBadge, SummaryCards, etc.) |
| `src/features/` | Feature pages organized by screen |
| `src/models/` | Domain model types (unchanged) |
| `src/services/` | API client, Dataverse, mocks |
| `src/styles/design-tokens.css` | CSS custom properties from Figma |
| `src/app/App.tsx` | Main app with state-based routing |

## Figma Screens

| Screen | Figma Node | Spec Mapping |
|--------|-----------|-------------|
| Employee Home | `1:2` | US-2 (FR-001, FR-002) |
| New Request | `1:106` | US-1 (FR-003, FR-004, FR-005) |
| View Request | `1:233` | US-3 (FR-006, FR-014) |
| Approver Home | `1:385` | US-4 (FR-007, FR-012) |
| Approve Request | `1:586` | US-5 (FR-008, FR-009, FR-010) |

## Styling Approach

- **CSS Modules** (`.module.css`) co-located with components
- **Design tokens** as CSS custom properties in `design-tokens.css`
- **Font**: Arimo (Google Fonts) via `@import` in `index.css`
- No Tailwind — the app is not configured for it

## Routing

State-based routing in `App.tsx` — no router library. The app is a Power Apps CodeApp embedded in the Power Platform host, which controls the browser URL.

```typescript
type AppScreen =
  | 'employee-dashboard'
  | 'new-request'
  | 'view-request'
  | 'approver-dashboard'
  | 'approve-request'
```

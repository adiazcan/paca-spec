# Figma UI Implementation — Internal Component Contracts

This spec does not define new HTTP API endpoints. It consumes the existing
API defined in [specs/001-event-approval-workflow/contracts/event-approval.openapi.yaml](../../001-event-approval-workflow/contracts/event-approval.openapi.yaml) and
[specs/002-dataverse-integration/contracts/dataverse-integration.openapi.yaml](../../002-dataverse-integration/contracts/dataverse-integration.openapi.yaml).

The contracts below define **React component prop interfaces** — the contracts
between UI components.

## Component Contracts

### Header

```typescript
interface HeaderProps {
  role: 'employee' | 'approver'
  userName: string
  pendingCount: number // shown as red badge on "Approvals" nav (approver view)
  activeScreen: AppScreen
  onNavigate: (screen: AppScreen) => void
  onSwitchRole: () => void
  canSwitchRole: boolean
}
```

### SummaryCards

```typescript
interface SummaryCardsProps {
  total: number
  pending: number
  approved: number
  rejected: number
}
```

### StatusBadge

```typescript
interface StatusBadgeProps {
  status: 'submitted' | 'approved' | 'rejected'
}
```

### RequestCard

```typescript
interface RequestCardProps {
  requestId: string
  eventName: string
  status: RequestStatus
  role: RoleType
  submittedAt: string | null
  destination: string
  totalCost: number
  submitterDisplayName?: string  // approver view only
  latestComment?: string         // approver view, decided requests only
  onViewDetails: (requestId: string) => void
}
```

### CostBreakdown

```typescript
interface CostBreakdownProps {
  registration: number
  travel: number
  hotels: number
  meals: number
  other: number
  total: number
}
```

### BackLink

```typescript
interface BackLinkProps {
  label: string // "Back" or "Back to Dashboard"
  onClick: () => void
}
```

### SubmitRequestForm (refactored)

```typescript
interface SubmitRequestFormProps {
  onSubmit: (payload: SubmitRequestInput) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}
```

### ActionsPanel (approver-only)

```typescript
interface ActionsPanelProps {
  onApprove: (comment: string) => Promise<void>
  onReject: (comment: string) => Promise<void>
  isProcessing: boolean
}
```

### CommentsSection

```typescript
// Display-only: renders decision comments attached via approve/reject actions.
// No standalone addComment API exists yet (see C1 remediation in tasks.md).
interface CommentsSectionProps {
  comments: Array<{ author: string; content: string; timestamp: string }>
}
```

## Screen-Level Data Dependencies

| Screen | API Functions Used | Data Flow |
|--------|-------------------|-----------|
| Employee Dashboard | `listMyRequests()` | Fetch all → compute summary + render cards |
| New Request | `submitRequest(payload)` | Form → validate → submit → redirect |
| View Request | `getRequestDetail(id)` | Fetch one → render header + travel + costs + comments |
| Approver Dashboard | `listAllRequests()` | Fetch all → compute summary + render cards |
| Approve Request | `getRequestDetail(id)`, `submitDecision(id, decision)` | Fetch one → render + actions → submit decision → redirect |

## Navigation State Machine

```
Employee View:
  employee-dashboard ──[New Request nav]──▶ new-request
  employee-dashboard ──[View Details]─────▶ view-request
  new-request ────────[Back to Dashboard]─▶ employee-dashboard
  new-request ────────[Submit / Cancel]───▶ employee-dashboard
  view-request ───────[Back]──────────────▶ employee-dashboard

Approver View:
  approver-dashboard ──[View Details]─────▶ approve-request
  approve-request ─────[Back]─────────────▶ approver-dashboard
  approve-request ─────[Approve/Reject]───▶ approver-dashboard

Role Switch:
  any-employee-screen ──[Switch to Approver]──▶ approver-dashboard
  any-approver-screen ──[Switch to Employee]──▶ employee-dashboard
```

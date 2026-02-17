import { useEffect, useMemo, useState } from 'react'

import '@/App.css'

import { ApproverDashboardPage } from '@/features/approver-dashboard/ApproverDashboardPage'
import { ApproverHomePage } from '@/features/approver-home/ApproverHomePage'
import { ApproveRequestPage } from '@/features/approve-request/ApproveRequestPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { RequestHistoryPage } from '@/features/request-history/RequestHistoryPage'
import { SubmitRequestPage } from '@/features/submit-request/SubmitRequestPage'
import { ViewRequestPage } from '@/features/view-request/ViewRequestPage'
import { createDataProvider } from '@/services/api-client/providerFactory'

type AppRole = 'employee' | 'approver'
type AppRoute =
  | 'home'
  | 'submit'
  | 'history'
  | 'timeline'
  | 'dashboard'
  | 'approvals'
  | 'notifications'
  | 'view-request'
  | 'approve-request'

interface NavItem {
  route: AppRoute
  label: string
}

const navByRole: Record<AppRole, NavItem[]> = {
  employee: [
    { route: 'home', label: 'Dashboard' },
    { route: 'submit', label: 'New Request' },
  ],
  approver: [
    { route: 'dashboard', label: 'Dashboard' },
    { route: 'approvals', label: 'Approvals' },
  ],
}

function AppLogoIcon() {
  return (
    <svg aria-hidden="true" className="app-logo-icon" viewBox="0 0 24 24">
      <path d="M7 2.5a1 1 0 0 1 1 1v1h8v-1a1 1 0 1 1 2 0v1h.5A2.5 2.5 0 0 1 21 7v12a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 19V7a2.5 2.5 0 0 1 2.5-2.5H6v-1a1 1 0 0 1 1-1Zm11.5 7h-13a.5.5 0 0 0-.5.5V19c0 .3.2.5.5.5h13c.3 0 .5-.2.5-.5v-9a.5.5 0 0 0-.5-.5ZM7 13h4a1 1 0 1 1 0 2H7a1 1 0 1 1 0-2Z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg aria-hidden="true" className="header-icon" viewBox="0 0 20 20">
      <path d="M10 2.5a4.5 4.5 0 0 0-4.5 4.5v2.2l-.9 2.1c-.2.4.1.7.5.7h10c.4 0 .7-.3.5-.7l-.9-2.1V7A4.5 4.5 0 0 0 10 2.5Zm-1.8 11.2a1.8 1.8 0 0 0 3.6 0H8.2Z" />
    </svg>
  )
}

function UserAvatarIcon() {
  return (
    <svg aria-hidden="true" className="header-icon" viewBox="0 0 20 20">
      <circle
        cx="10"
        cy="10"
        fill="none"
        r="8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="8" r="2.2" />
      <path
        d="M6.8 14.2a3.2 3.2 0 0 1 6.4 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function renderRoute(
  role: AppRole,
  route: AppRoute,
  onViewDetails: (requestId: string) => void,
  onViewApprovalRequest: (requestId: string) => void,
  onNavigateToDashboard: () => void,
  selectedRequestId: string | null,
  selectedApprovalRequestId: string | null,
  onNavigateBackFromRequest: () => void,
  onNavigateBackFromApprovalRequest: () => void,
  onPendingCountChange: (pendingCount: number) => void,
) {
  if (route === 'home') {
    return <DashboardPage onViewDetails={onViewDetails} />
  }

  if (route === 'submit') {
    return (
      <SubmitRequestPage
        onCancel={onNavigateToDashboard}
        onNavigateBack={onNavigateToDashboard}
      />
    )
  }

  if (route === 'history') {
    return <RequestHistoryPage onViewRequest={onViewDetails} />
  }

  if (route === 'timeline') {
    return <RequestHistoryPage />
  }

  if (route === 'dashboard') {
    if (role === 'approver') {
      return (
        <ApproverHomePage
          onPendingCountChange={onPendingCountChange}
          onViewDetails={onViewApprovalRequest}
        />
      )
    }

    return <ApproverDashboardPage />
  }

  if (route === 'approvals') {
    return (
      <ApproverDashboardPage
        onPendingCountChange={onPendingCountChange}
        onViewRequest={onViewApprovalRequest}
      />
    )
  }

  if (route === 'view-request') {
    if (!selectedRequestId) {
      return <RequestHistoryPage onViewRequest={onViewDetails} />
    }

    return (
      <ViewRequestPage
        requestId={selectedRequestId}
        onNavigateBack={onNavigateBackFromRequest}
      />
    )
  }

  if (route === 'approve-request') {
    if (!selectedApprovalRequestId) {
      return (
        <ApproverDashboardPage
          onPendingCountChange={onPendingCountChange}
          onViewRequest={onViewApprovalRequest}
        />
      )
    }

    return (
      <ApproveRequestPage
        onDecisionSaved={onNavigateBackFromApprovalRequest}
        onNavigateBack={onNavigateBackFromApprovalRequest}
        requestId={selectedApprovalRequestId}
      />
    )
  }

  return <NotificationsPage />
}

export default function App() {
  const [role, setRole] = useState<AppRole>('employee')
  const navItems = useMemo(() => navByRole[role], [role])
  const [route, setRoute] = useState<AppRoute>('home')
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  )
  const [selectedApprovalRequestId, setSelectedApprovalRequestId] = useState<
    string | null
  >(null)

  useEffect(() => {
    let mounted = true

    async function loadPendingCount(): Promise<void> {
      if (role !== 'approver') {
        setPendingApprovalCount(0)
        return
      }

      try {
        const provider = createDataProvider()
        const pending = await provider.listPendingApprovals()

        if (!mounted) {
          return
        }

        setPendingApprovalCount(pending.length)
      } catch {
        if (!mounted) {
          return
        }

        setPendingApprovalCount(0)
      }
    }

    void loadPendingCount()

    return () => {
      mounted = false
    }
  }, [role, route])

  function updateRole(nextRole: AppRole): void {
    setRole(nextRole)
    setRoute(navByRole[nextRole][0].route)
    setSelectedRequestId(null)
    setSelectedApprovalRequestId(null)
  }

  function navigateToRequest(requestId: string): void {
    setSelectedRequestId(requestId)
    setSelectedApprovalRequestId(null)
    setRoute('view-request')
  }

  function navigateToApproveRequest(requestId: string): void {
    setSelectedApprovalRequestId(requestId)
    setSelectedRequestId(null)
    setRoute('approve-request')
  }

  function navigateBackFromRequest(): void {
    setSelectedRequestId(null)
    setRoute(role === 'approver' ? 'dashboard' : 'history')
  }

  function navigateBackFromApproveRequest(): void {
    setSelectedApprovalRequestId(null)
    setRoute('dashboard')
  }

  function handleRouteChange(nextRoute: AppRoute): void {
    if (nextRoute !== 'view-request') {
      setSelectedRequestId(null)
    }

    if (nextRoute !== 'approve-request') {
      setSelectedApprovalRequestId(null)
    }

    setRoute(nextRoute)
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__logo" aria-label="Event Approval System">
          <AppLogoIcon />
          <span className="app-header__logo-text">Event Approval System</span>
        </div>

        <div className="app-nav">
          {navItems.map((item) => (
            <button
              key={item.route}
              className={`nav-link ${route === item.route ? 'nav-link--active' : ''}`}
              onClick={() => handleRouteChange(item.route)}
              type="button"
            >
              {item.label}
              {role === 'approver' && item.route === 'approvals' ? (
                <span className="nav-link__badge">{pendingApprovalCount}</span>
              ) : null}
            </button>
          ))}

          <span className="nav-divider" aria-hidden="true" />

          <button
            className="icon-button"
            type="button"
            aria-label="Notifications"
          >
            <BellIcon />
          </button>

          <div className="user-section" aria-label="Current user">
            <UserAvatarIcon />
            <span>{role === 'approver' ? 'Jane Approver' : 'Sarah Johnson'}</span>
          </div>

          <button
            className="role-switch-btn"
            onClick={() =>
              updateRole(role === 'employee' ? 'approver' : 'employee')
            }
            type="button"
          >
            {role === 'employee' ? 'Switch to Approver' : 'Switch to Employee'}
          </button>
        </div>
      </header>

      <main className="main-content">
        {renderRoute(
          role,
          route,
          navigateToRequest,
          navigateToApproveRequest,
          () => handleRouteChange(navItems[0].route),
          selectedRequestId,
          selectedApprovalRequestId,
          navigateBackFromRequest,
          navigateBackFromApproveRequest,
          setPendingApprovalCount,
        )}
      </main>
    </div>
  )
}

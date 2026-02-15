import { useMemo, useState } from 'react'

import { resolveDataMode } from '@/services/api-client/environment'
import { ApproverDashboardPage } from '@/features/approver-dashboard/ApproverDashboardPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { RequestHistoryPage } from '@/features/request-history/RequestHistoryPage'
import { SubmitRequestPage } from '@/features/submit-request/SubmitRequestPage'

type AppRole = 'employee' | 'approver'
type AppRoute =
  | 'submit'
  | 'history'
  | 'timeline'
  | 'dashboard'
  | 'notifications'

interface NavItem {
  route: AppRoute
  label: string
}

const navByRole: Record<AppRole, NavItem[]> = {
  employee: [
    { route: 'submit', label: 'Submit Request' },
    { route: 'history', label: 'My History' },
    { route: 'timeline', label: 'Request Timeline' },
    { route: 'notifications', label: 'Notifications' },
  ],
  approver: [
    { route: 'dashboard', label: 'Pending Approvals' },
    { route: 'notifications', label: 'Notifications' },
  ],
}

const routeHeadings: Record<AppRoute, string> = {
  submit: 'Submit Event Request',
  history: 'My Request History',
  timeline: 'Request Timeline',
  dashboard: 'Approver Dashboard',
  notifications: 'Status Notifications',
}

function renderRoute(route: AppRoute) {
  if (route === 'submit') {
    return <SubmitRequestPage />
  }

  if (route === 'history') {
    return <RequestHistoryPage />
  }

  if (route === 'timeline') {
    return <RequestHistoryPage />
  }

  if (route === 'dashboard') {
    return <ApproverDashboardPage />
  }

  return <NotificationsPage />
}

export default function App() {
  const [role, setRole] = useState<AppRole>('employee')
  const navItems = useMemo(() => navByRole[role], [role])
  const [route, setRoute] = useState<AppRoute>(navItems[0].route)

  function updateRole(nextRole: AppRole): void {
    setRole(nextRole)
    setRoute(navByRole[nextRole][0].route)
  }

  return (
    <div
      style={{
        fontFamily: 'Segoe UI, sans-serif',
        margin: '0 auto',
        maxWidth: 920,
        padding: 24,
      }}
    >
      <header>
        <h1>Event Approval Workflow</h1>
        <p style={{ marginBottom: 8 }}>Data mode: {resolveDataMode()}</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => updateRole('employee')} type="button">
            Employee View
          </button>
          <button onClick={() => updateRole('approver')} type="button">
            Approver View
          </button>
        </div>
      </header>

      <nav
        aria-label="Primary"
        style={{ display: 'flex', gap: 8, marginBottom: 20 }}
      >
        {navItems.map((item) => (
          <button
            key={item.route}
            onClick={() => setRoute(item.route)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main>
        <h2>{routeHeadings[route]}</h2>
        {renderRoute(route)}
      </main>
    </div>
  )
}

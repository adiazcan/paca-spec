import { useEffect, useState } from 'react'

import { ApproverDashboardPage } from '@/features/approver-dashboard/ApproverDashboardPage'
import { ApproverReviewPage } from '@/features/approver-review/ApproverReviewPage'
import { EmployeeDashboardPage } from '@/features/employee-dashboard/EmployeeDashboardPage'
import { RequestDetailPage } from '@/features/request-detail/RequestDetailPage'
import { SubmitRequestPage } from '@/features/submit-request/SubmitRequestPage'
import { Header } from '@/components/Header'
import type { AppScreen, DashboardSummary } from '@/models/eventApproval'
import { identityService } from '@/services/dataverse/identityService'
import '@/App.css'

type AppRole = 'employee' | 'approver'
const dashboardByRole: Record<AppRole, AppScreen> = {
  employee: 'employee-dashboard',
  approver: 'approver-dashboard',
}

const routeHeadings: Record<AppScreen, string> = {
  'employee-dashboard': 'My Event Requests',
  'new-request': 'Submit Event Request',
  'view-request': 'Request Details',
  'approver-dashboard': 'All Event Requests',
  'approve-request': 'Review Request',
}

const defaultAvailableRoles: AppRole[] = ['employee', 'approver']

interface AppProps {
  availableRoles?: AppRole[]
}

interface ScreenHandlers {
  onCancelSubmitRequest: () => void
  onSubmitRequestComplete: () => void
  onSelectEmployeeRequest: (requestId: string) => void
  onEmployeeRequestBack: () => void
  onSelectApproverRequest: (requestId: string) => void
  onApproverSummaryChange: (summary: DashboardSummary) => void
  onApproverBack: () => void
  onApproverDecisionComplete: () => void
}

function renderScreen(
  screen: AppScreen,
  selectedRequestId: string | null,
  handlers: ScreenHandlers,
) {
  if (screen === 'new-request') {
    return (
      <SubmitRequestPage
        onCancel={handlers.onCancelSubmitRequest}
        onSubmitted={handlers.onSubmitRequestComplete}
      />
    )
  }

  if (screen === 'employee-dashboard') {
    return (
      <EmployeeDashboardPage onViewDetails={handlers.onSelectEmployeeRequest} />
    )
  }

  if (screen === 'view-request') {
    return (
      <RequestDetailPage
        onBack={handlers.onEmployeeRequestBack}
        requestId={selectedRequestId}
      />
    )
  }

  if (screen === 'approver-dashboard') {
    return (
      <ApproverDashboardPage
        onSummaryChange={handlers.onApproverSummaryChange}
        onViewDetails={handlers.onSelectApproverRequest}
      />
    )
  }

  return (
    <ApproverReviewPage
      onBack={handlers.onApproverBack}
      onDecisionComplete={handlers.onApproverDecisionComplete}
      requestId={selectedRequestId}
    />
  )
}

export default function App({
  availableRoles = defaultAvailableRoles,
}: AppProps) {
  const normalizedAvailableRoles = availableRoles.filter(
    (value, index, source) => source.indexOf(value) === index,
  )
  const initialRole = normalizedAvailableRoles.includes('employee')
    ? 'employee'
    : (normalizedAvailableRoles[0] ?? 'employee')
  const canSwitchRole = normalizedAvailableRoles.length > 1

  const [role, setRole] = useState<AppRole>(initialRole)
  const [screen, setScreen] = useState<AppScreen>(dashboardByRole[initialRole])
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    identityService
      .getCurrentUser()
      .then((user) => setUserName(user.displayName))
      .catch(() => setUserName('Unknown User'))
  }, [])

  function updateRole(nextRole: AppRole): void {
    setRole(nextRole)
    setScreen(dashboardByRole[nextRole])
    setSelectedRequestId(null)

    if (nextRole === 'employee') {
      setPendingCount(0)
    }
  }

  return (
    <div className="appShell">
      <Header
        activeScreen={screen}
        canSwitchRole={canSwitchRole}
        onNavigate={(nextScreen) => {
          setScreen(nextScreen)
          setSelectedRequestId(null)
        }}
        onSwitchRole={() => {
          if (!canSwitchRole) {
            return
          }

          const nextRole = role === 'employee' ? 'approver' : 'employee'
          updateRole(nextRole)
        }}
        pendingCount={pendingCount}
        role={role}
        userName={userName}
      />

      <main className="main">
        {screen !== 'employee-dashboard' && screen !== 'new-request' ? (
          <h2 className="routeHeading">{routeHeadings[screen]}</h2>
        ) : null}
        {renderScreen(screen, selectedRequestId, {
          onCancelSubmitRequest: () => {
            setScreen('employee-dashboard')
            setSelectedRequestId(null)
          },
          onSubmitRequestComplete: () => {
            setScreen('employee-dashboard')
            setSelectedRequestId(null)
          },
          onSelectEmployeeRequest: (requestId) => {
            setSelectedRequestId(requestId)
            setScreen('view-request')
          },
          onEmployeeRequestBack: () => {
            setScreen('employee-dashboard')
            setSelectedRequestId(null)
          },
          onSelectApproverRequest: (requestId) => {
            setSelectedRequestId(requestId)
            setScreen('approve-request')
          },
          onApproverSummaryChange: (summary) => {
            setPendingCount(summary.pending)
          },
          onApproverBack: () => {
            setScreen('approver-dashboard')
            setSelectedRequestId(null)
          },
          onApproverDecisionComplete: () => {
            setScreen('approver-dashboard')
            setSelectedRequestId(null)
          },
        })}
      </main>
    </div>
  )
}

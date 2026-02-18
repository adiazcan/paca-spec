import type { AppScreen } from '@/models/eventApproval'

import styles from './Header.module.css'

type HeaderRole = 'employee' | 'approver'

interface HeaderProps {
  role: HeaderRole
  userName: string
  pendingCount: number
  activeScreen: AppScreen
  onNavigate: (screen: AppScreen) => void
  onSwitchRole: () => void
  canSwitchRole: boolean
}

interface HeaderNavItem {
  key: string
  label: string
  screen: AppScreen
  showBadge?: boolean
}

const navByRole: Record<HeaderRole, HeaderNavItem[]> = {
  employee: [
    {
      key: 'employee-dashboard',
      label: 'Dashboard',
      screen: 'employee-dashboard',
    },
    { key: 'new-request', label: 'New Request', screen: 'new-request' },
  ],
  approver: [
    {
      key: 'approver-dashboard',
      label: 'Dashboard',
      screen: 'approver-dashboard',
    },
    {
      key: 'approvals',
      label: 'Approvals',
      screen: 'approver-dashboard',
      showBadge: true,
    },
  ],
}

export function Header({
  role,
  userName,
  pendingCount,
  activeScreen,
  onNavigate,
  onSwitchRole,
  canSwitchRole,
}: HeaderProps) {
  const navItems = navByRole[role]
  const shouldShowApprovalsBadge = role === 'approver'

  function BuildingIcon() {
    return (
      <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24">
        <path
          d="M3 21h18v-2H3zm2-4h3v-3H5zm0-5h3V9H5zm0-5h3V4H5zm5 10h4v-3h-4zm0-5h4V9h-4zm0-5h4V4h-4zm6 10h3v-3h-3zm0-5h3V9h-3zm0-5h3V4h-3z"
          fill="currentColor"
        />
      </svg>
    )
  }

  function BellIcon() {
    return (
      <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-14 0v5L3 18v1h18v-1l-2-2Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  function UserIcon() {
    return (
      <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
        <path
          d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.86 0-7 2.24-7 5v1h14v-1c0-2.76-3.14-5-7-5Z"
          fill="currentColor"
        />
      </svg>
    )
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>
            <BuildingIcon />
          </span>
          <h1 className={styles.title}>Event Approval System</h1>
        </div>

        <nav aria-label="Primary" className={styles.nav}>
          {navItems.map((item) => {
            const isActive = activeScreen === item.screen

            return (
              <button
                key={item.key}
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? styles.navActive : styles.navButton}
                onClick={() => onNavigate(item.screen)}
                type="button"
              >
                <span>{item.label}</span>
                {shouldShowApprovalsBadge && item.showBadge && pendingCount > 0 ? (
                  <span aria-label="pending approvals" className={styles.badge}>
                    {pendingCount}
                  </span>
                ) : null}
              </button>
            )
          })}

          <div className={styles.userSection}>
            <span aria-hidden="true" className={styles.bellIcon}>
              <BellIcon />
            </span>
            <span className={styles.userInfo}>
              <span aria-hidden="true" className={styles.userIcon}>
                <UserIcon />
              </span>
              <span className={styles.userName}>{userName}</span>
            </span>
            {canSwitchRole ? (
              <button
                className={styles.switchButton}
                onClick={onSwitchRole}
                type="button"
              >
                {role === 'employee'
                  ? 'Switch to Approver'
                  : 'Switch to Employee'}
              </button>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  )
}

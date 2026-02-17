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

  return (
    <header className={styles.header}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>Event Attendance</h1>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{userName}</span>
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
              {item.showBadge && pendingCount > 0 ? (
                <span aria-label="pending approvals" className={styles.badge}>
                  {pendingCount}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>
    </header>
  )
}

import { useEffect } from 'react'

import { useViewState } from '@/app/useViewState'
import type { StatusNotification } from '@/models/eventApproval'
import { listNotifications } from '@/services/api-client/notifications'
import { ApiError } from '@/services/api-client/types'

export function NotificationsPage() {
  const viewState = useViewState<StatusNotification[]>([])
  const { setLoading, setData, setEmpty, setError, setStale } = viewState

  useEffect(() => {
    let mounted = true

    async function loadNotifications(): Promise<void> {
      setLoading()

      try {
        const items = await listNotifications()

        if (!mounted) {
          return
        }

        if (items.length === 0) {
          setEmpty()
          return
        }

        setData(items)
      } catch (error) {
        if (!mounted) {
          return
        }

        if (error instanceof ApiError && error.code === 'CONFLICT') {
          setStale()
          return
        }

        setError(
          error instanceof Error
            ? error
            : new Error('Unable to load notifications.'),
        )
      }
    }

    void loadNotifications()

    return () => {
      mounted = false
    }
  }, [setData, setEmpty, setError, setLoading, setStale])

  return (
    <section>
      <h2>Status Notifications</h2>

      {viewState.isLoading ? <p role="status">Loading notifications…</p> : null}
      {viewState.isEmpty ? (
        <p role="status">No notifications available.</p>
      ) : null}
      {viewState.isError ? (
        <p role="alert">
          {viewState.error?.message ?? 'Unable to load notifications.'}
        </p>
      ) : null}
      {viewState.isStale ? (
        <p role="status">Notifications are stale. Reload and try again.</p>
      ) : null}

      {!viewState.isLoading && !viewState.isEmpty && !viewState.isError ? (
        <ul aria-label="Notifications list">
          {viewState.data?.map((notification) => (
            <li key={notification.notificationId}>
              {notification.payload.status} — {notification.payload.comment} —
              Delivery: {notification.deliveryStatus}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

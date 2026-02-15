import { useCallback, useMemo, useState } from 'react'

type ViewStatus = 'loading' | 'empty' | 'error' | 'stale' | 'ready'

export interface ViewState<TData> {
  status: ViewStatus
  data: TData | null
  error: Error | null
  isLoading: boolean
  isEmpty: boolean
  isError: boolean
  isStale: boolean
  setLoading: () => void
  setEmpty: () => void
  setData: (data: TData) => void
  setError: (error: Error) => void
  setStale: (data?: TData | null) => void
  reset: () => void
}

export function useViewState<TData>(
  initialData: TData | null = null,
): ViewState<TData> {
  const [status, setStatus] = useState<ViewStatus>(
    initialData === null ? 'loading' : 'ready',
  )
  const [data, setDataState] = useState<TData | null>(initialData)
  const [error, setErrorState] = useState<Error | null>(null)

  const setLoading = useCallback(() => {
    setStatus('loading')
    setErrorState(null)
  }, [])

  const setEmpty = useCallback(() => {
    setStatus('empty')
    setDataState(null)
    setErrorState(null)
  }, [])

  const setData = useCallback((nextData: TData) => {
    const isArrayAndEmpty = Array.isArray(nextData) && nextData.length === 0
    setStatus(isArrayAndEmpty ? 'empty' : 'ready')
    setDataState(nextData)
    setErrorState(null)
  }, [])

  const setError = useCallback((nextError: Error) => {
    setStatus('error')
    setErrorState(nextError)
  }, [])

  const setStale = useCallback((nextData?: TData | null) => {
    setStatus('stale')
    if (nextData !== undefined) {
      setDataState(nextData)
    }
    setErrorState(null)
  }, [])

  const reset = useCallback(() => {
    setStatus(initialData === null ? 'loading' : 'ready')
    setDataState(initialData)
    setErrorState(null)
  }, [initialData])

  return useMemo(
    () => ({
      status,
      data,
      error,
      isLoading: status === 'loading',
      isEmpty: status === 'empty',
      isError: status === 'error',
      isStale: status === 'stale',
      setLoading,
      setEmpty,
      setData,
      setError,
      setStale,
      reset,
    }),
    [
      data,
      error,
      reset,
      setData,
      setEmpty,
      setError,
      setLoading,
      setStale,
      status,
    ],
  )
}

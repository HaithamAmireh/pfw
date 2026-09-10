import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { monthKey } from './date'

const MONTH_RE = /^\d{4}-\d{2}$/

// Keeps the selected month in the URL (?month=YYYY-MM) so a dashboard/analytics/
// budgets view is shareable and survives a refresh, instead of silently resetting.
export function useMonthParam(): [string, (key: string) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('month')
  const key = raw && MONTH_RE.test(raw) ? raw : monthKey()

  const setKey = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const copy = new URLSearchParams(prev)
          copy.set('month', next)
          return copy
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return [key, setKey]
}

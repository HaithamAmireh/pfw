import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthKey, monthLabel, shiftMonthKey, shortMonthLabel } from '@/lib/date'

export function MonthSwitcher({
  value,
  onChange,
}: {
  value: string
  onChange: (key: string) => void
}) {
  const isCurrent = value === monthKey()
  const btn =
    'hit flex h-9 w-9 items-center justify-center rounded-md border-2 bg-paper transition-colors hover:bg-canvas disabled:opacity-30 disabled:hover:bg-paper'
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label="Previous month" onClick={() => onChange(shiftMonthKey(value, -1))} className={btn}>
        <ChevronLeft className="h-4 w-4" strokeWidth={2.75} />
      </button>
      <span className="tnum min-w-[4.75rem] text-center font-display text-sm font-bold sm:min-w-[8.5rem]" aria-live="polite">
        <span className="sm:hidden">
          {shortMonthLabel(value)} {value.slice(0, 4)}
        </span>
        <span className="hidden sm:inline">{monthLabel(value)}</span>
      </span>
      <button
        type="button"
        aria-label="Next month"
        disabled={isCurrent}
        onClick={() => onChange(shiftMonthKey(value, 1))}
        className={btn}
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2.75} />
      </button>
    </div>
  )
}

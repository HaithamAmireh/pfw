import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthKey, monthLabel, shiftMonthKey } from '@/lib/date'

export function MonthSwitcher({
  value,
  onChange,
}: {
  value: string
  onChange: (key: string) => void
}) {
  const isCurrent = value === monthKey()
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonthKey(value, -1))}
        className="flex h-9 w-9 items-center justify-center rounded border-3 bg-paper shadow-brut-sm transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={3} />
      </button>
      <span className="min-w-[9.5rem] text-center font-display text-sm font-bold">
        {monthLabel(value)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        disabled={isCurrent}
        onClick={() => onChange(shiftMonthKey(value, 1))}
        className="flex h-9 w-9 items-center justify-center rounded border-3 bg-paper shadow-brut-sm transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:opacity-30"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  )
}

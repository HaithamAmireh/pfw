import type { TooltipProps } from 'recharts'
import { money } from '@/lib/format'

export function BrutTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded border-3 bg-paper px-3 py-2 shadow-brut-sm">
      {label !== undefined && <p className="mb-1 text-xs font-bold text-ink/60">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm font-bold">
          {p.color && <span className="h-2.5 w-2.5 border border-ink" style={{ backgroundColor: p.color }} />}
          <span>{p.name}</span>
          <span className="tnum">{money(Number(p.value ?? 0))}</span>
        </div>
      ))}
    </div>
  )
}

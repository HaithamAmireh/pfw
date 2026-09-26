import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { useMonthParam } from '@/lib/useMonthParam'
import { categoryBreakdown, dailyTrend, groupSplit, subscriptionChanges, trailingTrend } from '@/lib/analytics'
import { GROUP_COLORS, getCategory } from '@/lib/categories'
import { CategoryIcon } from '@/lib/icons'
import { figure, moneyAxis, signedPct } from '@/lib/format'
import { monthKey, monthLabel } from '@/lib/date'
import { Card, EmptyState, PageHeader, Segmented, SectionHeading } from '@/components/ui'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { BrutTooltip } from '@/components/ChartTooltip'

const AXIS_TICK = { fontSize: 11, fontFamily: '"Spline Sans Mono", ui-monospace, monospace', fill: '#5E5A50' }
const INK = '#15130F'

export default function Analytics() {
  const [key, setKey] = useMonthParam()
  const expenses = useWallet((s) => s.expenses)
  const recurring = useWallet((s) => s.recurring)
  const income = useWallet((s) => s.settings.monthlyIncome)

  const isCurrentMonth = key === monthKey()
  const breakdown = useMemo(() => categoryBreakdown(expenses, key), [expenses, key])
  const trend = useMemo(
    () => dailyTrend(expenses, key, isCurrentMonth ? new Date().getDate() : undefined),
    [expenses, key, isCurrentMonth],
  )
  const groups = useMemo(() => groupSplit(expenses, key), [expenses, key])
  const yearly = useMemo(() => trailingTrend(expenses, 12, key), [expenses, key])
  const subChanges = useMemo(() => subscriptionChanges(recurring), [recurring])

  const spent = breakdown.reduce((s, b) => s + b.total, 0)
  const hasData = breakdown.length > 0
  const top = breakdown[0]?.total ?? 0
  const trendMax = Math.max(income, trend.at(-1)?.cumulative ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="History" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="History view"
          value="insights"
          options={[
            { id: 'passbook', label: 'Passbook', to: `/history?month=${key}` },
            { id: 'insights', label: 'Insights', to: `/analytics?month=${key}` },
          ]}
        />
        <MonthSwitcher value={key} onChange={setKey} />
      </div>

      {!hasData ? (
        <EmptyState
          title={`No spending in ${monthLabel(key)} yet`}
          message="Log a few expenses and this page shows where the money went and how the month moved."
        />
      ) : (
        <>
          <section aria-labelledby="where-heading">
            <SectionHeading id="where-heading" title="Where it went" />
            <Card padding="none" className="divide-y-2 divide-rule">
              {breakdown.map((b) => {
                const cat = getCategory(b.category)
                const share = spent > 0 ? (b.total / spent) * 100 : 0
                return (
                  <div key={b.category} className="flex items-center gap-3 px-3.5 py-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2"
                      style={{ backgroundColor: cat.hex }}
                    >
                      <CategoryIcon name={cat.icon} className={`h-4 w-4 ${cat.textOn === 'paper' ? 'text-paper' : 'text-ink'}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-bold">{cat.label}</span>
                        <span className="tnum shrink-0 font-mono text-sm font-semibold">{figure(b.total)}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-sm bg-canvas">
                          <div className="h-full" style={{ width: `${top > 0 ? (b.total / top) * 100 : 0}%`, backgroundColor: cat.hex }} />
                        </div>
                        <span className="tnum w-9 shrink-0 text-right text-xs font-semibold text-ink/60">{share.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </Card>
          </section>

          <section aria-labelledby="mix-heading">
            <SectionHeading id="mix-heading" title="Spending mix" />
            <Card padding="md">
              <div className="flex h-5 w-full overflow-hidden rounded-[3px] border-2" role="img" aria-label="Spending split by type">
                {groups
                  .filter((g) => g.total > 0)
                  .map((g) => (
                    <div
                      key={g.group}
                      className="h-full border-r-2 border-ink last:border-r-0"
                      style={{ width: `${(g.total / spent) * 100}%`, backgroundColor: GROUP_COLORS[g.group] }}
                    />
                  ))}
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2">
                {groups.map((g) => (
                  <div key={g.group}>
                    <dt className="flex items-center gap-1.5 text-xs font-bold text-ink/60">
                      <span className="h-2.5 w-2.5 rounded-[2px] border border-ink" style={{ backgroundColor: GROUP_COLORS[g.group] }} />
                      {g.label}
                    </dt>
                    <dd className="tnum mt-0.5 font-mono text-sm font-semibold">{figure(g.total)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </section>

          <section aria-labelledby="pace-heading">
            <SectionHeading id="pace-heading" title="How the month moved" />
            <Card padding="md">
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={trend} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke={INK} strokeOpacity={0.1} vertical={false} />
                  <XAxis dataKey="day" tick={AXIS_TICK} axisLine={{ stroke: INK }} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
                  <YAxis width={40} domain={[0, Math.ceil(trendMax / 100) * 100]} tickFormatter={moneyAxis} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <Tooltip content={<BrutTooltip />} labelFormatter={(d) => `${d} ${monthLabel(key).split(' ')[0]}`} />
                  {income > 0 && (
                    <ReferenceLine
                      y={income}
                      stroke="#D11F24"
                      strokeDasharray="5 4"
                      strokeWidth={1.5}
                      label={{ value: 'Income', position: 'insideTopRight', fontSize: 11, fontWeight: 700, fill: '#D11F24' }}
                    />
                  )}
                  <Line
                    type="stepAfter"
                    dataKey="cumulative"
                    name="Spent so far"
                    stroke={INK}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#FF7A00', stroke: INK, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </section>
        </>
      )}

      <section aria-labelledby="year-heading">
        <SectionHeading id="year-heading" title="Last 12 months" />
        <Card padding="md">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={yearly} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 4" stroke={INK} strokeOpacity={0.1} vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: INK }} tickLine={false} interval="preserveStartEnd" minTickGap={6} />
              <YAxis width={40} tickFormatter={moneyAxis} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip content={<BrutTooltip />} cursor={{ fill: INK, fillOpacity: 0.06 }} />
              <Bar dataKey="total" name="Spent" stroke={INK} strokeWidth={2} radius={0}>
                {yearly.map((y) => (
                  <Cell key={y.key} fill={y.key === key ? '#FF7A00' : '#FFFFFF'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <section aria-labelledby="price-heading">
        <SectionHeading id="price-heading" title="Bill price changes" />
        {subChanges.length === 0 ? (
          <p className="rounded-md border-2 border-dashed border-ink/30 px-4 py-3.5 text-sm text-ink/60">
            None of your recurring bills have changed price.
          </p>
        ) : (
          <Card padding="none" className="divide-y-2 divide-rule">
            {subChanges.map((c) => (
              <div key={c.recurring.id} className="flex items-center gap-3 px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.recurring.name}</p>
                  <p className="tnum font-mono text-sm text-ink/60">
                    {figure(c.from)} → {figure(c.to)}
                  </p>
                </div>
                <span className={`flex items-center gap-1 text-sm font-bold ${c.deltaPct > 0 ? 'text-alert' : 'text-cash'}`}>
                  {c.deltaPct > 0 ? (
                    <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown className="h-4 w-4" strokeWidth={2.5} />
                  )}
                  {signedPct(c.deltaPct)}
                </span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  )
}

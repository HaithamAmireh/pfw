import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { useMonthParam } from '@/lib/useMonthParam'
import {
  categoryBreakdown,
  dailyTrend,
  groupSplit,
  subscriptionChanges,
  trailingTrend,
} from '@/lib/analytics'
import { getCategory } from '@/lib/categories'
import { money, moneyAxis, signedPct } from '@/lib/format'
import { monthKey } from '@/lib/date'
import { Card, EmptyState, SectionHeading } from '@/components/ui'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { BrutTooltip } from '@/components/ChartTooltip'
import { BarChart3 } from 'lucide-react'

export default function Analytics() {
  const [key, setKey] = useMonthParam()
  const expenses = useWallet((s) => s.expenses)
  const recurring = useWallet((s) => s.recurring)

  const breakdown = useMemo(() => categoryBreakdown(expenses, key), [expenses, key])
  const trend = useMemo(
    () => dailyTrend(expenses, key, key === monthKey() ? new Date().getDate() : undefined),
    [expenses, key],
  )
  const groups = useMemo(() => groupSplit(expenses, key), [expenses, key])
  const yearly = useMemo(() => trailingTrend(expenses, 12, key), [expenses, key])
  const subChanges = useMemo(() => subscriptionChanges(recurring), [recurring])

  const hasData = breakdown.length > 0

  const barData = breakdown.map((b) => ({
    name: getCategory(b.category).label,
    value: b.total,
    hex: getCategory(b.category).hex,
  }))

  const donutData = groups.filter((g) => g.total > 0)
  const donutColors: Record<string, string> = {
    Essentials: '#3D5AFE',
    Subscriptions: '#8338EC',
    Discretionary: '#FF9F1C',
  }

  const yearlyData = yearly.map((y) => ({ name: y.label, value: y.total }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <MonthSwitcher value={key} onChange={setKey} />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="h-10 w-10" strokeWidth={1.75} />}
          title="No spending to analyze yet"
          message="Log a few expenses this month and your charts will show up here."
        />
      ) : (
        <>
          <div>
            <SectionHeading title="Spending by category" />
            <Card padding="md">
              <ResponsiveContainer width="100%" height={Math.max(200, barData.length * 44)}>
                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#15130F" strokeOpacity={0.12} horizontal={false} />
                  <XAxis type="number" tickCount={4} tickFormatter={moneyAxis} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#15130F' }} axisLine={{ stroke: '#15130F' }} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700, fill: '#15130F' }}
                    axisLine={{ stroke: '#15130F' }}
                    tickLine={false}
                  />
                  <Tooltip content={<BrutTooltip />} cursor={{ fill: '#15130F', fillOpacity: 0.06 }} />
                  <Bar dataKey="value" name="Spent" radius={0}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.hex} stroke="#15130F" strokeWidth={2} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div>
            <SectionHeading title="Daily spending trend" />
            <Card padding="md">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#15130F" strokeOpacity={0.12} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#15130F' }}
                    axisLine={{ stroke: '#15130F' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={16}
                  />
                  <YAxis
                    width={48}
                    tickFormatter={moneyAxis}
                    tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#15130F' }}
                    axisLine={{ stroke: '#15130F' }}
                    tickLine={false}
                  />
                  <Tooltip content={<BrutTooltip />} labelFormatter={(d) => `Day ${d}`} />
                  <Line
                    type="linear"
                    dataKey="cumulative"
                    name="Cumulative"
                    stroke="#3D5AFE"
                    strokeWidth={3}
                    dot={{ r: 2.5, fill: '#3D5AFE', stroke: '#15130F', strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: '#FF7A00', stroke: '#15130F', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div>
            <SectionHeading title="Essentials vs. subscriptions vs. discretionary" />
            <Card padding="md" className="flex flex-col items-center gap-4 sm:flex-row">
              <ResponsiveContainer width="100%" height={200} className="max-w-[200px]">
                <PieChart>
                  <Pie
                    data={donutData.map((d) => ({ name: d.label, value: d.total }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    strokeWidth={2}
                    stroke="#15130F"
                  >
                    {donutData.map((d, i) => (
                      <Cell key={i} fill={donutColors[d.label]} />
                    ))}
                  </Pie>
                  <Tooltip content={<BrutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-1 flex-col gap-2 self-stretch">
                {donutData.map((d) => (
                  <div key={d.label} className="flex items-center justify-between gap-2 rounded border-2 border-ink px-3 py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 border border-ink" style={{ backgroundColor: donutColors[d.label] }} />
                      <span className="text-sm font-bold">{d.label}</span>
                    </div>
                    <span className="tnum text-sm font-bold">{money(d.total)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <SectionHeading title="Last 12 months" />
            <Card padding="md">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yearlyData} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#15130F" strokeOpacity={0.12} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#15130F' }} axisLine={{ stroke: '#15130F' }} tickLine={false} />
                  <YAxis width={48} tickFormatter={moneyAxis} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#15130F' }} axisLine={{ stroke: '#15130F' }} tickLine={false} />
                  <Tooltip content={<BrutTooltip />} cursor={{ fill: '#15130F', fillOpacity: 0.06 }} />
                  <Bar dataKey="value" name="Spent" fill="#00B86B" stroke="#15130F" strokeWidth={2} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      <div>
        <SectionHeading title="Subscription price changes" />
        {subChanges.length === 0 ? (
          <Card padding="md" className="text-sm font-bold text-ink/50">
            No price changes detected on your recurring bills.
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {subChanges.map((c) => (
              <Card key={c.recurring.id} padding="sm" className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-2 bg-volt">
                  <AlertTriangle className="h-4 w-4 text-ink" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold">{c.recurring.name}</p>
                  <p className="text-sm text-ink/60">
                    {money(c.from)} &rarr; {money(c.to)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold">
                  {c.deltaPct > 0 ? (
                    <TrendingUp className="h-4 w-4 text-alert" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-cash" strokeWidth={2.5} />
                  )}
                  <span className={c.deltaPct > 0 ? 'text-alert' : 'text-cash'}>{signedPct(c.deltaPct)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


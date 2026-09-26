import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, ChevronRight, CircleHelp, Flame, PiggyBank, Repeat, ShoppingCart, Trophy } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { useMonthParam } from '@/lib/useMonthParam'
import {
  biggestCategory,
  biggestExpense,
  categoryBreakdown,
  monthOverMonth,
  recurringMonthlyTotal,
  savingsRate,
  totalForMonth,
} from '@/lib/analytics'
import { getCategory } from '@/lib/categories'
import { CategoryIcon } from '@/lib/icons'
import { money, signedPct } from '@/lib/format'
import { Badge, Card, EmptyState, ProgressBar, SectionHeading, StatTile } from '@/components/ui'
import { MonthSwitcher } from '@/components/MonthSwitcher'

export default function Dashboard() {
  const [key, setKey] = useMonthParam()
  const expenses = useWallet((s) => s.expenses)
  const recurring = useWallet((s) => s.recurring)
  const income = useWallet((s) => s.settings.monthlyIncome)

  const spent = useMemo(() => totalForMonth(expenses, key), [expenses, key])
  const remaining = income - spent
  const comparison = useMemo(() => monthOverMonth(expenses, key), [expenses, key])
  const breakdown = useMemo(() => categoryBreakdown(expenses, key), [expenses, key])
  const topExpense = useMemo(() => biggestExpense(expenses, key), [expenses, key])
  const topCategory = useMemo(() => biggestCategory(expenses, key), [expenses, key])
  const rate = useMemo(() => savingsRate(income, expenses, key), [income, expenses, key])
  const recurringTotal = useMemo(() => recurringMonthlyTotal(recurring), [recurring])

  const spentPct = income > 0 ? Math.min(100, (spent / income) * 100) : 0
  const overBudget = spent > income

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <MonthSwitcher value={key} onChange={setKey} />
      </div>

      <Card padding="lg" shadow={overBudget ? 'alert' : 'ink'} className="relative overflow-hidden">
        <p className="text-sm font-bold text-ink/55">Spent this month</p>
        <div className="mt-1 flex items-baseline gap-3">
          <span className="tnum font-display text-5xl font-bold leading-none">{money(spent)}</span>
          <span className="text-sm font-bold text-ink/45">of {money(income)}</span>
        </div>
        <ProgressBar pct={spentPct} state={overBudget ? 'over' : spentPct > 85 ? 'warning' : 'ok'} className="mt-4" />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-ink/55">
              {remaining >= 0 ? 'Remaining' : 'Over by'}
            </p>
            <p className={`tnum font-display text-xl font-bold ${remaining >= 0 ? 'text-cash' : 'text-alert'}`}>
              {money(Math.abs(remaining))}
            </p>
          </div>
          {comparison.deltaPct !== null && (
            <div className="flex items-center gap-1.5 rounded border-2 border-ink px-2.5 py-1">
              {comparison.deltaAmount >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-alert" strokeWidth={3} />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-cash" strokeWidth={3} />
              )}
              <span className="text-sm font-bold">
                {signedPct(comparison.deltaPct)} vs last month
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card padding="md">
          <StatTile
            label="Savings rate"
            value={`${rate >= 0 ? rate.toFixed(0) : rate.toFixed(0)}%`}
            tone={rate >= 0 ? 'cash' : 'alert'}
            sub={rate >= 20 ? 'Healthy' : rate >= 0 ? 'Tight' : 'Overspent'}
          />
        </Card>
        <Link to="/recurring">
          <Card padding="md" className="h-full transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            <div className="flex items-start justify-between">
              <StatTile label="Recurring" value={money(recurringTotal)} sub="per month" />
              <Repeat className="h-4 w-4 text-ink/40" strokeWidth={2.5} />
            </div>
          </Card>
        </Link>
      </div>

      {(topExpense || topCategory) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {topExpense && (
            <Card padding="md" className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-3 bg-volt shadow-brut-sm">
                <Flame className="h-5 w-5 text-ink" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink/55">Biggest expense</p>
                <p className="truncate font-display font-bold">{topExpense.note || getCategory(topExpense.category).label}</p>
                <p className="tnum text-sm font-bold text-ink/70">{money(topExpense.amount)}</p>
              </div>
            </Card>
          )}
          {topCategory && (
            <Card padding="md" className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-3 shadow-brut-sm"
                style={{ backgroundColor: getCategory(topCategory.category).hex }}
              >
                <Trophy className="h-5 w-5 text-ink" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink/55">Biggest category</p>
                <p className="truncate font-display font-bold">{getCategory(topCategory.category).label}</p>
                <p className="tnum text-sm font-bold text-ink/70">{money(topCategory.total)}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      <div>
        <SectionHeading
          title="By category"
          action={
            <Link to="/analytics" className="text-sm font-bold text-ink/55 underline underline-offset-2">
              See analytics
            </Link>
          }
        />
        {breakdown.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="h-10 w-10" strokeWidth={1.75} />}
            title="Nothing logged yet this month"
            message="Add your first expense to see where your money’s going."
            action={
              <Link to="/add">
                <span className="inline-flex items-center rounded border-3 bg-volt px-4 py-2 font-display font-bold shadow-brut-sm">
                  Add an expense
                </span>
              </Link>
            }
          />
        ) : (
          <Card padding="sm" className="divide-y-2 divide-ink/10">
            {breakdown.map((b) => {
              const cat = getCategory(b.category)
              const pctOfSpent = spent > 0 ? (b.total / spent) * 100 : 0
              return (
                <div key={b.category} className="flex items-center gap-3 px-1 py-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-2"
                    style={{ backgroundColor: cat.hex }}
                  >
                    <CategoryIcon name={cat.icon} className={`h-[18px] w-[18px] ${cat.textOn === 'paper' ? 'text-paper' : 'text-ink'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-display font-bold">{cat.label}</span>
                      <span className="tnum shrink-0 font-display font-bold">{money(b.total)}</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-canvas">
                      <div
                        className="h-full"
                        style={{ width: `${pctOfSpent}%`, backgroundColor: cat.hex }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </Card>
        )}
      </div>

      <Link to="/afford">
        <Card padding="md" className="flex items-center gap-3 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-3 bg-volt shadow-brut-sm">
            <CircleHelp className="h-5 w-5 text-ink" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold">Can I afford it?</p>
            <p className="truncate text-sm text-ink/55">Check a purchase against the rest of this month</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-ink/40" strokeWidth={2.5} />
        </Card>
      </Link>

      <div className="flex gap-3">
        <Link to="/shopping" className="flex-1">
          <Card padding="md" className="flex items-center justify-between transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            <span className="flex items-center gap-2 font-display font-bold">
              <ShoppingCart className="h-4 w-4" strokeWidth={2.5} />
              Shopping list
            </span>
            <Badge>Manage</Badge>
          </Card>
        </Link>
        <Link to="/budgets" className="flex-1">
          <Card padding="md" className="flex items-center justify-between transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
            <span className="font-display font-bold">Budgets &amp; goals</span>
            <Badge>Manage</Badge>
          </Card>
        </Link>
      </div>
    </div>
  )
}

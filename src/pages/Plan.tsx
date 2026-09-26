import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, CircleHelp } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { budgetProgress, recurringMonthlyTotal } from '@/lib/analytics'
import { monthKey, monthLabel, shiftMonthKey } from '@/lib/date'
import { figure, money } from '@/lib/format'
import { Card, Ledger, LedgerRow, PageHeader, SectionHeading, Stamp } from '@/components/ui'

export default function Plan() {
  const expenses = useWallet((s) => s.expenses)
  const recurring = useWallet((s) => s.recurring)
  const income = useWallet((s) => s.settings.monthlyIncome)
  const budgets = useWallet((s) => s.settings.budgets)
  const goals = useWallet((s) => s.settings.savingsGoals)

  const key = monthKey()
  const nextKey = shiftMonthKey(key, 1)
  const active = recurring.filter((r) => r.active)
  const recurringTotal = recurringMonthlyTotal(recurring)
  const progress = useMemo(() => budgetProgress(expenses, budgets, key), [expenses, budgets, key])
  const over = progress.filter((p) => p.state === 'over').length
  const saved = goals.reduce((s, g) => s + g.current, 0)
  const free = income - recurringTotal

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Plan" sub="Decide before you spend" />

      <Link to="/afford" className="block">
        <Card
          shadow="ink"
          padding="lg"
          className="flex items-center gap-4 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-3 bg-volt">
            <CircleHelp className="h-6 w-6" strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-semiwide block font-display text-xl font-extrabold tracking-[-0.01em]">Can I afford it?</span>
            <span className="block text-sm font-medium text-ink/60">Pencil in a purchase and see the month end</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-ink/40" strokeWidth={2.5} />
        </Card>
      </Link>

      <nav aria-label="Planning tools" className="flex flex-col divide-y-2 divide-rule rounded-md border-2 bg-paper">
        <PlanRow
          to="/budgets"
          title="Budgets"
          detail={budgets.length === 0 ? 'None set yet' : `${budgets.length} set this month`}
          stamp={over > 0 ? <Stamp tone="red">{over} over</Stamp> : undefined}
        />
        <PlanRow
          to="/budgets?focus=goals"
          title="Savings goals"
          detail={goals.length === 0 ? 'None yet' : `${money(saved)} saved across ${goals.length}`}
        />
        <PlanRow
          to="/recurring"
          title="Recurring bills"
          detail={active.length === 0 ? 'None yet' : `${money(recurringTotal)} a month · ${active.length} active`}
        />
      </nav>

      {income > 0 && (
        <section aria-labelledby="next-heading">
          <SectionHeading id="next-heading" title={`${monthLabel(nextKey).split(' ')[0]}’s page, so far`} />
          <Ledger caption={`${monthLabel(nextKey)} forecast`}>
            <LedgerRow day="1" title="Income" sub="Brought forward" balance={income} muted />
            {active.map((r, i) => (
              <LedgerRow
                key={r.id}
                day="1"
                title={r.name}
                category={r.category}
                sub="Recurring"
                debit={r.amount}
                balance={income - active.slice(0, i + 1).reduce((s, x) => s + x.amount, 0)}
              />
            ))}
          </Ledger>
          <p className="mt-2.5 text-sm text-ink/60">
            <b className="tnum text-ink">{figure(free)} JD</b> is free for everyday spending and saving once your bills go out.
          </p>
        </section>
      )}
    </div>
  )
}

function PlanRow({ to, title, detail, stamp }: { to: string; title: string; detail: string; stamp?: React.ReactNode }) {
  return (
    <Link to={to} className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas/60">
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="tnum block truncate text-sm font-medium text-ink/60">{detail}</span>
      </span>
      {stamp}
      <ChevronRight className="h-5 w-5 shrink-0 text-ink/40" strokeWidth={2.5} />
    </Link>
  )
}

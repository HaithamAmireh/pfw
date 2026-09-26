import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eraser } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { useMonthParam } from '@/lib/useMonthParam'
import {
  affordability,
  budgetProgress,
  monthLedger,
  monthOutlook,
  monthOverMonth,
  type MonthOutlook,
} from '@/lib/analytics'
import { getCategory } from '@/lib/categories'
import { daysInMonthKey, monthKey, monthLabel } from '@/lib/date'
import { cleanAmountInput, figure, money, parseAmount, signedPct } from '@/lib/format'
import { format, parseISO } from 'date-fns'
import {
  Button,
  Card,
  EmptyState,
  Ledger,
  LedgerRow,
  PageHeader,
  ProgressBar,
  SectionHeading,
  Stamp,
  TextLink,
  cx,
} from '@/components/ui'
import { MonthSwitcher } from '@/components/MonthSwitcher'

const RECENT_ROWS = 6

const OUTLOOK_STAMP: Record<MonthOutlook, { label: string; tone: 'blue' | 'red' | 'green' }> = {
  'on-track': { label: 'On track', tone: 'green' },
  tight: { label: 'Tight', tone: 'blue' },
  overdrawn: { label: 'Overdrawn', tone: 'red' },
}

export default function Dashboard() {
  const [key, setKey] = useMonthParam()
  const expenses = useWallet((s) => s.expenses)
  const recurring = useWallet((s) => s.recurring)
  const income = useWallet((s) => s.settings.monthlyIncome)
  const budgets = useWallet((s) => s.settings.budgets)

  const isCurrentMonth = key === monthKey()
  const today = new Date().getDate()
  const daysLeft = daysInMonthKey(key) - today

  const [draftPrice, setDraftPrice] = useState('')
  const price = isCurrentMonth ? parseAmount(draftPrice) : null

  const ledger = useMemo(() => monthLedger(expenses, income, key), [expenses, income, key])
  const spent = income - (ledger.at(-1)?.balance ?? income)
  const balance = income - spent

  const projection = useMemo(
    () =>
      isCurrentMonth
        ? affordability({ price: price ?? 0, category: 'other', income, expenses, recurring, budgets, key, today })
        : null,
    [isCurrentMonth, price, income, expenses, recurring, budgets, key, today],
  )
  const outlook = projection ? monthOutlook(projection.projectedLeftover, income) : null

  const comparison = useMemo(
    () => monthOverMonth(expenses, key, isCurrentMonth ? today : undefined),
    [expenses, key, isCurrentMonth, today],
  )

  const attention = useMemo(
    () => budgetProgress(expenses, budgets, key).filter((b) => b.state !== 'ok'),
    [expenses, budgets, key],
  )

  const shown = ledger.slice(-RECENT_ROWS)
  const hidden = ledger.length - shown.length
  const broughtForward = hidden > 0 ? ledger[hidden - 1].balance : income

  const monthName = monthLabel(key).split(' ')[0]

  if (income <= 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title={monthName} action={<MonthSwitcher value={key} onChange={setKey} />} />
        <EmptyState
          title="Start your passbook with your income"
          message="Ledger brings your monthly take-home pay forward on the 1st, then every expense lowers the balance."
          action={
            <Link
              to="/more"
              className="inline-flex min-h-11 items-center rounded-md border-3 bg-volt px-4 font-display font-bold shadow-brut-sm"
            >
              Set monthly income
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={monthName}
        sub={isCurrentMonth ? `${daysLeft === 0 ? 'Last day' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`} of the month` : 'Closed month'}
        action={<MonthSwitcher value={key} onChange={setKey} />}
      />

      <Card shadow={outlook === 'overdrawn' ? 'alert' : 'ink'} padding="lg">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink/60">{isCurrentMonth ? 'Balance today' : 'Closing balance'}</p>
            <p className={cx('font-semiwide tnum mt-1 font-display text-4xl font-extrabold leading-none tracking-[-0.03em] min-[380px]:text-[44px]', balance < 0 && 'text-alert')}>
              {balance < 0 && '−'}
              {figure(Math.abs(balance))}
              <span className="ml-1.5 align-baseline text-base font-bold tracking-normal text-ink/60">JD</span>
            </p>
          </div>
          {outlook && (
            <Stamp key={outlook} tone={OUTLOOK_STAMP[outlook].tone} className="mt-1">
              {OUTLOOK_STAMP[outlook].label}
            </Stamp>
          )}
        </div>

        <ProgressBar
          pct={income > 0 ? (spent / income) * 100 : 0}
          state={spent > income ? 'over' : 'ink'}
          label="Share of income spent"
          className="mt-4"
        />
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm font-semibold text-ink/60">
          <span>
            Spent <b className="tnum text-ink">{figure(spent)}</b> of {figure(income)}
          </span>
          {projection && (
            <span>
              Month end ≈ <b className={cx('tnum', projection.projectedLeftover < 0 ? 'text-alert' : 'text-ink')}>{money(projection.projectedLeftover)}</b>
            </span>
          )}
        </div>
        {comparison.deltaPct !== null && (
          <p className="mt-3 border-t-2 border-rule pt-3 text-sm font-semibold text-ink/60">
            <span className={cx('tnum font-bold', comparison.deltaAmount > 0 ? 'text-alert' : 'text-cash')}>
              {signedPct(comparison.deltaPct)}
            </span>{' '}
            spending vs {isCurrentMonth ? 'this time last month' : 'last month'}
          </p>
        )}
      </Card>

      {isCurrentMonth && (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex items-center gap-2 rounded-md border-3 bg-volt px-3.5 py-2.5"
        >
          <label htmlFor="pencil-price" className="font-display text-base font-bold">
            Can I afford
          </label>
          <span className="flex min-w-0 flex-1 items-center rounded-md border-2 bg-paper pl-2.5 focus-within:ring-2 focus-within:ring-ink">
            <span aria-hidden="true" className="text-sm font-bold text-ink/60">
              JD
            </span>
            <input
              id="pencil-price"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={draftPrice}
              onChange={(e) => setDraftPrice(cleanAmountInput(e.target.value))}
              className="tnum min-h-10 w-full min-w-0 bg-transparent px-1.5 font-mono text-base font-semibold outline-none placeholder:text-ink/40"
            />
          </span>
          <span aria-hidden="true" className="font-display text-lg font-bold">
            ?
          </span>
        </form>
      )}

      <section aria-labelledby="page-heading">
        <SectionHeading id="page-heading" title="This month’s page" action={<TextLink to={`/history?month=${key}`}>Full passbook</TextLink>} />
        <Ledger caption={`${monthLabel(key)} ledger`}>
          <LedgerRow
            day={hidden > 0 ? '' : '1'}
            title={hidden > 0 ? 'Brought forward' : 'Income'}
            sub={hidden > 0 ? `${hidden} earlier ${hidden === 1 ? 'entry' : 'entries'}` : 'Brought forward'}
            balance={broughtForward}
            muted
          />
          {shown.map(({ expense: e, balance: b }) => (
            <LedgerRow
              key={e.id}
              to={`/add/${e.id}`}
              day={format(parseISO(e.date), 'd')}
              title={e.note || getCategory(e.category).label}
              category={e.category}
              sub={e.isRecurring ? 'Recurring' : undefined}
              debit={e.amount}
              balance={b}
            />
          ))}
          {price !== null && projection && (
            <LedgerRow day="—" title="Pencilled in" debit={price} balance={balance - price} pencil />
          )}
        </Ledger>
        {ledger.length === 0 && price === null && (
          <p className="mt-2.5 text-sm text-ink/60">
            Nothing written on this page yet.{' '}
            {isCurrentMonth && (
              <Link to="/add" className="font-bold text-ink underline decoration-2 underline-offset-4">
                Log your first expense
              </Link>
            )}
          </p>
        )}
      </section>

      {price !== null && projection && <PencilVerdict price={price} result={projection} onRubOut={() => setDraftPrice('')} />}

      {attention.length > 0 && (
        <section aria-labelledby="attention-heading">
          <SectionHeading id="attention-heading" title="Needs attention" action={<TextLink to={`/budgets?month=${key}`}>Budgets</TextLink>} />
          <div className="flex flex-col divide-y-2 divide-rule rounded-md border-2 bg-paper">
            {attention.map((b) => (
              <Link
                key={b.category}
                to={`/budgets?month=${key}`}
                className="flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-canvas/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{b.label}</p>
                  <p className="tnum text-sm font-semibold text-ink/60">
                    {figure(b.spent)} of {figure(b.budget)}
                  </p>
                </div>
                <Stamp tone={b.state === 'over' ? 'red' : 'blue'}>{b.state === 'over' ? 'Over' : 'Close'}</Stamp>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function PencilVerdict({
  price,
  result,
  onRubOut,
}: {
  price: number
  result: ReturnType<typeof affordability>
  onRubOut: () => void
}) {
  const stamp =
    result.verdict === 'yes'
      ? { label: 'Go ahead', tone: 'green' as const }
      : result.verdict === 'tight'
        ? { label: 'Tight', tone: 'blue' as const }
        : { label: 'Wait', tone: 'red' as const }

  const message =
    result.verdict === 'no'
      ? `At your usual pace you’d end the month ${money(Math.abs(result.leftoverAfter))} short.`
      : `You’d end the month around ${money(result.leftoverAfter)} and save ${result.savingsRateAfter.toFixed(0)}% of your income.`

  return (
    <Card padding="md" className="flex flex-col gap-3 border-dashed border-pencil">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] leading-snug">{message}</p>
        <Stamp key={result.verdict} tone={stamp.tone}>
          {stamp.label}
        </Stamp>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link
          to={`/add?amount=${price}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border-3 bg-volt px-4 font-display font-bold shadow-brut-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          I bought it
        </Link>
        <Link
          to={`/afford?price=${price}`}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border-3 bg-paper px-4 font-display font-bold shadow-brut-sm transition-transform hover:bg-canvas active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Full check
          <ArrowRight className="h-4 w-4" strokeWidth={2.75} />
        </Link>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink/60">Checks the whole month. Full check also looks at category limits.</p>
        <Button variant="ghost" size="sm" onClick={onRubOut} className="shrink-0">
          <Eraser className="h-4 w-4" strokeWidth={2.5} />
          Rub out
        </Button>
      </div>
    </Card>
  )
}

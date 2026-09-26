import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eraser, ShoppingCart } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { HEALTHY_SAVINGS_RATE, affordability } from '@/lib/analytics'
import { monthKey } from '@/lib/date'
import { cleanAmountInput, figure, money, parseAmount } from '@/lib/format'
import { apiErrorMessage } from '@/lib/api'
import { CATEGORIES } from '@/lib/categories'
import type { CategoryId } from '@/lib/types'
import { Button, Card, EmptyState, Field, Input, Ledger, LedgerRow, PageHeader, SectionHeading, Stamp } from '@/components/ui'
import { CategoryPicker } from '@/components/CategoryPicker'

const VERDICT_STAMP = {
  yes: { label: 'Go ahead', tone: 'green' as const },
  tight: { label: 'Tight', tone: 'blue' as const },
  no: { label: 'Wait', tone: 'red' as const },
}

const VERDICT_TITLE = {
  yes: 'You can afford it',
  tight: 'You can, but it’s tight',
  no: 'Better to wait',
}

export default function Afford() {
  const [params] = useSearchParams()
  const expenses = useWallet((s) => s.expenses)
  const recurring = useWallet((s) => s.recurring)
  const income = useWallet((s) => s.settings.monthlyIncome)
  const budgets = useWallet((s) => s.settings.budgets)
  const addShoppingItem = useWallet((s) => s.addShoppingItem)
  const onList = useWallet((s) => s.shoppingItems)

  const initialCategory = params.get('category')
  const [name, setName] = useState(params.get('name') ?? '')
  const [price, setPrice] = useState(cleanAmountInput(params.get('price') ?? ''))
  const [category, setCategory] = useState<CategoryId>(
    CATEGORIES.some((c) => c.id === initialCategory) ? (initialCategory as CategoryId) : 'entertainment',
  )
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const parsedPrice = parseAmount(price)
  const trimmedName = name.trim()
  const alreadyListed = onList.some((i) => !i.checked && i.name.toLowerCase() === trimmedName.toLowerCase())

  const result = useMemo(
    () =>
      affordability({
        price: parsedPrice ?? 0,
        category,
        income,
        expenses,
        recurring,
        budgets,
        key: monthKey(),
        today: new Date().getDate(),
      }),
    [parsedPrice, category, income, expenses, recurring, budgets],
  )

  async function handleAddToList() {
    if (!trimmedName) return
    setAdding(true)
    setError('')
    try {
      await addShoppingItem(trimmedName)
    } catch (e) {
      setError(apiErrorMessage(e))
    } finally {
      setAdding(false)
    }
  }

  if (income <= 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader back title="Can I afford it?" />
        <EmptyState
          title="Set your monthly income first"
          message="The check compares a purchase against what’s left of your income this month."
          action={
            <Link to="/more" className="inline-flex min-h-11 items-center rounded-md border-3 bg-volt px-4 font-display font-bold shadow-brut-sm">
              Set monthly income
            </Link>
          }
        />
      </div>
    )
  }

  const afterSpent = result.income - result.spent
  const afterBills = afterSpent - result.pendingRecurring
  const stamp = VERDICT_STAMP[result.verdict]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader back title="Can I afford it?" sub="Pencil in a purchase and see how the month ends" />

      <div className="flex flex-col gap-4 rounded-md border-2 bg-paper p-4">
        <div className="grid grid-cols-[1fr_8rem] gap-3">
          <Field label="What is it?">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Controller" maxLength={80} autoComplete="off" />
          </Field>
          <Field label="Price">
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink/60">
                JD
              </span>
              <Input
                inputMode="decimal"
                autoFocus={!params.get('price')}
                value={price}
                onChange={(e) => setPrice(cleanAmountInput(e.target.value))}
                placeholder="0.00"
                className="pl-10 font-mono"
              />
            </div>
          </Field>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink">Category</span>
          <CategoryPicker value={category} onChange={setCategory} />
        </div>
      </div>

      {parsedPrice !== null && (
        <Card shadow={result.verdict === 'no' ? 'alert' : 'ink'} padding="lg" className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-semiwide font-display text-2xl font-extrabold leading-tight tracking-[-0.02em]">
              {VERDICT_TITLE[result.verdict]}
            </h2>
            <Stamp key={result.verdict} tone={stamp.tone} className="mt-1">
              {stamp.label}
            </Stamp>
          </div>
          <p className="text-[15px] leading-relaxed text-ink/80">{explain(result, parsedPrice)}</p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/add?amount=${parsedPrice}${trimmedName ? `&note=${encodeURIComponent(trimmedName)}` : ''}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md border-3 bg-volt px-3 font-display font-bold shadow-brut-sm transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              I bought it
            </Link>
            {trimmedName && result.verdict !== 'yes' ? (
              <Button variant="secondary" onClick={handleAddToList} disabled={adding || alreadyListed} className="px-3">
                <ShoppingCart className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                {alreadyListed ? 'On your list' : adding ? 'Adding…' : 'Add to list'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setPrice('')
                  setName('')
                }}
                className="px-3"
              >
                <Eraser className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                Rub out
              </Button>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm font-bold text-alert">
              {error}
            </p>
          )}
        </Card>
      )}

      <section aria-labelledby="math-heading">
        <SectionHeading id="math-heading" title="This month’s math" />
        <Ledger caption="How the month ends">
          <LedgerRow day="1" title="Income" sub="Brought forward" balance={result.income} muted />
          <LedgerRow title="Spent so far" debit={result.spent} balance={afterSpent} />
          {result.pendingRecurring > 0 && <LedgerRow title="Bills still to come" sub="Recurring" debit={result.pendingRecurring} balance={afterBills} />}
          <LedgerRow title="Spending ahead" sub={paceNote(result)} debit={result.expectedRemaining} balance={result.projectedLeftover} />
          {parsedPrice !== null && (
            <LedgerRow day="—" title={trimmedName || 'This purchase'} debit={parsedPrice} balance={result.leftoverAfter} pencil />
          )}
        </Ledger>
        <p className="mt-2.5 text-sm text-ink/60">
          {parsedPrice !== null ? (
            <>
              After buying it you’d save <b className="tnum text-ink">{result.savingsRateAfter.toFixed(0)}%</b> of your income this month.
            </>
          ) : (
            <>
              You’re on course to end the month with <b className="tnum text-ink">{money(result.projectedLeftover)}</b>.
            </>
          )}{' '}
          Ledger aims for at least {HEALTHY_SAVINGS_RATE}%.
        </p>
      </section>

      {parsedPrice !== null && result.budgetImpacts.length > 0 && (
        <section aria-labelledby="limits-heading">
          <SectionHeading id="limits-heading" title="Limits it touches" />
          <div className="flex flex-col divide-y-2 divide-rule rounded-md border-2 bg-paper">
            {result.budgetImpacts.map((b) => (
              <div key={b.label} className="flex items-center gap-3 px-3.5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{b.label}</p>
                  <p className="tnum text-sm font-medium text-ink/60">
                    <span className="font-mono font-semibold text-ink">{figure(b.after)}</span> of {figure(b.budget)} JD after buying
                  </p>
                </div>
                {b.over && <Stamp tone="red">{b.spent > b.budget ? 'Already over' : 'Goes over'}</Stamp>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function explain(r: ReturnType<typeof affordability>, price: number): string {
  if (r.verdict === 'no') {
    return `At your usual pace you’d end the month ${money(Math.abs(r.leftoverAfter))} short. Waiting until next month is the safer call.`
  }
  if (r.verdict === 'tight') {
    const reasons: string[] = []
    const pushedOver = r.budgetImpacts.filter((b) => b.over && b.spent <= b.budget).map((b) => b.label.toLowerCase())
    const alreadyOver = r.budgetImpacts.filter((b) => b.spent > b.budget).map((b) => b.label.toLowerCase())
    if (pushedOver.length > 0) reasons.push(`it takes you over your ${pushedOver.join(' and ')}`)
    if (alreadyOver.length > 0) reasons.push(`you’re already over your ${alreadyOver.join(' and ')}`)
    if (r.savingsRateAfter < HEALTHY_SAVINGS_RATE) reasons.push(`you’d only save ${r.savingsRateAfter.toFixed(0)}% of your income`)
    return `You won’t run out of money, but ${reasons.join(', and ')}.`
  }
  const share = r.projectedLeftover > 0 ? (price / r.projectedLeftover) * 100 : 0
  return `It uses ${share.toFixed(0)}% of what you’d have left, and you’d still save ${r.savingsRateAfter.toFixed(0)}% of your income.`
}

function paceNote(r: ReturnType<typeof affordability>): string {
  if (r.daysLeft === 0) return 'Last day of the month'
  if (r.paceSource === 'none') return 'No spending history yet'
  const basis = r.paceSource === 'history' ? 'your recent months' : 'this month so far'
  return `${figure(r.dailyPace)} a day × ${r.daysLeft} days, from ${basis}`
}

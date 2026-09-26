import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CircleCheck, CircleHelp, CircleX, ShoppingCart } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { HEALTHY_SAVINGS_RATE, affordability } from '@/lib/analytics'
import { monthKey } from '@/lib/date'
import { money } from '@/lib/format'
import { apiErrorMessage } from '@/lib/api'
import type { CategoryId } from '@/lib/types'
import { Button, Card, EmptyState, Field, Input, cx } from '@/components/ui'
import { CategoryPicker } from '@/components/CategoryPicker'

const VERDICTS = {
  yes: {
    title: 'Go for it',
    icon: CircleCheck,
    shadow: 'cash' as const,
    tone: 'text-cash',
  },
  tight: {
    title: 'You can, but it’s tight',
    icon: CircleHelp,
    shadow: 'ink' as const,
    tone: 'text-ink',
  },
  no: {
    title: 'Better wait',
    icon: CircleX,
    shadow: 'alert' as const,
    tone: 'text-alert',
  },
}

export default function Afford() {
  const navigate = useNavigate()
  const expenses = useWallet((s) => s.expenses)
  const recurring = useWallet((s) => s.recurring)
  const income = useWallet((s) => s.settings.monthlyIncome)
  const budgets = useWallet((s) => s.settings.budgets)
  const addShoppingItem = useWallet((s) => s.addShoppingItem)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<CategoryId>('entertainment')
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')

  const parsedPrice = Number(price)
  const valid = price.trim() !== '' && !Number.isNaN(parsedPrice) && parsedPrice > 0

  const result = useMemo(
    () =>
      affordability({
        price: valid ? parsedPrice : 0,
        category,
        income,
        expenses,
        recurring,
        budgets,
        key: monthKey(),
        today: new Date().getDate(),
      }),
    [valid, parsedPrice, category, income, expenses, recurring, budgets],
  )

  async function handleAddToList() {
    const trimmed = name.trim()
    if (!trimmed) return
    setAdding(true)
    setError('')
    try {
      await addShoppingItem(trimmed)
      setAdded(true)
    } catch (e) {
      setError(apiErrorMessage(e))
    } finally {
      setAdding(false)
    }
  }

  const verdict = VERDICTS[result.verdict]
  const VerdictIcon = verdict.icon

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="hit flex h-9 w-9 items-center justify-center rounded border-3 bg-paper shadow-brut-sm transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        </button>
        <h1 className="font-display text-2xl font-bold">Can I afford it?</h1>
      </div>

      {income <= 0 ? (
        <EmptyState
          title="Set your monthly income first"
          message="The check compares a purchase against what’s left of your income this month."
          action={
            <Link to="/settings">
              <span className="inline-flex items-center rounded border-3 bg-volt px-4 py-2 font-display font-bold shadow-brut-sm">
                Go to settings
              </span>
            </Link>
          }
        />
      ) : (
        <>
          <Card padding="md" className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="What is it?">
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setAdded(false)
                  }}
                  placeholder="Controller"
                  maxLength={80}
                />
              </Field>
              <Field label="Price">
                <Input
                  inputMode="decimal"
                  autoFocus
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                />
              </Field>
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-bold text-ink">Category</span>
              <CategoryPicker value={category} onChange={setCategory} />
            </div>
          </Card>

          {valid && (
            <Card padding="lg" shadow={verdict.shadow}>
              <div className="flex items-center gap-2">
                <VerdictIcon className={cx('h-6 w-6', verdict.tone)} strokeWidth={2.75} />
                <p className={cx('font-display text-2xl font-bold', verdict.tone)}>{verdict.title}</p>
              </div>
              <p className="mt-2 text-sm text-ink/70">{explain(result, parsedPrice)}</p>

              {name.trim() && result.verdict !== 'yes' && (
                <div className="mt-4">
                  <Button variant="secondary" size="sm" onClick={handleAddToList} disabled={adding || added}>
                    <ShoppingCart className="h-4 w-4" strokeWidth={2.5} />
                    {added ? 'Added to shopping list' : adding ? 'Adding…' : 'Save for later on shopping list'}
                  </Button>
                  {error && <p className="mt-2 text-sm font-bold text-alert">{error}</p>}
                </div>
              )}
            </Card>
          )}

          <Card padding="md">
            <h2 className="mb-2 font-display text-lg font-bold">This month’s math</h2>
            <dl className="divide-y-2 divide-ink/10">
              <Row label="Income" value={money(result.income)} />
              <Row label="Spent so far" value={`− ${money(result.spent)}`} />
              {result.pendingRecurring > 0 && (
                <Row label="Recurring bills still due" value={`− ${money(result.pendingRecurring)}`} />
              )}
              <Row
                label="Expected everyday spending"
                sub={paceNote(result)}
                value={`− ${money(result.expectedRemaining)}`}
              />
              <Row
                label="Projected left at month end"
                value={money(result.projectedLeftover)}
                strong
                tone={result.projectedLeftover >= 0 ? 'cash' : 'alert'}
              />
              {valid && (
                <>
                  <Row label="This purchase" value={`− ${money(parsedPrice)}`} />
                  <Row
                    label="Left after buying"
                    sub={`${result.savingsRateAfter.toFixed(0)}% of income saved`}
                    value={money(result.leftoverAfter)}
                    strong
                    tone={result.leftoverAfter >= 0 ? 'cash' : 'alert'}
                  />
                </>
              )}
            </dl>
          </Card>

          {valid && result.budgetImpacts.length > 0 && (
            <Card padding="md">
              <h2 className="mb-2 font-display text-lg font-bold">Budgets</h2>
              <dl className="divide-y-2 divide-ink/10">
                {result.budgetImpacts.map((b) => (
                  <Row
                    key={b.label}
                    label={b.label}
                    sub={`${money(b.spent)} spent so far`}
                    value={`${money(b.after)} / ${money(b.budget)}`}
                    tone={b.over ? 'alert' : 'ink'}
                  />
                ))}
              </dl>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function explain(r: ReturnType<typeof affordability>, price: number): string {
  if (r.verdict === 'no') {
    const short = Math.abs(r.leftoverAfter)
    return `At your usual pace you’d end the month ${money(short)} short. Waiting until next month is the safer call.`
  }
  if (r.verdict === 'tight') {
    const reasons: string[] = []
    const pushedOver = r.budgetImpacts.filter((b) => b.over && b.spent <= b.budget).map((b) => b.label.toLowerCase())
    const alreadyOver = r.budgetImpacts.filter((b) => b.spent > b.budget).map((b) => b.label.toLowerCase())
    if (pushedOver.length > 0) reasons.push(`it pushes you over your ${pushedOver.join(' and ')}`)
    if (alreadyOver.length > 0) reasons.push(`you’re already over your ${alreadyOver.join(' and ')}`)
    if (r.savingsRateAfter < HEALTHY_SAVINGS_RATE)
      reasons.push(`you’d only save ${r.savingsRateAfter.toFixed(0)}% of your income this month`)
    return `You won’t run out of money, but ${reasons.join(', and ')}.`
  }
  const share = r.projectedLeftover > 0 ? (price / r.projectedLeftover) * 100 : 0
  return `It uses ${share.toFixed(0)}% of what you’d have left, and you’d still save ${r.savingsRateAfter.toFixed(0)}% of your income.`
}

function paceNote(r: ReturnType<typeof affordability>): string {
  if (r.daysLeft === 0) return 'Last day of the month'
  if (r.paceSource === 'none') return 'No spending history yet'
  const basis = r.paceSource === 'history' ? 'recent months' : 'this month so far'
  return `${money(r.dailyPace)}/day × ${r.daysLeft} days left, based on ${basis}`
}

function Row({
  label,
  sub,
  value,
  strong,
  tone = 'ink',
}: {
  label: string
  sub?: string
  value: string
  strong?: boolean
  tone?: 'ink' | 'cash' | 'alert'
}) {
  const toneClass = { ink: 'text-ink', cash: 'text-cash', alert: 'text-alert' }[tone]
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <dt className={cx('text-sm', strong ? 'font-display font-bold' : 'font-bold text-ink/70')}>{label}</dt>
        {sub && <p className="text-xs text-ink/50">{sub}</p>}
      </div>
      <dd className={cx('tnum shrink-0 font-display font-bold', strong && 'text-lg', toneClass)}>{value}</dd>
    </div>
  )
}

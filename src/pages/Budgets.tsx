import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { useMonthParam } from '@/lib/useMonthParam'
import { budgetProgress, type BudgetProgress } from '@/lib/analytics'
import { CATEGORIES } from '@/lib/categories'
import { cleanAmountInput, figure, parseAmount, pct } from '@/lib/format'
import { apiErrorMessage } from '@/lib/api'
import {
  Button,
  CategoryChip,
  ConfirmDeleteButton,
  EmptyState,
  Field,
  Input,
  PageHeader,
  ProgressBar,
  SectionHeading,
  Select,
  Stamp,
} from '@/components/ui'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import type { CategoryId, SavingsGoal } from '@/lib/types'

export default function Budgets() {
  const [key, setKey] = useMonthParam()
  const [params] = useSearchParams()
  const expenses = useWallet((s) => s.expenses)
  const budgets = useWallet((s) => s.settings.budgets)
  const setBudget = useWallet((s) => s.setBudget)
  const removeBudget = useWallet((s) => s.removeBudget)
  const savingsGoals = useWallet((s) => s.settings.savingsGoals)
  const addSavingsGoal = useWallet((s) => s.addSavingsGoal)

  const progress = useMemo(() => budgetProgress(expenses, budgets, key), [expenses, budgets, key])
  const ordered = [...progress].sort((a, b) => (a.category === 'overall' ? -1 : b.category === 'overall' ? 1 : b.pct - a.pct))

  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [newBudgetCategory, setNewBudgetCategory] = useState<CategoryId | 'overall'>('overall')
  const [newBudgetAmount, setNewBudgetAmount] = useState('')
  const [budgetError, setBudgetError] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalError, setGoalError] = useState('')
  const [savingGoal, setSavingGoal] = useState(false)

  const hasOverall = budgets.some((b) => b.category === 'overall')
  const availableCategories = CATEGORIES.filter((c) => !budgets.some((b) => b.category === c.id))

  useEffect(() => {
    if (params.get('focus') === 'goals') document.getElementById('goals')?.scrollIntoView({ block: 'start' })
  }, [params])

  function openBudgetForm() {
    setNewBudgetCategory(hasOverall ? availableCategories[0]?.id ?? 'overall' : 'overall')
    setShowBudgetForm(true)
  }

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseAmount(newBudgetAmount)
    if (amount === null) {
      setBudgetError('Enter a monthly limit greater than 0')
      return
    }
    setSavingBudget(true)
    setBudgetError('')
    try {
      await setBudget({ category: newBudgetCategory, amount })
      setNewBudgetAmount('')
      setShowBudgetForm(false)
    } catch (e) {
      setBudgetError(apiErrorMessage(e))
    } finally {
      setSavingBudget(false)
    }
  }

  async function handleAddGoal(e: React.FormEvent) {
    e.preventDefault()
    const target = parseAmount(goalTarget)
    if (!goalName.trim() || target === null) {
      setGoalError('Give the goal a name and a target amount')
      return
    }
    setSavingGoal(true)
    setGoalError('')
    try {
      await addSavingsGoal({ name: goalName.trim(), target, current: 0 })
      setGoalName('')
      setGoalTarget('')
      setShowGoalForm(false)
    } catch (e) {
      setGoalError(apiErrorMessage(e))
    } finally {
      setSavingGoal(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <PageHeader back title="Budgets" action={<MonthSwitcher value={key} onChange={setKey} />} />

      <section aria-labelledby="budgets-heading" className="flex flex-col gap-3">
        <SectionHeading
          id="budgets-heading"
          title="Monthly limits"
          className="mb-0"
          action={
            !showBudgetForm &&
            (!hasOverall || availableCategories.length > 0) && (
              <Button size="sm" variant="secondary" onClick={openBudgetForm}>
                <Plus className="h-4 w-4" strokeWidth={2.75} />
                New limit
              </Button>
            )
          }
        />

        {showBudgetForm && (
          <form onSubmit={handleAddBudget} className="flex flex-col gap-3 rounded-md border-2 border-dashed border-ink/40 bg-paper p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="For">
                <Select value={newBudgetCategory} onChange={(e) => setNewBudgetCategory(e.target.value as CategoryId | 'overall')}>
                  {!hasOverall && <option value="overall">All spending</option>}
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="JD a month">
                <Input
                  inputMode="decimal"
                  value={newBudgetAmount}
                  onChange={(e) => setNewBudgetAmount(cleanAmountInput(e.target.value))}
                  placeholder="0.00"
                  className="font-mono"
                  autoFocus
                />
              </Field>
            </div>
            {budgetError && (
              <p role="alert" className="text-sm font-bold text-alert">
                {budgetError}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={savingBudget}>
                {savingBudget ? 'Saving…' : 'Save limit'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowBudgetForm(false)} disabled={savingBudget}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {ordered.length === 0 ? (
          !showBudgetForm && (
            <EmptyState
              title="No limits set"
              message="Set one for all spending, or cap a category like food or fun. Ledger stamps it when you get close."
            />
          )
        ) : (
          <div className="flex flex-col divide-y-2 divide-rule rounded-md border-2 bg-paper">
            {ordered.map((p) => (
              <BudgetRow key={p.category} progress={p} onRemove={() => removeBudget(p.category)} />
            ))}
          </div>
        )}
      </section>

      <section id="goals" aria-labelledby="goals-heading" className="flex scroll-mt-6 flex-col gap-3">
        <SectionHeading
          id="goals-heading"
          title="Savings goals"
          className="mb-0"
          action={
            !showGoalForm && (
              <Button size="sm" variant="secondary" onClick={() => setShowGoalForm(true)}>
                <Plus className="h-4 w-4" strokeWidth={2.75} />
                New goal
              </Button>
            )
          }
        />

        {showGoalForm && (
          <form onSubmit={handleAddGoal} className="flex flex-col gap-3 rounded-md border-2 border-dashed border-ink/40 bg-paper p-4">
            <div className="grid grid-cols-[1fr_7.5rem] gap-3">
              <Field label="Saving for">
                <Input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Emergency fund" autoFocus />
              </Field>
              <Field label="Target JD">
                <Input
                  inputMode="decimal"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(cleanAmountInput(e.target.value))}
                  placeholder="0.00"
                  className="font-mono"
                />
              </Field>
            </div>
            {goalError && (
              <p role="alert" className="text-sm font-bold text-alert">
                {goalError}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={savingGoal}>
                {savingGoal ? 'Creating…' : 'Create goal'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowGoalForm(false)} disabled={savingGoal}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {savingsGoals.length === 0
          ? !showGoalForm && (
              <EmptyState title="No savings goals yet" message="Name something you’re saving for and log money toward it as you put it aside." />
            )
          : savingsGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
      </section>
    </div>
  )
}

function BudgetRow({ progress, onRemove }: { progress: BudgetProgress; onRemove: () => void }) {
  const left = progress.budget - progress.spent
  return (
    <div className="flex flex-col gap-2 px-3.5 py-3.5">
      <div className="flex items-center gap-3">
        {progress.category !== 'overall' && <CategoryChip category={progress.category} />}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{progress.category === 'overall' ? 'All spending' : progress.label}</p>
          <p className="tnum text-sm font-medium text-ink/60">
            <span className="font-mono font-semibold text-ink">{figure(progress.spent)}</span> of {figure(progress.budget)} JD ·{' '}
            {left >= 0 ? `${figure(left)} left` : `${pct(progress.pct - 100)} over`}
          </p>
        </div>
        {progress.state !== 'ok' && (
          <Stamp tone={progress.state === 'over' ? 'red' : 'blue'}>{progress.state === 'over' ? 'Over' : 'Close'}</Stamp>
        )}
        <ConfirmDeleteButton label={`Remove ${progress.label}`} onConfirm={onRemove} />
      </div>
      <ProgressBar pct={progress.pct} state={progress.state} label={`${progress.label} used`} />
    </div>
  )
}

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const updateSavingsGoal = useWallet((s) => s.updateSavingsGoal)
  const deleteSavingsGoal = useWallet((s) => s.deleteSavingsGoal)
  const [amount, setAmount] = useState('')
  const [busy, setBusy] = useState(false)
  const value = parseAmount(amount)
  const p = goal.target > 0 ? (goal.current / goal.target) * 100 : 0

  async function move(direction: 1 | -1) {
    if (value === null) return
    setBusy(true)
    try {
      await updateSavingsGoal(goal.id, { current: Math.max(0, goal.current + direction * value) })
      setAmount('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border-2 bg-paper p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{goal.name}</p>
          <p className="tnum text-sm font-medium text-ink/60">
            <span className="font-mono font-semibold text-ink">{figure(goal.current)}</span> of {figure(goal.target)} JD
          </p>
        </div>
        <div className="flex items-center gap-2">
          {p >= 100 ? <Stamp tone="green">Reached</Stamp> : <span className="tnum text-sm font-bold">{pct(p)}</span>}
          <ConfirmDeleteButton label={`Delete ${goal.name}`} onConfirm={() => deleteSavingsGoal(goal.id)} />
        </div>
      </div>
      <ProgressBar pct={p} state="ok" label={`${goal.name} progress`} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          move(1)
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink/60">
            JD
          </span>
          <Input
            aria-label={`Amount for ${goal.name}`}
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(cleanAmountInput(e.target.value))}
            className="pl-10 font-mono"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={value === null || busy} className="min-h-11">
          Put in
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={value === null || busy} onClick={() => move(-1)} className="min-h-11">
          Take out
        </Button>
      </form>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, PiggyBank, Plus, Target } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { useMonthParam } from '@/lib/useMonthParam'
import { budgetProgress } from '@/lib/analytics'
import { CATEGORIES, getCategory } from '@/lib/categories'
import { CategoryIcon } from '@/lib/icons'
import { money, pct } from '@/lib/format'
import { apiErrorMessage } from '@/lib/api'
import { Button, Card, ConfirmDeleteButton, EmptyState, Field, Input, ProgressBar, Select } from '@/components/ui'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import type { CategoryId } from '@/lib/types'

export default function Budgets() {
  const navigate = useNavigate()
  const [key, setKey] = useMonthParam()
  const expenses = useWallet((s) => s.expenses)
  const budgets = useWallet((s) => s.settings.budgets)
  const setBudget = useWallet((s) => s.setBudget)
  const removeBudget = useWallet((s) => s.removeBudget)
  const savingsGoals = useWallet((s) => s.settings.savingsGoals)
  const addSavingsGoal = useWallet((s) => s.addSavingsGoal)
  const updateSavingsGoal = useWallet((s) => s.updateSavingsGoal)
  const deleteSavingsGoal = useWallet((s) => s.deleteSavingsGoal)

  const progress = useMemo(() => budgetProgress(expenses, budgets, key), [expenses, budgets, key])
  const overall = progress.find((p) => p.category === 'overall')
  const perCategory = progress.filter((p) => p.category !== 'overall')

  const [newBudgetCategory, setNewBudgetCategory] = useState<CategoryId | 'overall'>('overall')
  const [newBudgetAmount, setNewBudgetAmount] = useState('')
  const [showBudgetForm, setShowBudgetForm] = useState(false)

  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')

  const [budgetError, setBudgetError] = useState('')
  const [goalError, setGoalError] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)

  const availableCategories = CATEGORIES.filter(
    (c) => !budgets.some((b) => b.category === c.id),
  )

  async function handleAddBudget(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(newBudgetAmount)
    if (!amount || amount <= 0) return
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
    const target = Number(goalTarget)
    if (!goalName.trim() || !target || target <= 0) return
    setSavingGoal(true)
    setGoalError('')
    try {
      await addSavingsGoal({ name: goalName, target, current: 0 })
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="hit flex h-9 w-9 items-center justify-center rounded border-3 bg-paper shadow-brut-sm transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
          </button>
          <h1 className="font-display text-2xl font-bold">Budgets &amp; goals</h1>
        </div>
        <MonthSwitcher value={key} onChange={setKey} />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Budgets</h2>
          {!showBudgetForm && (
            <Button size="sm" variant="secondary" onClick={() => setShowBudgetForm(true)}>
              <Plus className="mr-1 h-4 w-4" strokeWidth={3} />
              New budget
            </Button>
          )}
        </div>

        {showBudgetForm && (
          <Card padding="md" shadow="none" className="border-3 border-dashed">
            <form onSubmit={handleAddBudget} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Scope">
                  <Select
                    value={newBudgetCategory}
                    onChange={(e) => setNewBudgetCategory(e.target.value as CategoryId | 'overall')}
                  >
                    {!budgets.some((b) => b.category === 'overall') && <option value="overall">Overall</option>}
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Monthly limit">
                  <Input
                    inputMode="decimal"
                    value={newBudgetAmount}
                    onChange={(e) => setNewBudgetAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00"
                  />
                </Field>
              </div>
              {budgetError && <p className="text-sm font-bold text-alert">{budgetError}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={savingBudget}>
                  {savingBudget ? 'Saving…' : 'Save budget'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowBudgetForm(false)} disabled={savingBudget}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {overall && <BudgetRow label="Overall" progress={overall} onRemove={() => removeBudget('overall')} />}

        {perCategory.length === 0 && !overall ? (
          <EmptyState
            icon={<Target className="h-10 w-10" strokeWidth={1.75} />}
            title="No budgets set"
            message="Set an overall limit or per-category caps to see progress here."
          />
        ) : (
          perCategory.map((p) => {
            const cat = getCategory(p.category as CategoryId)
            return (
              <BudgetRow
                key={p.category}
                label={cat.label}
                icon={<CategoryIcon name={cat.icon} className={`h-4 w-4 ${cat.textOn === 'paper' ? 'text-paper' : 'text-ink'}`} />}
                iconBg={cat.hex}
                progress={p}
                onRemove={() => removeBudget(p.category)}
              />
            )
          })
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Savings goals</h2>
          {!showGoalForm && (
            <Button size="sm" variant="secondary" onClick={() => setShowGoalForm(true)}>
              <Plus className="mr-1 h-4 w-4" strokeWidth={3} />
              New goal
            </Button>
          )}
        </div>

        {showGoalForm && (
          <Card padding="md" shadow="none" className="border-3 border-dashed">
            <form onSubmit={handleAddGoal} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Goal name">
                  <Input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="Emergency fund" />
                </Field>
                <Field label="Target">
                  <Input
                    inputMode="decimal"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00"
                  />
                </Field>
              </div>
              {goalError && <p className="text-sm font-bold text-alert">{goalError}</p>}
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={savingGoal}>
                  {savingGoal ? 'Creating…' : 'Create goal'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowGoalForm(false)} disabled={savingGoal}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {savingsGoals.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="h-10 w-10" strokeWidth={1.75} />}
            title="No savings goals yet"
            message="Set a target like an emergency fund and track progress toward it."
          />
        ) : (
          savingsGoals.map((g) => {
            const p = g.target > 0 ? (g.current / g.target) * 100 : 0
            return (
              <Card key={g.id} padding="md">
                <div className="flex items-center justify-between">
                  <p className="font-display font-bold">{g.name}</p>
                  <ConfirmDeleteButton label={`Delete ${g.name}`} onConfirm={() => deleteSavingsGoal(g.id)} />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="tnum text-sm font-bold text-ink/60">
                    {money(g.current)} of {money(g.target)}
                  </span>
                  <span className="tnum text-sm font-bold">{pct(Math.min(100, p))}</span>
                </div>
                <ProgressBar pct={p} state="ok" className="mt-2" />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => updateSavingsGoal(g.id, { current: g.current + 50 })}
                    className="rounded border-2 border-ink px-2.5 py-1 text-xs font-bold hover:bg-canvas"
                  >
                    +$50
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSavingsGoal(g.id, { current: Math.max(0, g.current - 50) })}
                    className="rounded border-2 border-ink px-2.5 py-1 text-xs font-bold hover:bg-canvas"
                  >
                    -$50
                  </button>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

function BudgetRow({
  label,
  icon,
  iconBg,
  progress,
  onRemove,
}: {
  label: string
  icon?: React.ReactNode
  iconBg?: string
  progress: { spent: number; budget: number; pct: number; state: 'ok' | 'warning' | 'over' }
  onRemove: () => void
}) {
  return (
    <Card padding="md" shadow={progress.state === 'over' ? 'alert' : 'ink'}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-2" style={{ backgroundColor: iconBg }}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display font-bold">{label}</p>
          <p className="tnum text-sm font-bold text-ink/60">
            {money(progress.spent)} of {money(progress.budget)}
          </p>
        </div>
        <ConfirmDeleteButton label={`Remove ${label} budget`} onConfirm={onRemove} />
      </div>
      <ProgressBar pct={progress.pct} state={progress.state} className="mt-2" />
      {progress.state === 'over' && (
        <p className="mt-1.5 text-xs font-bold text-alert">
          {pct(progress.pct - 100)} over budget
        </p>
      )}
      {progress.state === 'warning' && (
        <p className="mt-1.5 text-xs font-bold text-ink/60">Close to your limit</p>
      )}
    </Card>
  )
}


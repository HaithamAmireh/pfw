import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Repeat } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { CATEGORIES, getCategory } from '@/lib/categories'
import { CategoryIcon } from '@/lib/icons'
import { recurringMonthlyTotal } from '@/lib/analytics'
import { money } from '@/lib/format'
import type { CategoryId, PaymentMethod, RecurringExpense } from '@/lib/types'
import { Button, Card, ConfirmDeleteButton, EmptyState, Field, Input, Select, cx } from '@/components/ui'

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'cash', label: 'Cash' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'other', label: 'Other' },
]

export default function Recurring() {
  const navigate = useNavigate()
  const recurring = useWallet((s) => s.recurring)
  const toggleActive = useWallet((s) => s.toggleRecurringActive)
  const deleteRecurring = useWallet((s) => s.deleteRecurring)

  const [formId, setFormId] = useState<'new' | string | null>(null)

  const total = recurringMonthlyTotal(recurring)
  const sorted = [...recurring].sort((a, b) => a.dayOfMonth - b.dayOfMonth)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded border-3 bg-paper shadow-brut-sm transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={3} />
        </button>
        <h1 className="font-display text-2xl font-bold">Recurring bills</h1>
      </div>

      <Card padding="lg" shadow="cash" className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-ink/55">Total recurring cost</p>
          <p className="tnum font-display text-3xl font-bold">{money(total)}</p>
          <p className="text-sm text-ink/50">per month, active bills only</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded border-3 bg-cash shadow-brut-sm">
          <Repeat className="h-6 w-6 text-paper" strokeWidth={2.5} />
        </div>
      </Card>

      {formId ? (
        <RecurringForm
          key={formId}
          expense={formId === 'new' ? null : recurring.find((r) => r.id === formId) ?? null}
          onDone={() => setFormId(null)}
        />
      ) : (
        <Button onClick={() => setFormId('new')} full>
          <Plus className="mr-1.5 h-5 w-5" strokeWidth={3} />
          Add recurring bill
        </Button>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          icon={<Repeat className="h-10 w-10" strokeWidth={1.75} />}
          title="No recurring bills yet"
          message="Add rent, subscriptions, or utility bills so they auto-populate every month."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((r) => {
            const cat = getCategory(r.category)
            return (
              <Card key={r.id} padding="sm" className={cx('flex items-center gap-3', !r.active && 'opacity-50')}>
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-2"
                  style={{ backgroundColor: cat.hex }}
                >
                  <CategoryIcon name={cat.icon} className={`h-5 w-5 ${cat.textOn === 'paper' ? 'text-paper' : 'text-ink'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold">{r.name}</p>
                  <p className="text-xs text-ink/50">{cat.label}, bills on day {r.dayOfMonth}</p>
                </div>
                <span className="tnum shrink-0 font-display font-bold">{money(r.amount)}</span>

                <Switch
                  checked={r.active}
                  onChange={() => toggleActive(r.id)}
                  label={`${r.active ? 'Deactivate' : 'Activate'} ${r.name}`}
                />

                <button
                  type="button"
                  aria-label="Edit"
                  onClick={() => setFormId(r.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 border-ink/30 text-ink/60 hover:border-ink hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>

                <ConfirmDeleteButton label={`Delete ${r.name}`} onConfirm={() => deleteRecurring(r.id)} />
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cx(
        'relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors',
        checked ? 'bg-cash' : 'bg-canvas',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 h-4 w-4 rounded-full border-2 border-ink bg-paper transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

function RecurringForm({
  expense,
  onDone,
}: {
  expense: RecurringExpense | null
  onDone: () => void
}) {
  const addRecurring = useWallet((s) => s.addRecurring)
  const updateRecurring = useWallet((s) => s.updateRecurring)

  const [name, setName] = useState(expense?.name ?? '')
  const [category, setCategory] = useState<CategoryId>(expense?.category ?? 'subscription')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [dayOfMonth, setDayOfMonth] = useState(expense?.dayOfMonth ?? 1)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(expense?.paymentMethod ?? 'card')

  const parsedAmount = Number(amount)
  const valid = name.trim() !== '' && amount.trim() !== '' && !Number.isNaN(parsedAmount) && parsedAmount > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    if (expense) {
      updateRecurring(expense.id, { name, category, amount: parsedAmount, dayOfMonth, paymentMethod })
    } else {
      addRecurring({ name, category, amount: parsedAmount, dayOfMonth, paymentMethod, active: true })
    }
    onDone()
  }

  return (
    <Card padding="md" shadow="none" className="border-3 border-dashed">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rent" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount">
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
            />
          </Field>
          <Field label="Bills on day">
            <Input
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment">
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={!valid} className="flex-1">
            {expense ? 'Save changes' : 'Add bill'}
          </Button>
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

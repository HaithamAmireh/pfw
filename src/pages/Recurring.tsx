import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { CATEGORIES, PAYMENT_METHODS } from '@/lib/categories'
import { recurringMonthlyTotal } from '@/lib/analytics'
import { cleanAmountInput, figure, parseAmount } from '@/lib/format'
import type { CategoryId, PaymentMethod, RecurringExpense } from '@/lib/types'
import { apiErrorMessage } from '@/lib/api'
import {
  Button,
  Card,
  CategoryChip,
  ConfirmDeleteButton,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  cx,
} from '@/components/ui'

export default function Recurring() {
  const recurring = useWallet((s) => s.recurring)
  const toggleActive = useWallet((s) => s.toggleRecurringActive)
  const deleteRecurring = useWallet((s) => s.deleteRecurring)

  const [formId, setFormId] = useState<'new' | string | null>(null)

  const total = recurringMonthlyTotal(recurring)
  const activeCount = recurring.filter((r) => r.active).length
  const sorted = [...recurring].sort((a, b) => Number(b.active) - Number(a.active) || b.amount - a.amount)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader back title="Recurring bills" sub="Written into your passbook automatically each month" />

      <Card shadow="ink" padding="lg" className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-ink/60">Every month</p>
          <p className="font-semiwide tnum mt-1 font-display text-4xl font-extrabold leading-none tracking-[-0.03em]">
            {figure(total)}
            <span className="ml-1.5 text-base font-bold tracking-normal text-ink/60">JD</span>
          </p>
        </div>
        <p className="text-right text-sm font-semibold text-ink/60">
          {activeCount} active
          {recurring.length > activeCount && (
            <>
              <br />
              {recurring.length - activeCount} paused
            </>
          )}
        </p>
      </Card>

      {formId === 'new' ? (
        <RecurringForm expense={null} onDone={() => setFormId(null)} />
      ) : (
        <Button variant="secondary" onClick={() => setFormId('new')} full>
          <Plus className="h-5 w-5" strokeWidth={2.75} />
          Add a recurring bill
        </Button>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          title="No recurring bills yet"
          message="Add rent, subscriptions, or loan payments once. Ledger writes them in on the first day you open the app each month."
        />
      ) : (
        <div className="flex flex-col divide-y-2 divide-rule rounded-md border-2 bg-paper">
          {sorted.map((r) =>
            formId === r.id ? (
              <div key={r.id} className="p-3">
                <RecurringForm expense={r} onDone={() => setFormId(null)} />
              </div>
            ) : (
              <div key={r.id} className={cx('flex min-h-16 items-center gap-3 px-3.5 py-3', !r.active && 'bg-canvas/40')}>
                <CategoryChip category={r.category} />
                <div className={cx('min-w-0 flex-1', !r.active && 'opacity-60')}>
                  <p className="truncate font-bold">{r.name}</p>
                  <p className="truncate text-sm font-medium text-ink/60">
                    <span className="tnum font-mono font-semibold text-ink">{figure(r.amount)}</span> JD/mo
                    {r.active ? '' : ' · Paused'}
                  </p>
                </div>
                <Switch
                  checked={r.active}
                  onChange={() => toggleActive(r.id)}
                  label={`${r.active ? 'Pause' : 'Resume'} ${r.name}`}
                />
                <button
                  type="button"
                  aria-label={`Edit ${r.name}`}
                  onClick={() => setFormId(r.id)}
                  className="hit flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink/25 text-ink/60 hover:border-ink hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <ConfirmDeleteButton label={`Delete ${r.name}`} onConfirm={() => deleteRecurring(r.id)} />
              </div>
            ),
          )}
        </div>
      )}
    </div>
  )
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cx(
        'hit hit-lg flex h-7 w-12 shrink-0 items-center rounded-full border-2 p-0.5 transition-colors',
        checked ? 'justify-end bg-ink' : 'justify-start bg-canvas',
      )}
    >
      <span className={cx('h-5 w-5 rounded-full border-2 border-ink', checked ? 'bg-volt' : 'bg-paper')} />
    </button>
  )
}

function RecurringForm({ expense, onDone }: { expense: RecurringExpense | null; onDone: () => void }) {
  const addRecurring = useWallet((s) => s.addRecurring)
  const updateRecurring = useWallet((s) => s.updateRecurring)

  const [name, setName] = useState(expense?.name ?? '')
  const [category, setCategory] = useState<CategoryId>(expense?.category ?? 'subscription')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(expense?.paymentMethod ?? 'card')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const parsedAmount = parseAmount(amount)
  const valid = name.trim() !== '' && parsedAmount !== null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || parsedAmount === null) return
    setSaving(true)
    setError('')
    try {
      if (expense) {
        await updateRecurring(expense.id, { name: name.trim(), category, amount: parsedAmount, paymentMethod })
      } else {
        await addRecurring({ name: name.trim(), category, amount: parsedAmount, paymentMethod })
      }
      onDone()
    } catch (e) {
      setError(apiErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border-2 border-dashed border-ink/40 bg-paper p-4">
      <div className="grid grid-cols-[1fr_7.5rem] gap-3">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rent" autoFocus />
        </Field>
        <Field label="JD a month">
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(cleanAmountInput(e.target.value))}
            placeholder="0.00"
            className="font-mono"
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
        <Field label="Paid with">
          <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {error && (
        <p role="alert" className="text-sm font-bold text-alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={!valid || saving} className="flex-1">
          {saving ? 'Saving…' : expense ? 'Save changes' : 'Add bill'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

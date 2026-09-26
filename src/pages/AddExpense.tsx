import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Trash2, X } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { apiErrorMessage } from '@/lib/api'
import { monthKey, todayISO } from '@/lib/date'
import { totalForMonth } from '@/lib/analytics'
import { cleanAmountInput, figure, parseAmount } from '@/lib/format'
import type { CategoryId, PaymentMethod } from '@/lib/types'
import { Button, Field, IconButton, Input, Select } from '@/components/ui'
import { CategoryPicker } from '@/components/CategoryPicker'
import { PAYMENT_METHODS } from '@/lib/categories'

export default function AddExpense() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const expenses = useWallet((s) => s.expenses)
  const income = useWallet((s) => s.settings.monthlyIncome)
  const addExpense = useWallet((s) => s.addExpense)
  const updateExpense = useWallet((s) => s.updateExpense)
  const deleteExpense = useWallet((s) => s.deleteExpense)

  const existing = useMemo(() => expenses.find((e) => e.id === id), [expenses, id])
  const isEditing = Boolean(existing)

  const [amount, setAmount] = useState(existing ? String(existing.amount) : cleanAmountInput(params.get('amount') ?? ''))
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? 'food')
  const [note, setNote] = useState(existing?.note ?? params.get('note') ?? '')
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(existing?.paymentMethod ?? 'card')
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const parsedAmount = parseAmount(amount)

  // Live "balance after" for the month this entry lands in.
  const entryMonth = date.slice(0, 7)
  const balanceBefore = income - totalForMonth(expenses, entryMonth) + (existing && existing.date.startsWith(entryMonth) ? existing.amount : 0)
  const balanceAfter = parsedAmount !== null ? balanceBefore - parsedAmount : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (parsedAmount === null) {
      setError('Enter an amount greater than 0')
      return
    }
    setSaving(true)
    try {
      if (isEditing && existing) {
        await updateExpense(existing.id, { amount: parsedAmount, category, note: note.trim(), date, paymentMethod })
      } else {
        await addExpense({ amount: parsedAmount, category, note: note.trim(), date, paymentMethod })
      }
      navigate(-1)
    } catch (e) {
      setError(apiErrorMessage(e))
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existing) return
    setSaving(true)
    try {
      await deleteExpense(existing.id)
      navigate(-1)
    } catch (e) {
      setError(apiErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-wide font-display text-[26px] font-extrabold leading-none tracking-[-0.02em]">
          {isEditing ? 'Edit entry' : 'New entry'}
        </h1>
        <IconButton label="Close" onClick={() => navigate(-1)}>
          <X className="h-4 w-4" strokeWidth={2.75} />
        </IconButton>
      </div>

      <div className="rounded-md border-3 bg-volt px-4 pb-4 pt-3.5 shadow-brut">
        <label htmlFor="amount" className="block text-sm font-bold text-ink/80">
          Amount
        </label>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-2xl font-extrabold">JD</span>
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            autoFocus={!isEditing}
            placeholder="0.00"
            value={amount}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? 'amount-error' : 'amount-after'}
            onChange={(e) => {
              setError('')
              setAmount(cleanAmountInput(e.target.value))
            }}
            className="font-semiwide tnum w-full min-w-0 bg-transparent font-display text-5xl font-extrabold leading-none tracking-[-0.03em] text-ink outline-none placeholder:text-ink/35"
          />
        </div>
        {error ? (
          <p id="amount-error" role="alert" className="mt-2 text-sm font-bold text-ink">
            {error}
          </p>
        ) : (
          income > 0 && (
            <p id="amount-after" className="tnum mt-2 border-t-2 border-dashed border-ink/30 pt-2 font-mono text-sm font-medium text-ink/80">
              {balanceAfter !== null
                ? `${entryMonth === monthKey() ? 'Balance after' : 'That month’s balance after'}: ${figure(balanceAfter)} JD`
                : `${entryMonth === monthKey() ? 'Balance today' : 'That month’s balance'}: ${figure(balanceBefore)} JD`}
            </p>
          )
        )}
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-bold text-ink">Category</span>
        <CategoryPicker value={category} onChange={setCategory} />
      </div>

      <Field label="Note">
        <Input placeholder="What was it for?" value={note} onChange={(e) => setNote(e.target.value)} maxLength={80} autoComplete="off" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
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

      {isEditing && existing?.isRecurring && (
        <p className="rounded-md border-2 border-dashed border-ink/30 px-3.5 py-2.5 text-sm text-ink/70">
          Added automatically from a recurring bill. Editing it here changes this month only.
        </p>
      )}

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+84px)] z-10 -mx-1 bg-canvas/90 px-1 pb-1 pt-2 backdrop-blur-[2px] md:static md:bg-transparent md:p-0">
        <Button type="submit" size="lg" full disabled={parsedAmount === null || saving}>
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Write it in'}
        </Button>
      </div>

      {isEditing &&
        (confirmingDelete ? (
          <div className="flex gap-2">
            <Button type="button" variant="danger" onClick={handleDelete} disabled={saving} className="flex-1">
              {saving ? 'Deleting…' : 'Delete this entry'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)} disabled={saving}>
              Keep it
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(true)} className="self-center text-alert">
            <Trash2 className="h-4 w-4" strokeWidth={2.5} />
            Delete entry
          </Button>
        ))}
    </form>
  )
}

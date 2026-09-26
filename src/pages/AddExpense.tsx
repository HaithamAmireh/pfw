import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2, X } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { apiErrorMessage } from '@/lib/api'
import { todayISO } from '@/lib/date'
import type { CategoryId, PaymentMethod } from '@/lib/types'
import { Badge, Button, Field, Input, Select } from '@/components/ui'
import { CategoryPicker } from '@/components/CategoryPicker'
import { getCategory } from '@/lib/categories'

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'cash', label: 'Cash' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'cliq', label: 'CliQ' },
  { id: 'other', label: 'Other' },
]

export default function AddExpense() {
  const navigate = useNavigate()
  const { id } = useParams()
  const expenses = useWallet((s) => s.expenses)
  const addExpense = useWallet((s) => s.addExpense)
  const updateExpense = useWallet((s) => s.updateExpense)
  const deleteExpense = useWallet((s) => s.deleteExpense)

  const existing = useMemo(() => expenses.find((e) => e.id === id), [expenses, id])
  const isEditing = Boolean(existing)

  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? 'food')
  const [note, setNote] = useState(existing?.note ?? '')
  const [date, setDate] = useState(existing?.date ?? todayISO())
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(existing?.paymentMethod ?? 'card')
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const parsedAmount = Number(amount)
  const valid = amount.trim() !== '' && !Number.isNaN(parsedAmount) && parsedAmount > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) {
      setError('Enter an amount greater than 0')
      return
    }
    setSaving(true)
    try {
      if (isEditing && existing) {
        await updateExpense(existing.id, { amount: parsedAmount, category, note, date, paymentMethod })
      } else {
        await addExpense({ amount: parsedAmount, category, note, date, paymentMethod })
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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{isEditing ? 'Edit expense' : 'Add expense'}</h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Close"
          className="hit flex h-9 w-9 items-center justify-center rounded border-3 bg-paper shadow-brut-sm transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          <X className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>

      {isEditing && existing?.isRecurring && (
        <div className="flex items-center gap-2">
          <Badge hex={getCategory(existing.category).hex} textOn={getCategory(existing.category).textOn}>
            Linked to recurring bill
          </Badge>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded border-3 bg-volt px-5 py-6 text-center shadow-brut">
          <label htmlFor="amount" className="mb-1 block text-sm font-bold text-ink/70">
            Amount
          </label>
          <div className="flex items-center justify-center gap-1">
            <span className="font-display text-4xl font-bold">$</span>
            <input
              id="amount"
              inputMode="decimal"
              autoFocus
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setError('')
                setAmount(e.target.value.replace(/[^0-9.]/g, ''))
              }}
              className="tnum w-40 rounded bg-transparent text-center font-display text-5xl font-bold leading-none text-ink placeholder:text-ink/30"
            />
          </div>
          {error && <p className="mt-2 text-sm font-bold text-alert">{error}</p>}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink">Category</span>
          <CategoryPicker value={category} onChange={setCategory} />
        </div>

        <Field label="Note">
          <Input
            placeholder="What was it for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={80}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
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

        <Button type="submit" size="lg" full disabled={!valid || saving}>
          {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Save expense'}
        </Button>

        {isEditing && (
          confirmingDelete ? (
            <div className="flex gap-2">
              <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={saving} className="flex-1">
                {saving ? 'Deleting…' : 'Confirm delete'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)} disabled={saving}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmingDelete(true)} className="text-alert">
              <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
              Delete expense
            </Button>
          )
        )}
      </form>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Plus, ShoppingCart, Undo2 } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { todayISO } from '@/lib/date'
import { money } from '@/lib/format'
import type { CategoryId, PaymentMethod, ShoppingItem } from '@/lib/types'
import { apiErrorMessage } from '@/lib/api'
import { Button, Card, ConfirmDeleteButton, EmptyState, Field, Input, Select } from '@/components/ui'
import { CategoryPicker } from '@/components/CategoryPicker'

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'cash', label: 'Cash' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'cliq', label: 'CliQ' },
  { id: 'other', label: 'Other' },
]

export default function Shopping() {
  const navigate = useNavigate()
  const items = useWallet((s) => s.shoppingItems)
  const expenses = useWallet((s) => s.expenses)
  const addShoppingItem = useWallet((s) => s.addShoppingItem)
  const deleteShoppingItem = useWallet((s) => s.deleteShoppingItem)
  const uncheckShoppingItem = useWallet((s) => s.uncheckShoppingItem)

  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [checkingId, setCheckingId] = useState<string | null>(null)

  const pending = items.filter((i) => !i.checked)
  const bought = items.filter((i) => i.checked)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      await addShoppingItem(trimmed)
      setName('')
    } finally {
      setAdding(false)
    }
  }

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
        <h1 className="font-display text-2xl font-bold">Shopping list</h1>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add an item…"
          maxLength={80}
        />
        <Button type="submit" disabled={!name.trim() || adding}>
          <Plus className="h-5 w-5" strokeWidth={3} />
        </Button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-10 w-10" strokeWidth={1.75} />}
          title="Nothing on the list yet"
          message="Add items as you think of them, then check them off and log the price when you buy them."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {pending.map((item) =>
            checkingId === item.id ? (
              <CheckoutForm
                key={item.id}
                item={item}
                onDone={() => setCheckingId(null)}
                onCancel={() => setCheckingId(null)}
              />
            ) : (
              <Card key={item.id} padding="sm" className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`Check off ${item.name}`}
                  onClick={() => setCheckingId(item.id)}
                  className="hit flex h-8 w-8 shrink-0 items-center justify-center rounded border-3 border-ink bg-paper"
                />
                <p className="min-w-0 flex-1 truncate font-display font-bold">{item.name}</p>
                <ConfirmDeleteButton label={`Delete ${item.name}`} onConfirm={() => deleteShoppingItem(item.id)} />
              </Card>
            ),
          )}

          {bought.length > 0 && (
            <>
              <p className="mt-2 text-sm font-bold text-ink/50">Bought</p>
              {bought.map((item) => {
                const expense = expenses.find((e) => e.id === item.expenseId)
                return (
                  <Card key={item.id} padding="sm" className="flex items-center gap-3 opacity-60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border-3 border-ink bg-cash">
                      <Check className="h-4 w-4 text-paper" strokeWidth={3} />
                    </div>
                    <p className="min-w-0 flex-1 truncate font-display font-bold line-through">{item.name}</p>
                    {expense && <span className="tnum shrink-0 text-sm font-bold">{money(expense.amount)}</span>}
                    <button
                      type="button"
                      aria-label={`Undo ${item.name}`}
                      onClick={() => uncheckShoppingItem(item.id)}
                      className="hit flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 border-ink/30 text-ink/60 hover:border-ink hover:text-ink"
                    >
                      <Undo2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                    <ConfirmDeleteButton label={`Delete ${item.name}`} onConfirm={() => deleteShoppingItem(item.id)} />
                  </Card>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function CheckoutForm({
  item,
  onDone,
  onCancel,
}: {
  item: ShoppingItem
  onDone: () => void
  onCancel: () => void
}) {
  const checkShoppingItem = useWallet((s) => s.checkShoppingItem)

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<CategoryId>('food')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const parsedAmount = Number(amount)
  const valid = amount.trim() !== '' && !Number.isNaN(parsedAmount) && parsedAmount > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    setError('')
    try {
      await checkShoppingItem(item.id, { amount: parsedAmount, category, paymentMethod, date })
      onDone()
    } catch (e) {
      setError(apiErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <Card padding="md" shadow="cash" className="border-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <p className="font-display font-bold">{item.name}</p>
        <Field label="Price">
          <Input
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="0.00"
          />
        </Field>
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink">Category</span>
          <CategoryPicker value={category} onChange={setCategory} />
        </div>
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
        {error && <p className="text-sm font-bold text-alert">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={!valid || saving} className="flex-1">
            {saving ? 'Saving…' : 'Mark bought'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}

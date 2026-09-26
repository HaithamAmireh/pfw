import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, CircleHelp, Plus, Undo2 } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { todayISO } from '@/lib/date'
import { cleanAmountInput, figure, parseAmount } from '@/lib/format'
import { PAYMENT_METHODS } from '@/lib/categories'
import type { CategoryId, PaymentMethod, ShoppingItem } from '@/lib/types'
import { apiErrorMessage } from '@/lib/api'
import { Button, ConfirmDeleteButton, EmptyState, Field, Input, PageHeader, SectionHeading, Select } from '@/components/ui'
import { CategoryPicker } from '@/components/CategoryPicker'

export default function Shopping() {
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
    <div className="flex flex-col gap-6">
      <PageHeader back title="Shopping list" sub="Pencil things in. When you buy one, it’s inked into your passbook." />

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          aria-label="New item"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add an item"
          maxLength={80}
          autoComplete="off"
        />
        <Button type="submit" disabled={!name.trim() || adding} aria-label="Add item" className="w-12 shrink-0 px-0">
          <Plus className="h-5 w-5" strokeWidth={3} />
        </Button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing pencilled in"
          message="Add things as you think of them. Check one off when you buy it and log what it cost."
        />
      ) : (
        <>
          {pending.length > 0 && (
            <div className="flex flex-col divide-y-2 divide-dashed divide-pencil/40 rounded-md border-2 bg-paper">
              {pending.map((item) =>
                checkingId === item.id ? (
                  <CheckoutForm key={item.id} item={item} onDone={() => setCheckingId(null)} />
                ) : (
                  <div key={item.id} className="flex min-h-14 items-center gap-3 px-3.5 py-2.5">
                    <button
                      type="button"
                      aria-label={`Bought ${item.name}`}
                      onClick={() => setCheckingId(item.id)}
                      className="hit h-7 w-7 shrink-0 rounded-md border-2 border-ink bg-paper transition-colors hover:bg-canvas"
                    />
                    <p className="min-w-0 flex-1 truncate font-mono text-[15px] font-medium italic text-pencil">{item.name}</p>
                    <Link
                      to={`/afford?name=${encodeURIComponent(item.name)}`}
                      aria-label={`Can I afford ${item.name}?`}
                      className="hit flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink/25 text-ink/60 hover:border-ink hover:text-ink"
                    >
                      <CircleHelp className="h-4 w-4" strokeWidth={2.5} />
                    </Link>
                    <ConfirmDeleteButton label={`Delete ${item.name}`} onConfirm={() => deleteShoppingItem(item.id)} />
                  </div>
                ),
              )}
            </div>
          )}

          {bought.length > 0 && (
            <section aria-labelledby="bought-heading">
              <SectionHeading id="bought-heading" title="Bought" />
              <div className="flex flex-col divide-y-2 divide-rule rounded-md border-2 bg-paper">
                {bought.map((item) => {
                  const expense = expenses.find((e) => e.id === item.expenseId)
                  return (
                    <div key={item.id} className="flex min-h-14 items-center gap-3 px-3.5 py-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-ink">
                        <Check className="h-4 w-4 text-volt" strokeWidth={3} />
                      </span>
                      <p className="min-w-0 flex-1 truncate font-bold">{item.name}</p>
                      {expense && <span className="tnum shrink-0 font-mono text-sm font-semibold">{figure(expense.amount)} JD</span>}
                      <button
                        type="button"
                        aria-label={`Move ${item.name} back to the list`}
                        onClick={() => uncheckShoppingItem(item.id)}
                        className="hit flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-ink/25 text-ink/60 hover:border-ink hover:text-ink"
                      >
                        <Undo2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                      <ConfirmDeleteButton label={`Delete ${item.name}`} onConfirm={() => deleteShoppingItem(item.id)} />
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-ink/60">Moving an item back to the list also removes its expense.</p>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function CheckoutForm({ item, onDone }: { item: ShoppingItem; onDone: () => void }) {
  const checkShoppingItem = useWallet((s) => s.checkShoppingItem)

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<CategoryId>('food')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
  const [date, setDate] = useState(todayISO())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const parsed = parseAmount(amount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (parsed === null) return
    setSaving(true)
    setError('')
    try {
      await checkShoppingItem(item.id, { amount: parsed, category, paymentMethod, date })
      onDone()
    } catch (e) {
      setError(apiErrorMessage(e))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-canvas/40 p-4">
      <p className="font-bold">{item.name}</p>
      <Field label="What it cost">
        <div className="relative">
          <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink/60">
            JD
          </span>
          <Input
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(cleanAmountInput(e.target.value))}
            placeholder="0.00"
            className="pl-10 font-mono"
          />
        </div>
      </Field>
      <div>
        <span className="mb-1.5 block text-sm font-bold text-ink">Category</span>
        <CategoryPicker value={category} onChange={setCategory} />
      </div>
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
      {error && (
        <p role="alert" className="text-sm font-bold text-alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={parsed === null || saving} className="flex-1">
          {saving ? 'Saving…' : 'Ink it in'}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

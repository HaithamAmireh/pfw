import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Download, LogOut, Repeat, ShoppingCart, Target, User, Wallet } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { useAuth } from '@/lib/authStore'
import { apiErrorMessage } from '@/lib/api'
import { money } from '@/lib/format'
import { downloadCSV, expensesToCSV } from '@/lib/csv'
import { Button, Card, Field, Input } from '@/components/ui'

export default function SettingsPage() {
  const income = useWallet((s) => s.settings.monthlyIncome)
  const setIncome = useWallet((s) => s.setIncome)
  const expenses = useWallet((s) => s.expenses)
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  const [incomeInput, setIncomeInput] = useState(String(income))
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleSaveIncome(e: React.FormEvent) {
    e.preventDefault()
    const amount = Number(incomeInput)
    if (!amount || amount <= 0) return
    setSaving(true)
    setError('')
    try {
      await setIncome(amount)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch (e) {
      setError(apiErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    await logout()
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <Card padding="md">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded border-3 bg-cash shadow-brut-sm">
            <Wallet className="h-4 w-4 text-paper" strokeWidth={2.5} />
          </div>
          <h2 className="font-display text-lg font-bold">Monthly income</h2>
        </div>
        <form onSubmit={handleSaveIncome} className="flex items-end gap-3">
          <Field label="Take-home income">
            <Input
              inputMode="decimal"
              value={incomeInput}
              onChange={(e) => setIncomeInput(e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </Field>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm font-bold text-alert">{error}</p>}
        <p className="mt-2 text-sm text-ink/50">Currently {money(income)} per month.</p>
      </Card>

      <div className="flex flex-col gap-3">
        <NavCard to="/shopping" icon={<ShoppingCart className="h-5 w-5" strokeWidth={2.5} />} title="Shopping list" desc="Track what to buy, check items off, and log the price" />
        <NavCard to="/recurring" icon={<Repeat className="h-5 w-5" strokeWidth={2.5} />} title="Recurring bills" desc="Manage rent, subscriptions, and fixed monthly costs" />
        <NavCard to="/budgets" icon={<Target className="h-5 w-5" strokeWidth={2.5} />} title="Budgets & goals" desc="Set spending limits and savings targets" />
      </div>

      <Card padding="md">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded border-3 bg-volt shadow-brut-sm">
            <Download className="h-4 w-4 text-ink" strokeWidth={2.5} />
          </div>
          <h2 className="font-display text-lg font-bold">Export your data</h2>
        </div>
        <p className="mb-3 text-sm text-ink/55">
          Download every logged expense as a CSV file, ready for a spreadsheet.
        </p>
        <Button
          variant="secondary"
          disabled={expenses.length === 0}
          onClick={() => downloadCSV(`expenses-all-${Date.now()}.csv`, expensesToCSV(expenses))}
        >
          Export all expenses
        </Button>
      </Card>

      <Card padding="md">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded border-3 bg-canvas">
            <User className="h-4 w-4 text-ink" strokeWidth={2.5} />
          </div>
          <h2 className="font-display text-lg font-bold">Account</h2>
        </div>
        <p className="mb-3 text-sm text-ink/55">
          Signed in as <span className="font-bold text-ink">{user?.email}</span>. Your data is
          tied to this account, so it stays with you across every device you log into.
        </p>
        <Button variant="ghost" onClick={handleLogout} disabled={loggingOut}>
          <LogOut className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </Card>
    </div>
  )
}

function NavCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card padding="md" className="flex items-center gap-3 transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-3 bg-canvas">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold">{title}</p>
          <p className="truncate text-sm text-ink/55">{desc}</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink/40" strokeWidth={2.5} />
      </Card>
    </Link>
  )
}

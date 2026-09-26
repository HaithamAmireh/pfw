import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Download, LogOut } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { useAuth } from '@/lib/authStore'
import { apiErrorMessage } from '@/lib/api'
import { cleanAmountInput, money, parseAmount } from '@/lib/format'
import { downloadCSV, expensesToCSV } from '@/lib/csv'
import { Button, Card, Field, Input, PageHeader, SectionHeading } from '@/components/ui'

export default function More() {
  const income = useWallet((s) => s.settings.monthlyIncome)
  const setIncome = useWallet((s) => s.setIncome)
  const expenses = useWallet((s) => s.expenses)
  const pendingItems = useWallet((s) => s.shoppingItems.filter((i) => !i.checked).length)
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)

  const [incomeInput, setIncomeInput] = useState(income > 0 ? String(income) : '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const parsed = parseAmount(incomeInput)
  const unchanged = parsed === income

  async function handleSaveIncome(e: React.FormEvent) {
    e.preventDefault()
    if (parsed === null) {
      setError('Enter your monthly take-home pay, e.g. 1200')
      return
    }
    setSaving(true)
    setError('')
    try {
      await setIncome(parsed)
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
      <PageHeader title="More" />

      <Card shadow={income > 0 ? 'none' : 'ink'} padding="md">
        <form onSubmit={handleSaveIncome} className="flex flex-col gap-3">
          <Field label="Monthly take-home income" hint="Brought forward into your passbook on the 1st of every month.">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink/60">
                  JD
                </span>
                <Input
                  inputMode="decimal"
                  value={incomeInput}
                  placeholder="0.00"
                  onChange={(e) => {
                    setError('')
                    setIncomeInput(cleanAmountInput(e.target.value))
                  }}
                  className="pl-11 font-mono"
                />
              </div>
              <Button type="submit" disabled={saving || unchanged}>
                {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </Field>
          {error && (
            <p role="alert" className="text-sm font-bold text-alert">
              {error}
            </p>
          )}
          {income > 0 && !error && <p className="text-sm text-ink/60">Currently {money(income)} a month.</p>}
        </form>
      </Card>

      <nav aria-label="More" className="flex flex-col divide-y-2 divide-rule rounded-md border-2 bg-paper">
        <MoreRow to="/shopping" title="Shopping list" detail={pendingItems > 0 ? `${pendingItems} pencilled in` : 'Nothing pencilled in'} />
        <MoreRow to="/analytics" title="Insights" detail="Charts, trends, and price changes" />
      </nav>

      <section aria-labelledby="data-heading">
        <SectionHeading id="data-heading" title="Your data" />
        <Card padding="md" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/60">Every logged expense as a CSV file, ready for a spreadsheet.</p>
            <Button
              variant="secondary"
              size="sm"
              disabled={expenses.length === 0}
              onClick={() => downloadCSV(`ledger-expenses-${Date.now()}.csv`, expensesToCSV(expenses))}
            >
              <Download className="h-4 w-4" strokeWidth={2.5} />
              Export CSV
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-rule pt-4">
            <p className="min-w-0 text-sm text-ink/60">
              Signed in as <span className="break-all font-bold text-ink">{user?.email}</span>
            </p>
            <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loggingOut}>
              <LogOut className="h-4 w-4" strokeWidth={2.5} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </div>
        </Card>
      </section>
    </div>
  )
}

function MoreRow({ to, title, detail }: { to: string; title: string; detail: string }) {
  return (
    <Link to={to} className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-canvas/60">
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block truncate text-sm font-medium text-ink/60">{detail}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink/40" strokeWidth={2.5} />
    </Link>
  )
}

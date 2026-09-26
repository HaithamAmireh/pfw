import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Search, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useWallet } from '@/lib/store'
import { useMonthParam } from '@/lib/useMonthParam'
import { monthLedger } from '@/lib/analytics'
import { CATEGORIES, getCategory } from '@/lib/categories'
import { monthLabel } from '@/lib/date'
import { figure } from '@/lib/format'
import { downloadCSV, expensesToCSV } from '@/lib/csv'
import { Button, EmptyState, Input, Ledger, LedgerRow, PageHeader, Segmented, Select } from '@/components/ui'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import type { CategoryId } from '@/lib/types'

export default function History() {
  const [key, setKey] = useMonthParam()
  const expenses = useWallet((s) => s.expenses)
  const income = useWallet((s) => s.settings.monthlyIncome)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')

  const query = search.trim().toLowerCase()
  const searching = query !== ''

  const ledger = useMemo(() => monthLedger(expenses, income, key), [expenses, income, key])

  // Searching looks across every month; browsing shows one passbook page.
  const rows = useMemo(() => {
    const matchesCategory = (c: CategoryId) => category === 'all' || c === category
    if (searching) {
      return expenses
        .filter(
          (e) =>
            matchesCategory(e.category) &&
            (e.note.toLowerCase().includes(query) || getCategory(e.category).label.toLowerCase().includes(query)),
        )
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .map((expense) => ({ expense, balance: undefined as number | undefined }))
    }
    return ledger.filter((r) => matchesCategory(r.expense.category))
  }, [searching, expenses, query, category, ledger])

  const total = rows.reduce((s, r) => s + r.expense.amount, 0)
  const filtered = searching || category !== 'all'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="History"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => downloadCSV(`ledger-${searching ? 'search' : key}.csv`, expensesToCSV(rows.map((r) => r.expense)))}
            disabled={rows.length === 0}
          >
            <Download className="h-4 w-4" strokeWidth={2.5} />
            Export
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="History view"
          value="passbook"
          options={[
            { id: 'passbook', label: 'Passbook', to: `/history?month=${key}` },
            { id: 'insights', label: 'Insights', to: `/analytics?month=${key}` },
          ]}
        />
        {!searching && <MonthSwitcher value={key} onChange={setKey} />}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" strokeWidth={2.5} />
          <Input
            type="search"
            aria-label="Search every month"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {searching && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="hit absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-ink/60 hover:text-ink"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
        <Select
          aria-label="Filter by category"
          value={category}
          onChange={(e) => setCategory(e.target.value as CategoryId | 'all')}
          className="w-[9.5rem]"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={filtered ? 'No entries match' : `Nothing written in ${monthLabel(key)}`}
          message={filtered ? 'Try another word or category.' : 'Expenses you log this month appear here with a running balance.'}
          action={
            !filtered ? (
              <Link to="/add" className="inline-flex min-h-11 items-center rounded-md border-3 bg-volt px-4 font-display font-bold shadow-brut-sm">
                Log an expense
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="flex justify-between px-0.5 text-sm font-semibold text-ink/60">
            <span>
              {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
              {searching ? ' across all months' : ''}
            </span>
            <span className="tnum">
              Total <b className="text-ink">{figure(total)} JD</b>
            </span>
          </p>
          <Ledger caption={searching ? 'Search results' : `${monthLabel(key)} passbook`} showBalance={!searching}>
            {!searching && category === 'all' && (
              <LedgerRow day="1" title="Income" sub="Brought forward" balance={income} muted />
            )}
            {rows.map(({ expense: e, balance }) => (
              <LedgerRow
                key={e.id}
                to={`/add/${e.id}`}
                day={format(parseISO(e.date), 'd')}
                title={e.note || getCategory(e.category).label}
                category={e.category}
                sub={searching ? format(parseISO(e.date), 'MMM yyyy') : e.isRecurring ? 'Recurring' : undefined}
                debit={e.amount}
                balance={balance}
                showBalance={!searching}
              />
            ))}
          </Ledger>
        </>
      )}
    </div>
  )
}

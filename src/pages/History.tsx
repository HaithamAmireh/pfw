import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, ListOrdered, Search } from 'lucide-react'
import { useWallet } from '@/lib/store'
import { CATEGORIES, getCategory } from '@/lib/categories'
import { CategoryIcon } from '@/lib/icons'
import { money } from '@/lib/format'
import { downloadCSV, expensesToCSV } from '@/lib/csv'
import { Button, Card, EmptyState, Field, Input, Select } from '@/components/ui'
import type { CategoryId } from '@/lib/types'
import { format, parseISO } from 'date-fns'

export default function History() {
  const expenses = useWallet((s) => s.expenses)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => (category === 'all' ? true : e.category === category))
      .filter((e) => (from ? e.date >= from : true))
      .filter((e) => (to ? e.date <= to : true))
      .filter((e) =>
        search.trim() === ''
          ? true
          : e.note.toLowerCase().includes(search.toLowerCase()) ||
            getCategory(e.category).label.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt.localeCompare(a.createdAt)))
  }, [expenses, search, category, from, to])

  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    for (const e of filtered) {
      const arr = map.get(e.date) ?? []
      arr.push(e)
      map.set(e.date, arr)
    }
    return [...map.entries()]
  }, [filtered])

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)

  function handleExport() {
    downloadCSV(`expenses-${Date.now()}.csv`, expensesToCSV(filtered))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">History</h1>
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="mr-1.5 h-4 w-4" strokeWidth={2.5} />
          Export CSV
        </Button>
      </div>

      <Card padding="md" className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" strokeWidth={2.5} />
          <Input
            aria-label="Search notes or categories"
            placeholder="Search notes or categories"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as CategoryId | 'all')}>
              <option value="all">All</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ListOrdered className="h-10 w-10" strokeWidth={1.75} />}
          title="No entries match"
          message="Try widening your filters or search terms."
        />
      ) : (
        <>
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-ink/55">{filtered.length} entries</span>
            <span className="tnum text-sm font-bold text-ink/55">Total {money(total)}</span>
          </div>
          <div className="flex flex-col gap-4">
            {groups.map(([date, items]) => (
              <div key={date}>
                <p className="mb-2 px-1 text-xs font-bold text-ink/45">
                  {format(parseISO(date), 'EEEE, MMM d, yyyy')}
                </p>
                <Card padding="sm" className="divide-y-2 divide-ink/10">
                  {items.map((e) => {
                    const cat = getCategory(e.category)
                    return (
                      <Link
                        key={e.id}
                        to={`/add/${e.id}`}
                        className="flex items-center gap-3 px-1 py-2.5 transition-colors hover:bg-canvas/50"
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-2"
                          style={{ backgroundColor: cat.hex }}
                        >
                          <CategoryIcon
                            name={cat.icon}
                            className={`h-4 w-4 ${cat.textOn === 'paper' ? 'text-paper' : 'text-ink'}`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display font-bold">{e.note || cat.label}</p>
                          <p className="text-xs text-ink/50">{cat.label}</p>
                        </div>
                        <span className="tnum shrink-0 font-display font-bold">{money(e.amount)}</span>
                      </Link>
                    )
                  })}
                </Card>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

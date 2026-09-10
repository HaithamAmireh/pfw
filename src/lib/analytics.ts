import type { Budget, CategoryId, Expense, RecurringExpense } from './types'
import { GROUP_LABELS, getCategory } from './categories'
import {
  dayOfMonthFromISO,
  daysInMonthKey,
  isSameMonthKey,
  last12MonthKeys,
  shiftMonthKey,
  shortMonthLabel,
} from './date'

export function expensesForMonth(expenses: Expense[], key: string): Expense[] {
  return expenses.filter((e) => isSameMonthKey(e.date, key))
}

export function totalForMonth(expenses: Expense[], key: string): number {
  return expensesForMonth(expenses, key).reduce((sum, e) => sum + e.amount, 0)
}

export interface CategoryTotal {
  category: CategoryId
  total: number
  count: number
}

export function categoryBreakdown(expenses: Expense[], key: string): CategoryTotal[] {
  const monthly = expensesForMonth(expenses, key)
  const map = new Map<CategoryId, CategoryTotal>()
  for (const e of monthly) {
    const existing = map.get(e.category)
    if (existing) {
      existing.total += e.amount
      existing.count += 1
    } else {
      map.set(e.category, { category: e.category, total: e.amount, count: 1 })
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

export interface DayTotal {
  day: number
  date: string
  total: number
  cumulative: number
}

export function dailyTrend(expenses: Expense[], key: string): DayTotal[] {
  const monthly = expensesForMonth(expenses, key)
  const days = daysInMonthKey(key)
  const perDay = new Array(days + 1).fill(0)
  for (const e of monthly) {
    perDay[dayOfMonthFromISO(e.date)] += e.amount
  }
  let cumulative = 0
  const out: DayTotal[] = []
  for (let d = 1; d <= days; d++) {
    cumulative += perDay[d]
    out.push({ day: d, date: `${key}-${String(d).padStart(2, '0')}`, total: perDay[d], cumulative })
  }
  return out
}

export interface MonthComparison {
  current: number
  previous: number
  deltaAmount: number
  deltaPct: number | null // null when previous was 0
}

export function monthOverMonth(expenses: Expense[], key: string): MonthComparison {
  const current = totalForMonth(expenses, key)
  const previous = totalForMonth(expenses, shiftMonthKey(key, -1))
  const deltaAmount = current - previous
  const deltaPct = previous === 0 ? null : (deltaAmount / previous) * 100
  return { current, previous, deltaAmount, deltaPct }
}

export interface GroupTotal {
  group: 'essential' | 'subscription' | 'discretionary'
  label: string
  total: number
}

export function groupSplit(expenses: Expense[], key: string): GroupTotal[] {
  const monthly = expensesForMonth(expenses, key)
  const totals: Record<string, number> = { essential: 0, subscription: 0, discretionary: 0 }
  for (const e of monthly) {
    const group = getCategory(e.category).group
    totals[group] += e.amount
  }
  return (['essential', 'subscription', 'discretionary'] as const).map((g) => ({
    group: g,
    label: GROUP_LABELS[g],
    total: totals[g],
  }))
}

export interface MonthTrendPoint {
  key: string
  label: string
  total: number
}

export function trailingTrend(expenses: Expense[], months = 12, fromKey?: string): MonthTrendPoint[] {
  return last12MonthKeys(fromKey).slice(12 - months).map((key) => ({
    key,
    label: shortMonthLabel(key),
    total: totalForMonth(expenses, key),
  }))
}

export function biggestExpense(expenses: Expense[], key: string): Expense | null {
  const monthly = expensesForMonth(expenses, key)
  if (monthly.length === 0) return null
  return monthly.reduce((max, e) => (e.amount > max.amount ? e : max), monthly[0])
}

export function biggestCategory(expenses: Expense[], key: string): CategoryTotal | null {
  const breakdown = categoryBreakdown(expenses, key)
  return breakdown[0] ?? null
}

export function savingsRate(income: number, expenses: Expense[], key: string): number {
  if (income <= 0) return 0
  const spent = totalForMonth(expenses, key)
  return ((income - spent) / income) * 100
}

export interface SubscriptionChange {
  recurring: RecurringExpense
  from: number
  to: number
  date: string
  deltaPct: number
}

export function subscriptionChanges(recurring: RecurringExpense[]): SubscriptionChange[] {
  const out: SubscriptionChange[] = []
  for (const r of recurring) {
    if (r.amountHistory.length < 2) continue
    const sorted = [...r.amountHistory].sort((a, b) => a.date.localeCompare(b.date))
    const from = sorted[sorted.length - 2]
    const to = sorted[sorted.length - 1]
    if (from.amount === to.amount) continue
    out.push({
      recurring: r,
      from: from.amount,
      to: to.amount,
      date: to.date,
      deltaPct: ((to.amount - from.amount) / from.amount) * 100,
    })
  }
  return out
}

export interface BudgetProgress {
  category: Budget['category']
  label: string
  spent: number
  budget: number
  pct: number
  state: 'ok' | 'warning' | 'over'
}

export function budgetProgress(
  expenses: Expense[],
  budgets: Budget[],
  key: string,
): BudgetProgress[] {
  const breakdown = categoryBreakdown(expenses, key)
  const spentByCategory = new Map(breakdown.map((b) => [b.category, b.total]))
  const totalSpent = totalForMonth(expenses, key)

  return budgets.map((b) => {
    const spent = b.category === 'overall' ? totalSpent : spentByCategory.get(b.category) ?? 0
    const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0
    const label = b.category === 'overall' ? 'Overall budget' : getCategory(b.category).label
    const state: BudgetProgress['state'] = pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok'
    return { category: b.category, label, spent, budget: b.amount, pct, state }
  })
}

export function recurringMonthlyTotal(recurring: RecurringExpense[]): number {
  return recurring.filter((r) => r.active).reduce((sum, r) => sum + r.amount, 0)
}

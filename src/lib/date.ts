import { format, getDaysInMonth, parseISO } from 'date-fns'

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function monthKey(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'yyyy-MM')
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMMM yyyy')
}

export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return format(d, 'yyyy-MM')
}

export function daysInMonthKey(key: string): number {
  const [y, m] = key.split('-').map(Number)
  return getDaysInMonth(new Date(y, m - 1, 1))
}

export function isSameMonthKey(dateISO: string, key: string): boolean {
  return monthKey(dateISO) === key
}

export function dayOfMonthFromISO(dateISO: string): number {
  return parseISO(dateISO).getDate()
}

export function last12MonthKeys(fromKey: string = monthKey()): string[] {
  const out: string[] = []
  for (let i = 11; i >= 0; i--) out.push(shiftMonthKey(fromKey, -i))
  return out
}

export function shortMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMM')
}

import type { Expense } from './types'
import { getCategory } from './categories'

export function expensesToCSV(expenses: Expense[]): string {
  const header = ['Date', 'Category', 'Amount', 'Note', 'Payment Method', 'Recurring']
  const rows = expenses.map((e) => [
    e.date,
    getCategory(e.category).label,
    e.amount.toFixed(2),
    csvEscape(e.note),
    e.paymentMethod,
    e.isRecurring ? 'Yes' : 'No',
  ])
  return [header, ...rows].map((r) => r.join(',')).join('\n')
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

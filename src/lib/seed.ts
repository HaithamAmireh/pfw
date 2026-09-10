import type { RecurringExpense, Settings } from './types'

const now = new Date().toISOString()

// Seed recurring expenses from the user's real fixed monthly bills.
export const SEED_RECURRING: Omit<RecurringExpense, 'id'>[] = [
  { name: 'Rent', category: 'housing', amount: 330, dayOfMonth: 1, active: true, paymentMethod: 'bank_transfer', createdAt: now, amountHistory: [{ date: now, amount: 330 }] },
  { name: 'Credit card payment', category: 'debt', amount: 230, dayOfMonth: 5, active: true, paymentMethod: 'bank_transfer', createdAt: now, amountHistory: [{ date: now, amount: 230 }] },
  { name: 'Groceries', category: 'food', amount: 100, dayOfMonth: 1, active: true, paymentMethod: 'card', createdAt: now, amountHistory: [{ date: now, amount: 100 }] },
  { name: 'Jamia', category: 'subscription', amount: 300, dayOfMonth: 1, active: true, paymentMethod: 'card', createdAt: now, amountHistory: [{ date: now, amount: 300 }] },
  { name: 'Claude', category: 'subscription', amount: 15.574, dayOfMonth: 3, active: true, paymentMethod: 'card', createdAt: now, amountHistory: [{ date: now, amount: 15.574 }] },
  { name: 'Game Pass', category: 'subscription', amount: 12.246, dayOfMonth: 14, active: true, paymentMethod: 'card', createdAt: now, amountHistory: [{ date: now, amount: 12.246 }] },
  { name: 'Netflix', category: 'subscription', amount: 7.377, dayOfMonth: 18, active: true, paymentMethod: 'card', createdAt: now, amountHistory: [{ date: now, amount: 7.377 }] },
  { name: 'YouTube', category: 'subscription', amount: 4.83, dayOfMonth: 20, active: true, paymentMethod: 'card', createdAt: now, amountHistory: [{ date: now, amount: 4.83 }] },
  { name: 'Twinkle', category: 'subscription', amount: 3.213, dayOfMonth: 22, active: true, paymentMethod: 'card', createdAt: now, amountHistory: [{ date: now, amount: 3.213 }] },
  { name: 'Car gas', category: 'transport', amount: 50, dayOfMonth: 1, active: true, paymentMethod: 'cash', createdAt: now, amountHistory: [{ date: now, amount: 50 }] },
  { name: 'Internet', category: 'utilities', amount: 26, dayOfMonth: 1, active: true, paymentMethod: 'bank_transfer', createdAt: now, amountHistory: [{ date: now, amount: 26 }] },
  { name: 'Mobile bill', category: 'utilities', amount: 12, dayOfMonth: 1, active: true, paymentMethod: 'card', createdAt: now, amountHistory: [{ date: now, amount: 12 }] },
  { name: 'Electricity', category: 'utilities', amount: 7, dayOfMonth: 1, active: true, paymentMethod: 'bank_transfer', createdAt: now, amountHistory: [{ date: now, amount: 7 }] },
  { name: 'Water bill', category: 'utilities', amount: 3, dayOfMonth: 1, active: true, paymentMethod: 'bank_transfer', createdAt: now, amountHistory: [{ date: now, amount: 3 }] },
  { name: 'Hetzner', category: 'subscription', amount: 9, dayOfMonth: 10, active: true, paymentMethod: 'card', createdAt: now, amountHistory: [{ date: now, amount: 9 }] },
]

export const SEED_SETTINGS: Settings = {
  monthlyIncome: 1887,
  budgets: [],
  savingsGoals: [
    {
      id: 'emergency-fund',
      name: 'Emergency fund',
      target: 3000,
      current: 450,
      createdAt: now,
    },
  ],
}

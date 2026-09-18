export type CategoryId =
  | 'housing'
  | 'food'
  | 'transport'
  | 'subscription'
  | 'utilities'
  | 'debt'
  | 'entertainment'
  | 'other'

export type PaymentMethod = 'card' | 'cash' | 'bank_transfer' | 'cliq' | 'other'

export type SpendGroup = 'essential' | 'subscription' | 'discretionary'

export interface Category {
  id: CategoryId
  label: string
  icon: string // lucide icon name, resolved in ui/icons.tsx
  color: string // tailwind color token, e.g. 'cat-housing'
  hex: string // resolved hex, used directly in chart fills
  textOn: 'ink' | 'paper' // which text color reads best against `color`
  group: SpendGroup // essentials vs subscriptions vs discretionary, used in analytics split
}

export interface Expense {
  id: string
  date: string // ISO date, yyyy-MM-dd
  amount: number
  category: CategoryId
  note: string
  isRecurring: boolean
  recurringId?: string // link back to the RecurringExpense that generated it
  paymentMethod: PaymentMethod
  createdAt: string // ISO timestamp
}

export interface RecurringExpense {
  id: string
  name: string
  category: CategoryId
  amount: number
  active: boolean
  paymentMethod: PaymentMethod
  createdAt: string
  // history of amount changes: { date, amount }[] — used to flag price changes
  amountHistory: { date: string; amount: number }[]
}

export interface Budget {
  category: CategoryId | 'overall'
  amount: number
}

export interface SavingsGoal {
  id: string
  name: string
  target: number
  current: number
  createdAt: string
}

export interface Settings {
  monthlyIncome: number
  budgets: Budget[]
  savingsGoals: SavingsGoal[]
}

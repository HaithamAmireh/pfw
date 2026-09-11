import type { Budget, Expense, PaymentMethod, RecurringExpense, SavingsGoal, Settings, CategoryId } from './types'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string })
    throw new ApiError(body.error || res.statusText, res.status)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface SessionUser {
  id: string
  email: string
}

export interface BootstrapPayload {
  expenses: Expense[]
  recurring: RecurringExpense[]
  settings: Settings
}

export const api = {
  register: (email: string, password: string, signupCode?: string) =>
    request<SessionUser>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, signupCode }),
    }),
  login: (email: string, password: string) =>
    request<SessionUser>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<SessionUser>('/auth/me'),

  bootstrap: () => request<BootstrapPayload>('/bootstrap'),

  createExpense: (input: {
    date: string
    amount: number
    category: CategoryId
    note: string
    paymentMethod: PaymentMethod
  }) => request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(input) }),
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) =>
    request<Expense>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteExpense: (id: string) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),

  createRecurring: (input: {
    name: string
    category: CategoryId
    amount: number
    paymentMethod: PaymentMethod
    dayOfMonth: number
  }) => request<RecurringExpense>('/recurring', { method: 'POST', body: JSON.stringify(input) }),
  updateRecurring: (id: string, patch: Partial<Omit<RecurringExpense, 'id' | 'amountHistory'>>) =>
    request<RecurringExpense>(`/recurring/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteRecurring: (id: string) => request<void>(`/recurring/${id}`, { method: 'DELETE' }),

  setIncome: (amount: number) =>
    request<Settings>('/settings/income', { method: 'PUT', body: JSON.stringify({ amount }) }),
  setBudgets: (budgets: Budget[]) =>
    request<Settings>('/settings/budgets', { method: 'PUT', body: JSON.stringify({ budgets }) }),
  setGoals: (savingsGoals: SavingsGoal[]) =>
    request<Settings>('/settings/goals', { method: 'PUT', body: JSON.stringify({ savingsGoals }) }),
}

export function apiErrorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message
  if (e instanceof Error) return e.message
  return 'Something went wrong'
}

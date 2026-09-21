import { create } from 'zustand'
import type {
  Budget,
  Expense,
  PaymentMethod,
  RecurringExpense,
  SavingsGoal,
  Settings,
  CategoryId,
  ShoppingItem,
} from './types'
import { api, apiErrorMessage } from './api'

interface WalletState {
  loaded: boolean
  error: string | null

  expenses: Expense[]
  recurring: RecurringExpense[]
  settings: Settings
  shoppingItems: ShoppingItem[]

  bootstrap: () => Promise<void>
  reset: () => void
  clearError: () => void

  addExpense: (input: { date: string; amount: number; category: CategoryId; note: string; paymentMethod: PaymentMethod }) => Promise<void>
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) => Promise<void>
  deleteExpense: (id: string) => Promise<void>

  addRecurring: (input: { name: string; category: CategoryId; amount: number; paymentMethod: PaymentMethod }) => Promise<void>
  updateRecurring: (id: string, patch: Partial<Omit<RecurringExpense, 'id' | 'amountHistory'>>) => Promise<void>
  deleteRecurring: (id: string) => Promise<void>
  toggleRecurringActive: (id: string) => Promise<void>

  setIncome: (amount: number) => Promise<void>
  setBudget: (budget: Budget) => Promise<void>
  removeBudget: (category: Budget['category']) => Promise<void>

  addSavingsGoal: (input: Omit<SavingsGoal, 'id' | 'createdAt'>) => Promise<void>
  updateSavingsGoal: (id: string, patch: Partial<Omit<SavingsGoal, 'id'>>) => Promise<void>
  deleteSavingsGoal: (id: string) => Promise<void>

  addShoppingItem: (name: string) => Promise<void>
  deleteShoppingItem: (id: string) => Promise<void>
  checkShoppingItem: (
    id: string,
    input: { amount: number; category: CategoryId; paymentMethod: PaymentMethod; date: string },
  ) => Promise<void>
  uncheckShoppingItem: (id: string) => Promise<void>
}

const EMPTY_SETTINGS: Settings = { monthlyIncome: 0, budgets: [], savingsGoals: [] }

export const useWallet = create<WalletState>((set, get) => ({
  loaded: false,
  error: null,
  expenses: [],
  recurring: [],
  settings: EMPTY_SETTINGS,
  shoppingItems: [],

  bootstrap: async () => {
    try {
      const data = await api.bootstrap()
      set({ ...data, loaded: true, error: null })
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  reset: () =>
    set({ loaded: false, error: null, expenses: [], recurring: [], settings: EMPTY_SETTINGS, shoppingItems: [] }),
  clearError: () => set({ error: null }),

  addExpense: async (input) => {
    try {
      const created = await api.createExpense(input)
      set((s) => ({ expenses: [created, ...s.expenses], error: null }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  updateExpense: async (id, patch) => {
    try {
      const updated = await api.updateExpense(id, patch)
      set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? updated : e)), error: null }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  deleteExpense: async (id) => {
    try {
      await api.deleteExpense(id)
      set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id), error: null }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  addRecurring: async (input) => {
    try {
      const created = await api.createRecurring(input)
      set((s) => ({ recurring: [created, ...s.recurring], error: null }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  updateRecurring: async (id, patch) => {
    try {
      const updated = await api.updateRecurring(id, patch)
      set((s) => ({ recurring: s.recurring.map((r) => (r.id === id ? updated : r)), error: null }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  deleteRecurring: async (id) => {
    try {
      await api.deleteRecurring(id)
      set((s) => ({ recurring: s.recurring.filter((r) => r.id !== id), error: null }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  toggleRecurringActive: async (id) => {
    const current = get().recurring.find((r) => r.id === id)
    if (!current) return
    await get().updateRecurring(id, { active: !current.active })
  },

  setIncome: async (amount) => {
    try {
      const settings = await api.setIncome(amount)
      set({ settings, error: null })
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  setBudget: async (budget) => {
    const next = [...get().settings.budgets.filter((b) => b.category !== budget.category), budget]
    try {
      const settings = await api.setBudgets(next)
      set({ settings, error: null })
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  removeBudget: async (category) => {
    const next = get().settings.budgets.filter((b) => b.category !== category)
    try {
      const settings = await api.setBudgets(next)
      set({ settings, error: null })
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  addSavingsGoal: async (input) => {
    const goal: SavingsGoal = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    const next = [...get().settings.savingsGoals, goal]
    try {
      const settings = await api.setGoals(next)
      set({ settings, error: null })
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  updateSavingsGoal: async (id, patch) => {
    const next = get().settings.savingsGoals.map((g) => (g.id === id ? { ...g, ...patch } : g))
    try {
      const settings = await api.setGoals(next)
      set({ settings, error: null })
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  deleteSavingsGoal: async (id) => {
    const next = get().settings.savingsGoals.filter((g) => g.id !== id)
    try {
      const settings = await api.setGoals(next)
      set({ settings, error: null })
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  addShoppingItem: async (name) => {
    try {
      const created = await api.createShoppingItem(name)
      set((s) => ({ shoppingItems: [created, ...s.shoppingItems], error: null }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  deleteShoppingItem: async (id) => {
    try {
      await api.deleteShoppingItem(id)
      set((s) => ({ shoppingItems: s.shoppingItems.filter((i) => i.id !== id), error: null }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  checkShoppingItem: async (id, input) => {
    try {
      const { item, expense } = await api.checkShoppingItem(id, input)
      set((s) => ({
        shoppingItems: s.shoppingItems.map((i) => (i.id === id ? item : i)),
        expenses: [expense, ...s.expenses],
        error: null,
      }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },

  uncheckShoppingItem: async (id) => {
    try {
      const { item, deletedExpenseId } = await api.uncheckShoppingItem(id)
      set((s) => ({
        shoppingItems: s.shoppingItems.map((i) => (i.id === id ? item : i)),
        expenses: deletedExpenseId ? s.expenses.filter((e) => e.id !== deletedExpenseId) : s.expenses,
        error: null,
      }))
    } catch (e) {
      set({ error: apiErrorMessage(e) })
      throw e
    }
  },
}))

export type { CategoryId, PaymentMethod }

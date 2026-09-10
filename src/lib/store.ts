import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Budget, Expense, PaymentMethod, RecurringExpense, SavingsGoal, Settings, CategoryId } from './types'
import { SEED_RECURRING, SEED_SETTINGS } from './seed'
import { dateForDayInMonth, dayOfMonthFromISO, isSameMonthKey, monthKey, todayISO } from './date'

interface WalletState {
  expenses: Expense[]
  recurring: RecurringExpense[]
  settings: Settings

  addExpense: (input: Omit<Expense, 'id' | 'createdAt'>) => void
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id'>>) => void
  deleteExpense: (id: string) => void

  addRecurring: (input: Omit<RecurringExpense, 'id' | 'createdAt' | 'amountHistory'>) => void
  updateRecurring: (id: string, patch: Partial<Omit<RecurringExpense, 'id'>>) => void
  deleteRecurring: (id: string) => void
  toggleRecurringActive: (id: string) => void

  ensureRecurringGenerated: (key?: string) => void

  setIncome: (amount: number) => void
  setBudget: (budget: Budget) => void
  removeBudget: (category: Budget['category']) => void

  addSavingsGoal: (input: Omit<SavingsGoal, 'id' | 'createdAt'>) => void
  updateSavingsGoal: (id: string, patch: Partial<Omit<SavingsGoal, 'id'>>) => void
  deleteSavingsGoal: (id: string) => void
}

// Captured from inside the creator below so onRehydrateStorage can call them
// without touching the `useWallet` binding — persist() hydrates synchronously
// for localStorage, which runs before `const useWallet = create(...)` finishes
// assigning, so referencing `useWallet` there throws (temporal dead zone) and
// silently aborts hydration. The creator runs first, so set/get are ready by
// the time hydrate() calls onRehydrateStorage.
let boundSet: (partial: Partial<WalletState> | ((s: WalletState) => Partial<WalletState>)) => void
let boundGet: () => WalletState

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => {
      boundSet = set
      boundGet = get
      return {
      expenses: [],
      recurring: [],
      settings: SEED_SETTINGS,

      addExpense: (input) =>
        set((s) => ({
          expenses: [
            { ...input, id: uuid(), createdAt: new Date().toISOString() },
            ...s.expenses,
          ],
        })),

      updateExpense: (id, patch) =>
        set((s) => ({
          expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),

      deleteExpense: (id) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      addRecurring: (input) =>
        set((s) => ({
          recurring: [
            {
              ...input,
              id: uuid(),
              createdAt: new Date().toISOString(),
              amountHistory: [{ date: new Date().toISOString(), amount: input.amount }],
            },
            ...s.recurring,
          ],
        })),

      updateRecurring: (id, patch) =>
        set((s) => ({
          recurring: s.recurring.map((r) => {
            if (r.id !== id) return r
            const next = { ...r, ...patch }
            if (typeof patch.amount === 'number' && patch.amount !== r.amount) {
              next.amountHistory = [
                ...r.amountHistory,
                { date: new Date().toISOString(), amount: patch.amount },
              ]
            }
            return next
          }),
        })),

      deleteRecurring: (id) =>
        set((s) => ({ recurring: s.recurring.filter((r) => r.id !== id) })),

      toggleRecurringActive: (id) =>
        set((s) => ({
          recurring: s.recurring.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
        })),

      ensureRecurringGenerated: (key = monthKey()) => {
        const s = get()
        const isCurrent = key === monthKey()
        const todayDay = dayOfMonthFromISO(todayISO())
        const toCreate: Expense[] = []

        for (const item of s.recurring) {
          if (!item.active) continue
          const eligible = !isCurrent || item.dayOfMonth <= todayDay
          if (!eligible) continue

          const alreadyExists = s.expenses.some(
            (e) => e.recurringId === item.id && isSameMonthKey(e.date, key),
          )
          if (alreadyExists) continue

          toCreate.push({
            id: uuid(),
            date: dateForDayInMonth(key, item.dayOfMonth),
            amount: item.amount,
            category: item.category,
            note: item.name,
            isRecurring: true,
            recurringId: item.id,
            paymentMethod: item.paymentMethod,
            createdAt: new Date().toISOString(),
          })
        }

        if (toCreate.length > 0) {
          set((state) => ({ expenses: [...toCreate, ...state.expenses] }))
        }
      },

      setIncome: (amount) =>
        set((s) => ({ settings: { ...s.settings, monthlyIncome: amount } })),

      setBudget: (budget) =>
        set((s) => ({
          settings: {
            ...s.settings,
            budgets: [
              ...s.settings.budgets.filter((b) => b.category !== budget.category),
              budget,
            ],
          },
        })),

      removeBudget: (category) =>
        set((s) => ({
          settings: {
            ...s.settings,
            budgets: s.settings.budgets.filter((b) => b.category !== category),
          },
        })),

      addSavingsGoal: (input) =>
        set((s) => ({
          settings: {
            ...s.settings,
            savingsGoals: [
              ...s.settings.savingsGoals,
              { ...input, id: uuid(), createdAt: new Date().toISOString() },
            ],
          },
        })),

      updateSavingsGoal: (id, patch) =>
        set((s) => ({
          settings: {
            ...s.settings,
            savingsGoals: s.settings.savingsGoals.map((g) =>
              g.id === id ? { ...g, ...patch } : g,
            ),
          },
        })),

      deleteSavingsGoal: (id) =>
        set((s) => ({
          settings: {
            ...s.settings,
            savingsGoals: s.settings.savingsGoals.filter((g) => g.id !== id),
          },
        })),
      }
    },
    {
      name: 'ledger-wallet-v1',
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // first-ever load: no persisted recurring items yet, so seed them
        if (state.recurring.length === 0 && state.expenses.length === 0) {
          boundSet({ recurring: SEED_RECURRING.map((r) => ({ ...r, id: uuid() })) })
        }
        boundGet().ensureRecurringGenerated()
      },
    },
  ),
)

export type { CategoryId, PaymentMethod }

// Local storage hydration happens after first mount, so a page can flash
// empty before seed data lands. Gate first paint on this instead.
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useWallet.persist.hasHydrated())

  useEffect(() => {
    if (useWallet.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useWallet.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  return hydrated
}

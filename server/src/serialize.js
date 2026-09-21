export function expenseToJson(row) {
  return {
    id: row.id,
    date: row.date,
    amount: row.amount,
    category: row.category,
    note: row.note,
    isRecurring: !!row.is_recurring,
    recurringId: row.recurring_id ?? undefined,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
  }
}

export function recurringToJson(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    amount: row.amount,
    active: !!row.active,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    amountHistory: JSON.parse(row.amount_history),
  }
}

export function shoppingItemToJson(row) {
  return {
    id: row.id,
    name: row.name,
    checked: !!row.checked,
    expenseId: row.expense_id ?? undefined,
    createdAt: row.created_at,
    checkedAt: row.checked_at ?? undefined,
  }
}

export function settingsToJson(row) {
  if (!row) return { monthlyIncome: 0, budgets: [], savingsGoals: [] }
  return {
    monthlyIncome: row.monthly_income,
    budgets: JSON.parse(row.budgets),
    savingsGoals: JSON.parse(row.savings_goals),
  }
}

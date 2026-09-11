import { randomUUID } from 'node:crypto'
import { db } from './db.js'
import { monthKeyOf, dateForDayInMonth } from './dates.js'

const insertExpense = db.prepare(`
  INSERT INTO expenses (id, user_id, date, amount, category, note, is_recurring, recurring_id, payment_method, created_at)
  VALUES (@id, @user_id, @date, @amount, @category, @note, 1, @recurring_id, @payment_method, @created_at)
`)

const existsForMonth = db.prepare(`
  SELECT 1 FROM expenses WHERE user_id = ? AND recurring_id = ? AND date LIKE ? LIMIT 1
`)

const activeRecurringForUser = db.prepare(
  'SELECT * FROM recurring_expenses WHERE user_id = ? AND active = 1',
)

// Auto-populates this month's expense rows from each active recurring bill,
// once its billing day has arrived — mirrors ensureRecurringGenerated() that
// used to run client-side against localStorage.
export function ensureRecurringGenerated(userId, key = monthKeyOf()) {
  const isCurrent = key === monthKeyOf()
  const todayDay = new Date().getDate()
  const items = activeRecurringForUser.all(userId)

  const tx = db.transaction(() => {
    for (const item of items) {
      if (isCurrent && item.day_of_month > todayDay) continue
      if (existsForMonth.get(userId, item.id, `${key}%`)) continue

      insertExpense.run({
        id: randomUUID(),
        user_id: userId,
        date: dateForDayInMonth(key, item.day_of_month),
        amount: item.amount,
        category: item.category,
        note: item.name,
        recurring_id: item.id,
        payment_method: item.payment_method,
        created_at: new Date().toISOString(),
      })
    }
  })
  tx()
}
